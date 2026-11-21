// Leonida Field Guide - entirely local, no third-party runtime dependencies.

const SAVE_KEY = 'leonida-field-guide:v2';
const MEDALS = ['platinum', 'gold', 'silver', 'bronze'];
const FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'combat', 'exploration', 'online'];
const FILTER_NAMES = {
  all: 'All', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', combat: 'Combat', exploration: 'Exploration', online: 'Online'
};
const STAGES = [
  ['Opening hours', 'Secure the first chapter and early close-outs.'],
  ['The partnership opens', 'Advance the partnership and Chapter 2.'],
  ['The city opens', 'Clear Chapter 3 options before later closures.'],
  ['Vaults and Chapter 4', 'Prepare bank work and finish Chapter 4.'],
  ['Finale and credits', 'Complete the finale and retain a cleanup save.'],
  ['Money and property', 'Close financial targets and garage ownership.'],
  ['Activities and collections', 'Work repeatable totals and collection sets.'],
  ['Strands and choices', 'Finish character strands and partner choices.'],
  ['The 100 percent road', 'Finish Leonida-wide totals and claim platinum.']
];

let records = [];
let selected = null;
let activeView = 'checklist';
let searchText = '';
let medalFilter = 'all';
let kindFilter = 'all';
let grouping = 'stage';
let remainingOnly = false;
let openStage = null;
let rowCursor = 0;
let waitingForView = false;
let guard = true;
const earned = new Map();

function node(selector) { return document.querySelector(selector); }
function escapeText(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}
function titleCase(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function earnedCheck(record) { return earned.has(record.id); }
function isMasked(record) { return guard && record.kind === 'story' && !earnedCheck(record); }
function medalMarkup(medal) { return `<span class="medal ${medal}">${medal}</span>`; }

function loadSave() {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (save && save.version === 2) {
      Object.entries(save.earned || {}).forEach(([id, time]) => earned.set(Number(id), time));
      guard = save.guard !== false;
    }
  } catch {
    announce('The saved tracker could not be read.');
  }
}

function writeSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      earned: Object.fromEntries(earned),
      guard
    }));
  } catch {
    announce('This browser could not save tracker progress.');
  }
}

function announce(text) {
  const footer = document.querySelector('footer');
  if (footer) footer.dataset.notice = text;
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.set(id, Date.now());
  writeSave();
  redraw();
}

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const trophyId = Number(params.get('trophy'));
  if (records.some((record) => record.id === trophyId)) {
    selected = trophyId;
    activeView = 'checklist';
  } else {
    activeView = ['missables', 'roadmap', 'tracker'].includes(params.get('view'))
      ? params.get('view')
      : 'checklist';
  }
  if (FILTERS.includes(params.get('kind'))) kindFilter = params.get('kind');
  if (MEDALS.includes(params.get('grade'))) medalFilter = params.get('grade');
  if (params.has('guard')) guard = params.get('guard') !== 'off';
  const stage = Number(params.get('stage'));
  if (stage >= 1 && stage <= 9) openStage = stage;
  writeSave();
}

function writeHash() {
  const params = new URLSearchParams();
  params.set('view', activeView);
  if (selected !== null) params.set('trophy', String(selected));
  if (kindFilter !== 'all') params.set('kind', kindFilter);
  if (medalFilter !== 'all') params.set('grade', medalFilter);
  params.set('guard', guard ? 'on' : 'off');
  location.hash = params.toString();
}

function visibleRecords() {
  const needle = searchText.trim().toLowerCase();
  const result = records.filter((record) => {
    if (kindFilter === 'missable' ? !record.missable : kindFilter !== 'all' && record.kind !== kindFilter) return false;
    if (medalFilter !== 'all' && record.grade !== medalFilter) return false;
    if (remainingOnly && earnedCheck(record)) return false;
    if (!needle) return true;
    if (isMasked(record)) return 'hidden story trophy'.includes(needle);
    return `${record.name} ${record.description} ${record.kind} ${record.chapter}`.toLowerCase().includes(needle);
  });
  return result.sort((first, second) =>
    (grouping === 'grade'
      ? MEDALS.indexOf(first.grade) - MEDALS.indexOf(second.grade)
      : first.roadmapStage - second.roadmapStage) || first.id - second.id
  );
}

