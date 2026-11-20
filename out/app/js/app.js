// app.js — the boot module: owns the save, the hash route and the filters, and
// hands a context object to the checklist, roadmap and tracker views.

import { loadGuide } from './data.js';
import { renderMasthead, renderChecklist } from './ui.js';
import { renderRoadmap } from './roadmap.js';
import { renderTracker, notice } from './tracker.js';

const STORAGE_KEY = 'gta6.fieldguide.v1';
const SAVE_VERSION = 1;
const VIEWS = new Set(['checklist', 'roadmap', 'tracker']);

// ---------- the save ----------

function emptySave() {
  return { v: SAVE_VERSION, earned: {}, spoilers: true };
}

function readSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptySave();
    const earned = {};
    const source = parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {};
    for (const [key, value] of Object.entries(source)) {
      const id = Number(key);
      if (Number.isInteger(id) && id > 0) earned[id] = Number(value) || 0;
    }
    return { v: SAVE_VERSION, earned, spoilers: parsed.spoilers !== false };
  } catch {
    return emptySave();
  }
}

function writeSave(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SAVE_VERSION, earned: state.earned, spoilers: state.spoilers }));
    return true;
  } catch {
    return false;
  }
}

function createStore() {
  const state = readSave();
  const listeners = new Set();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    get spoilers() {
      return state.spoilers;
    },
    isEarned(id) {
      return Object.prototype.hasOwnProperty.call(state.earned, id);
    },
    earnedCount() {
      return Object.keys(state.earned).length;
    },
    setSpoilers(on) {
      state.spoilers = Boolean(on);
      writeSave(state);
      emit();
    },
    toggle(id) {
      if (Object.prototype.hasOwnProperty.call(state.earned, id)) delete state.earned[id];
      else state.earned[id] = Math.floor(Date.now() / 1000);
      writeSave(state);
      emit();
    },
    reset() {
      state.earned = {};
      writeSave(state);
      emit();
    },
    exportJSON() {
      return JSON.stringify({ v: SAVE_VERSION, earned: state.earned, spoilers: state.spoilers }, null, 2);
    },
    importJSON(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('that file is not JSON');
      }
      if (!parsed || typeof parsed !== 'object' || parsed.v !== SAVE_VERSION || typeof parsed.earned !== 'object' || parsed.earned === null) {
        throw new Error('this file is not a Leonida Field Guide save');
      }
      const earned = {};
      for (const [key, value] of Object.entries(parsed.earned)) {
        const id = Number(key);
        if (Number.isInteger(id) && id > 0) earned[id] = Number(value) || 0;
      }
      state.earned = earned;
      if (typeof parsed.spoilers === 'boolean') state.spoilers = parsed.spoilers;
      writeSave(state);
      emit();
      return Object.keys(earned).length;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---------- the route ----------

function readRoute() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const view = params.get('view');
  const trophy = Number(params.get('trophy'));
  return {
    view: VIEWS.has(view) ? view : 'checklist',
    trophy: Number.isInteger(trophy) && trophy > 0 ? trophy : null,
    kind: params.get('kind') || 'all',
    grade: params.get('grade') || 'all',
    query: params.get('q') || '',
    groupBy: params.get('group') === 'grade' ? 'grade' : 'stage',
    onlyRemaining: params.get('remaining') === '1',
    spoilers: params.get('spoilers') === 'off' ? false : null,
    focusStage: params.get('stage') ? Number(params.get('stage')) : null,
  };
}

function writeRoute(state) {
  const params = new URLSearchParams();
  if (state.view !== 'checklist') params.set('view', state.view);
  if (state.selectedId !== null) params.set('trophy', String(state.selectedId));
  if (state.filters.kind !== 'all') params.set('kind', state.filters.kind);
  if (state.filters.grade !== 'all') params.set('grade', state.filters.grade);
  if (state.filters.query) params.set('q', state.filters.query);
  if (state.filters.groupBy !== 'stage') params.set('group', state.filters.groupBy);
  if (state.filters.onlyRemaining) params.set('remaining', '1');
  if (!state.store.spoilers) params.set('spoilers', 'off');
  const next = params.toString();
  const url = next ? `#${next}` : window.location.pathname + window.location.search;
  window.history.replaceState(null, '', url);
}

// ---------- boot ----------