function renderHeader() {
  const totalEarned = earned.size;
  node('#earned-figure').textContent = `${totalEarned} of 55`;
  node('#progress-track').setAttribute('aria-valuenow', String(totalEarned));
  node('#progress-track span').style.width = `${totalEarned / 55 * 100}%`;
  node('#grade-totals').innerHTML = MEDALS.map((medal) => {
    const got = records.filter((record) => record.grade === medal && earnedCheck(record)).length;
    const total = records.filter((record) => record.grade === medal).length;
    return `<span class="grade-total">${medalMarkup(medal)} <strong>${got}/${total}</strong></span>`;
  }).join('');
  node('#missables-left').textContent = String(records.filter((record) => record.missable && !earnedCheck(record)).length);
  document.querySelectorAll('.tabs a').forEach((link) =>
    link.classList.toggle('active', link.dataset.view === activeView));

  const next = records.find((record) => !earnedCheck(record));
  node('#do-next-button').disabled = !next;
  node('#do-next-button').onclick = () => {
    if (!next) {
      activeView = 'tracker';
      location.hash = '#view=tracker';
    } else {
      selected = next.id;
      activeView = 'checklist';
      location.hash = `#trophy=${next.id}`;
    }
  };
}

function trophyRow(record) {
  const masked = isMasked(record);
  const name = masked ? 'Hidden story trophy' : record.name;
  const description = masked ? 'Held behind the spoiler guard.' : record.description;
  const meta = masked
    ? 'Story'
    : `${record.kind} · ${record.chapter}${record.count != null ? ` · Target ${Number(record.count).toLocaleString()}` : ''}${record.missable ? ' · Missable' : ''}`;
  return `<article class="trophy-row${earnedCheck(record) ? ' done' : ''}">
    <label class="row-check"><input type="checkbox" data-earn="${record.id}" ${earnedCheck(record) ? 'checked' : ''} aria-label="Mark ${escapeText(name)} earned"></label>
    <button type="button" class="row-open${selected === record.id ? ' selected' : ''}" data-open="${record.id}">
      <span><b class="row-name">${escapeText(name)}</b><span class="row-description">${escapeText(description)}</span><span class="row-meta">${escapeText(meta)}</span></span>
      <span class="row-side">${medalMarkup(record.grade)}<span>Stage ${record.roadmapStage}</span></span>
    </button>
  </article>`;
}

function detailMarkup() {
  const record = records.find((item) => item.id === selected);
  if (!record) {
    return `<div class="detail-inner"><p class="kicker">Field note</p><h2>Choose a trophy</h2><p class="official">The guide, steps and sources open alongside the checklist.</p></div>`;
  }
  if (isMasked(record)) {
    return `<div class="detail-inner">
      <div class="detail-facts">${medalMarkup(record.grade)}<span>Story trophy</span></div>
      <h2 class="guard-name">Hidden story trophy</h2>
      <p class="official">Held back by the spoiler guard.</p>
      <p class="guide-copy">Earn the record or switch the guard off to reveal its official wording and guide.</p>
      <button type="button" class="mark-button" data-earn="${record.id}">${earnedCheck(record) ? 'Mark not earned' : 'Mark earned'}</button>
    </div>`;
  }
  const warning = record.missable
    ? `<div class="warning"><b>Missable</b><p>${escapeText(record.missableNote)}</p></div>`
    : '';
  return `<div class="detail-inner">
    <div class="detail-facts">${medalMarkup(record.grade)}<span>${escapeText(titleCase(record.kind))}</span><span>${escapeText(record.chapter)}</span><span>#${record.id} / 55</span>${record.hidden ? '<span>Hidden on PSN</span>' : ''}</div>
    <h2>${escapeText(record.name)}</h2>
    <p class="official">${escapeText(record.description)}</p>
    ${warning}
    <h3>Guide</h3>
    <p class="guide-copy">${escapeText(record.guide)}</p>
    <h3>Steps</h3>
    <ol>${record.steps.map((step) => `<li>${escapeText(step)}</li>`).join('')}</ol>
    <h3>Sources</h3>
    <ul>${record.sources.map((source) => `<li><a href="${escapeText(source.url)}" target="_blank" rel="noopener noreferrer">${escapeText(source.label)}</a></li>`).join('')}</ul>
    <button type="button" class="mark-button" data-earn="${record.id}">${earnedCheck(record) ? 'Mark not earned' : 'Mark earned'}</button>
  </div>`;
}

function bindEarnControls(root = document) {
  root.querySelectorAll('[data-earn]').forEach((control) => {
    const action = () => toggleEarned(Number(control.dataset.earn));
    if (control.type === 'checkbox') control.onchange = action;
    else control.onclick = action;
  });
}

function renderChecklist() {
  node('#search').value = searchText;
  node('#grade-filter').value = medalFilter;
  node('#group-filter').value = grouping;
  node('#remaining-filter').checked = remainingOnly;
  node('#guard-filter').checked = guard;
  node('#kind-tabs').innerHTML = FILTERS.map((filter) =>
    `<button type="button" class="${kindFilter === filter ? 'active' : ''}" data-kind="${filter}" aria-pressed="${kindFilter === filter}">${FILTER_NAMES[filter]}</button>`
  ).join('');
  node('#kind-tabs').querySelectorAll('[data-kind]').forEach((button) => {
    button.onclick = () => { kindFilter = button.dataset.kind; writeHash(); redraw(); };
  });

  const list = visibleRecords();
  node('#result-count').textContent = `${list.length} of ${records.length} trophies shown`;
  if (!list.length) {
    const complete = earned.size === records.length;
    node('#trophy-list').innerHTML = complete
      ? `<div class="empty-state"><h3>Every trophy is earned.</h3><p>The route and tracker are ready for a final backup.</p></div>`
      : `<div class="empty-state"><h3>No trophies match.</h3><p>Clear the search or change the kind and medal filters.</p><button type="button" class="small-button" data-clear>Clear filters</button></div>`;
  } else {
    const groups = new Map();
    list.forEach((record) => {
      const label = grouping === 'grade'
        ? titleCase(record.grade)
        : `Stage ${record.roadmapStage} · ${STAGES[record.roadmapStage - 1][0]}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(record);
    });
    node('#trophy-list').innerHTML = [...groups].map(([label, items]) =>
      `<h2 class="group-title">${escapeText(label)}</h2>${items.map(trophyRow).join('')}`
    ).join('');
  }
  node('#detail-panel').innerHTML = detailMarkup();
  node('#trophy-list').querySelectorAll('[data-open]').forEach((button) => {
    button.onclick = () => { selected = Number(button.dataset.open); writeHash(); redraw(); };
  });
  bindEarnControls(node('#trophy-list'));
  bindEarnControls(node('#detail-panel'));
  const clear = node('[data-clear]');
  if (clear) clear.onclick = () => {
    searchText = ''; medalFilter = 'all'; kindFilter = 'all'; remainingOnly = false;
    writeHash(); redraw();
  };
}

function renderMissables() {
  const list = records.filter((record) => record.missable);
  node('#missable-list').innerHTML = list.map((record) =>
    `<article class="missable-card${earnedCheck(record) ? ' done' : ''}">
      <div>${medalMarkup(record.grade)}</div>
      <div><p class="missable-stage">Stage ${record.roadmapStage} · ${escapeText(STAGES[record.roadmapStage - 1][0])}</p><h3>${escapeText(record.name)}</h3><p class="official">${escapeText(record.description)}</p></div>
      <div><p class="missable-note">${escapeText(record.missableNote)}</p><div class="card-actions"><a class="small-button" href="#trophy=${record.id}&guard=off">Open guide</a><button type="button" class="small-button${earnedCheck(record) ? '' : ' solid'}" data-earn="${record.id}">${earnedCheck(record) ? 'Mark not earned' : 'Mark earned'}</button></div></div>
    </article>`
  ).join('');
  bindEarnControls(node('#missable-list'));
}

function renderRoadmap() {
  const next = records.find((record) => !earnedCheck(record));
  node('#do-next-line').innerHTML = next
    ? `<strong>Do next:</strong> Stage ${next.roadmapStage} · ${escapeText(next.name)}. <a href="#trophy=${next.id}&guard=off">Open guide</a>`
    : '<strong>Route complete:</strong> all 55 trophies are earned.';
  node('#roadmap-list').innerHTML = STAGES.map((stage, index) => {
    const number = index + 1;
    const items = records.filter((record) => record.roadmapStage === number);
    const got = items.filter(earnedCheck).length;
    const expanded = openStage === null ? number === (next ? next.roadmapStage : 9) : openStage === number;
    return `<section class="roadmap-stage">
      <button type="button" class="roadmap-head" data-stage="${number}" aria-expanded="${expanded}">
        <span class="stage-number">${number}</span><span><strong>${escapeText(stage[0])}</strong><small>${escapeText(stage[1])}</small></span><span class="stage-progress">${got}/${items.length} earned</span>
      </button>
      ${expanded ? `<div class="stage-items">${items.map((record) => `<label class="stage-item"><input type="checkbox" data-earn="${record.id}" ${earnedCheck(record) ? 'checked' : ''}><span>${escapeText(record.name)}${record.missable ? ' · missable' : ''}</span></label>`).join('')}</div>` : ''}
    </section>`;
  }).join('');
  node('#roadmap-list').querySelectorAll('[data-stage]').forEach((button) => {
    button.onclick = () => {
      openStage = openStage === Number(button.dataset.stage) ? null : Number(button.dataset.stage);
      renderRoadmap();
    };
  });
  bindEarnControls(node('#roadmap-list'));
}

function exportSave() {
  const payload = { app: 'leonida-field-guide', version: 2, earned: Object.fromEntries(earned), guard };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-progress.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importSave(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.app !== 'leonida-field-guide' || payload.version !== 2 || typeof payload.earned !== 'object') throw new Error('Invalid save');
    earned.clear();
    Object.entries(payload.earned).forEach(([id, time]) => {
      if (records.some((record) => record.id === Number(id))) earned.set(Number(id), time);
    });
    guard = payload.guard !== false;
    writeSave();
    redraw();
  } catch {
    announce('That file is not a valid Leonida progress backup.');
  }
}

function renderTracker() {
  const count = earned.size;
  const missableLeft = records.filter((record) => record.missable && !earnedCheck(record)).length;
  const remainingHours = records.reduce((sum, record) => earnedCheck(record) ? sum : sum + (record.hours || 0), 0);
  node('#tracker-content').innerHTML = `<div class="tracker-grid">
    <article class="tracker-card"><h3>Overall</h3><p><strong>${count} / 55</strong> earned</p><p>${55 - count} remaining</p></article>
    <article class="tracker-card"><h3>Close-outs</h3><p><strong>${11 - missableLeft} / 11</strong> missables cleared</p><p>${missableLeft} still vulnerable</p></article>
    <article class="tracker-card"><h3>Plan</h3><p><strong>${remainingHours}</strong> estimated hours left</p><p>Planning estimate, not unlock time</p></article>
    <article class="tracker-card"><h3>Medals</h3>${MEDALS.map((medal) => `<p>${titleCase(medal)}: ${records.filter((record) => record.grade === medal && earnedCheck(record)).length}/${records.filter((record) => record.grade === medal).length}</p>`).join('')}</article>
    <article class="tracker-card"><h3>Stages</h3>${STAGES.map((stage, index) => {
      const items = records.filter((record) => record.roadmapStage === index + 1);
      return `<p>${index + 1}. ${stage[0]}: ${items.filter(earnedCheck).length}/${items.length}</p>`;
    }).join('')}</article>
    <article class="tracker-card"><h3>Storage</h3><p>Key: <code>${SAVE_KEY}</code></p><p>Saved in this browser only</p></article>
    <div class="tracker-actions"><button type="button" class="small-button solid" id="export-save">Export JSON</button><button type="button" class="small-button" id="import-save">Import JSON</button><button type="button" class="small-button" id="reset-save">Reset</button><input id="save-file" type="file" accept="application/json" hidden></div>
  </div>`;
  node('#export-save').onclick = exportSave;
  node('#import-save').onclick = () => node('#save-file').click();
  node('#save-file').onchange = (event) => importSave(event.target.files[0]);
  node('#reset-save').onclick = () => {
    if (confirm('Clear all locally saved trophy progress?')) {
      earned.clear();
      writeSave();
      redraw();
    }
  };
}

function redraw() {
  renderHeader();
  ['checklist', 'missables', 'roadmap', 'tracker'].forEach((view) => {
    node(`#${view}-view`).hidden = activeView !== view;
  });
  if (activeView === 'checklist') renderChecklist();
  if (activeView === 'missables') renderMissables();
  if (activeView === 'roadmap') renderRoadmap();
  if (activeView === 'tracker') renderTracker();
}

function bindGlobal() {
  node('#search').addEventListener('input', (event) => { searchText = event.target.value; writeHash(); renderChecklist(); });
  node('#grade-filter').addEventListener('change', (event) => { medalFilter = event.target.value; writeHash(); redraw(); });
  node('#group-filter').addEventListener('change', (event) => { grouping = event.target.value; redraw(); });
  node('#remaining-filter').addEventListener('change', (event) => { remainingOnly = event.target.checked; redraw(); });
  node('#guard-filter').addEventListener('change', (event) => { guard = event.target.checked; writeSave(); writeHash(); redraw(); });
  node('#shortcut-open').onclick = () => node('#shortcut-dialog').showModal();
  window.addEventListener('hashchange', () => { readHash(); redraw(); });
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, select, textarea')) {
      if (event.key === 'Escape') event.target.blur();
      return;
    }
    if (event.key === '/') { event.preventDefault(); node('#search').focus(); return; }
    if (event.key === '?') { node('#shortcut-dialog').showModal(); return; }
    if (event.key === 'g') { waitingForView = true; setTimeout(() => waitingForView = false, 800); return; }
    if (waitingForView) {
      const destinations = { c: 'checklist', m: 'missables', r: 'roadmap', t: 'tracker' };
      if (destinations[event.key]) {
        waitingForView = false;
        activeView = destinations[event.key];
        location.hash = `#view=${activeView}`;
        return;
      }
    }
    if (activeView !== 'checklist') return;
    const list = visibleRecords();
    if (!list.length) return;
    if (event.key === 'j' || event.key === 'k') {
      event.preventDefault();
      rowCursor = event.key === 'j'
        ? Math.min(rowCursor + 1, list.length - 1)
        : Math.max(rowCursor - 1, 0);
      selected = list[rowCursor].id;
      writeHash();
      redraw();
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (selected === null) selected = list[0].id;
      toggleEarned(selected);
    }
  });
}

async function init() {
  loadSave();
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`Could not load trophy data: ${response.status}`);
  const payload = await response.json();
  records = Array.isArray(payload) ? payload : payload.trophies;
  readHash();
  bindGlobal();
  redraw();
}

init().catch((error) => {
  console.error(error);
  node('#trophy-list').innerHTML = '<div class="empty-state"><h3>Trophy data could not load.</h3><p>Serve this folder over a local preview server.</p></div>';
});