async function main() {
  const dom = {
    progressCount: document.getElementById('progress-count'),
    platinumRail: document.getElementById('platinum-rail'),
    platinumFill: document.getElementById('platinum-fill'),
    railCaption: document.getElementById('rail-caption'),
    gradeMarks: document.getElementById('grade-marks'),
    trophyList: document.getElementById('trophy-list'),
    detail: document.getElementById('detail'),
    filterSummary: document.getElementById('filter-summary'),    search: document.getElementById('search'),
    kind: document.getElementById('filter-kind'),
    grade: document.getElementById('filter-grade'),
    groupBy: document.getElementById('group-by'),
    onlyRemaining: document.getElementById('only-remaining'),
    spoilerToggle: document.getElementById('spoiler-toggle'),
    roadmap: document.getElementById('roadmap'),
    tracker: document.getElementById('tracker'),
    trackerNotice: null,
    tabsNote: document.getElementById('tabs-note'),
    views: {
      checklist: document.getElementById('view-checklist'),
      roadmap: document.getElementById('view-roadmap'),
      tracker: document.getElementById('view-tracker'),
    },
    tabs: [...document.querySelectorAll('.tab')],
  };

  let guide;
  try {
    guide = await loadGuide('data/trophies.json');
  } catch (error) {
    dom.trophyList.append(Object.assign(document.createElement('p'), { className: 'empty', textContent: `The guide could not be loaded: ${error.message}` }));
    return;
  }

  const store = createStore();
  const route = readRoute();

  const app = {
    guide,
    store,
    dom,
    selectedId: route.trophy,
    filters: {
      kind: route.kind,
      grade: route.grade,
      query: route.query,
      groupBy: route.groupBy,
      onlyRemaining: route.onlyRemaining,
    },
    actions: {},
  };

  if (route.spoilers !== null && route.spoilers !== store.spoilers) store.setSpoilers(route.spoilers);
  dom.spoilerToggle.checked = store.spoilers;

  const TAB_NOTE = {
    checklist: 'Every trophy, every guide',
    roadmap: 'The order to earn them in',
    tracker: 'Progress, hours and missables',
  };

  function paint() {
    app.state = { spoilers: store.spoilers, isEarned: (id) => store.isEarned(id) };
    for (const [name, section] of Object.entries(dom.views)) section.hidden = name !== app.view;
    for (const tab of dom.tabs) {
      if (tab.dataset.view === app.view) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
    dom.tabsNote.textContent = TAB_NOTE[app.view] ?? '';
    renderMasthead(app);
    if (app.view === 'checklist') renderChecklist(app);
    if (app.view === 'roadmap') renderRoadmap(app);
    if (app.view === 'tracker') renderTracker(app);
  }

  function go(next) {
    Object.assign(app, next);
    writeRoute(app);
    paint();
  }

  app.view = route.view;

  app.actions.select = (id, options = {}) => {
    const next = { selectedId: app.selectedId === id && !options.switchToChecklist ? null : id };
    if (options.switchToChecklist) next.view = 'checklist';
    go(next);
    if (app.view === 'checklist' && app.selectedId !== null) {
      const row = dom.trophyList.querySelector(`[data-trophy="${id}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    }
  };

  app.actions.toggle = (id) => {
    store.toggle(id);
  };

  app.actions.openView = (view, options = {}) => {
    go({ view, focusStage: options.focusStage ?? null });
    if (options.focusStage) {
      const block = dom.roadmap.querySelectorAll('.stage')[options.focusStage - 1];
      if (block) block.scrollIntoView({ block: 'start' });
    }
  };

  app.actions.exportFile = () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'leonida-field-guide-progress.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (dom.trackerNotice) notice(app, `Exported ${store.earnedCount()} earned trophies.`);
  };

  app.actions.importFile = async (file) => {
    if (!file) return;
    try {
      const count = store.importJSON(await file.text());
      notice(app, `Imported a save with ${count} earned trophies.`);
    } catch (error) {
      notice(app, `That file could not be imported: ${error.message}.`, true);
    }
    const input = document.getElementById('import-input');
    if (input) input.value = '';
  };

  app.actions.reset = () => {
    if (!window.confirm('Clear every ticked trophy in this browser? Export first if you want a copy.')) return;
    store.reset();
    notice(app, 'Progress cleared.');
  };

  store.subscribe(paint);

  dom.tabs.forEach((tab) => {
    tab.addEventListener('click', () => go({ view: tab.dataset.view }));
  });

  dom.search.addEventListener('input', () => {
    app.filters.query = dom.search.value;
    writeRoute(app);
    renderChecklist(app);
  });

  dom.kind.addEventListener('change', () => {
    app.filters.kind = dom.kind.value;
    writeRoute(app);
    renderChecklist(app);
  });

  dom.grade.addEventListener('change', () => {
    app.filters.grade = dom.grade.value;
    writeRoute(app);
    renderChecklist(app);
  });

  dom.groupBy.addEventListener('change', () => {
    app.filters.groupBy = dom.groupBy.value;
    writeRoute(app);
    renderChecklist(app);
  });

  dom.onlyRemaining.addEventListener('change', () => {
    app.filters.onlyRemaining = dom.onlyRemaining.checked;
    writeRoute(app);
    renderChecklist(app);
  });

  dom.spoilerToggle.addEventListener('change', () => {
    store.setSpoilers(dom.spoilerToggle.checked);
  });

  window.addEventListener('hashchange', () => {
    const next = readRoute();
    app.view = next.view;
    app.selectedId = next.trophy;
    app.filters = {
      kind: next.kind,
      grade: next.grade,
      query: next.query,
      groupBy: next.groupBy,
      onlyRemaining: next.onlyRemaining,
    };
    if (next.spoilers !== null) store.setSpoilers(next.spoilers);
    syncControls();
    paint();
  });

  function syncControls() {
    dom.search.value = app.filters.query;
    dom.kind.value = app.filters.kind;
    dom.grade.value = app.filters.grade;
    dom.groupBy.value = app.filters.groupBy;
    dom.onlyRemaining.checked = app.filters.onlyRemaining;
    dom.spoilerToggle.checked = store.spoilers;
  }

  syncControls();
  paint();
}

main();
