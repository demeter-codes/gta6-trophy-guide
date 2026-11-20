// tracker.js — the progress view: per-grade and per-kind bars, the hours left,
// the missables you have not earned, and export, import and reset for the save.

import { el } from './ui.js';
import { GRADES, GRADE_LABEL, KIND_LABEL, estimateHoursLeft } from './data.js';

function barRow(name, done, total, grade) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return el('div', { class: 'bar-row' }, [
    el('div', { class: 'bar-row-top' }, [
      el('span', { class: 'bar-name', text: name }),
      el('span', { class: 'bar-value', text: `${done}/${total}` }),
    ]),
    el('div', { class: `bar${grade ? ` grade-${grade}` : ''}`, role: 'img', 'aria-label': `${name}: ${done} of ${total}` }, [
      el('span', { style: `width:${pct}%` }),
    ]),
  ]);
}

function notice(ctx, message, isError) {
  const box = el('p', { class: `notice${isError ? ' is-error' : ''}`, text: message });
  ctx.dom.trackerNotice.replaceChildren(box);
  window.setTimeout(() => ctx.dom.trackerNotice.replaceChildren(), 6000);
}

function statsPanel(ctx) {
  const { guide, state } = ctx;
  const total = guide.trophies.length;
  const earnedCount = guide.trophies.filter((t) => state.isEarned(t.id)).length;
  const missables = guide.trophies.filter((t) => t.missable && !state.isEarned(t.id));
  const hours = estimateHoursLeft(earnedCount, total);

  return el('div', { class: 'panel' }, [
    el('h2', { text: 'Where you are' }),
    el('p', { class: 'panel-lede', text: 'The 200 hour figure is the one GTA Base and KeenGamer both give for the platinum; the estimate below scales it by how much is left.' }),
    el('div', { class: 'stat-grid' }, [
      el('div', { class: 'stat' }, [el('b', { text: `${earnedCount}/${total}` }), el('span', { text: 'Trophies earned' })]),
      el('div', { class: 'stat' }, [el('b', { text: `≈ ${hours} h` }), el('span', { text: 'Estimated hours left' })]),
      el('div', { class: 'stat' }, [el('b', { text: String(missables.length) }), el('span', { text: 'Missables not earned' })]),
      el('div', { class: 'stat' }, [el('b', { text: String(total - earnedCount) }), el('span', { text: 'Trophies remaining' })]),
    ]),
  ]);
}

function gradePanel(ctx) {
  const panel = el('div', { class: 'panel' }, [
    el('h2', { text: 'By grade' }),
    el('p', { class: 'panel-lede', text: 'The platinum only unlocks when the other fifty-four are done, so the bronze bar is the one that moves last.' }),
  ]);
  for (const grade of GRADES) {
    const group = ctx.guide.trophies.filter((t) => t.grade === grade);
    if (group.length === 0) continue;
    const done = group.filter((t) => ctx.state.isEarned(t.id)).length;
    panel.append(barRow(GRADE_LABEL[grade], done, group.length, grade));
  }
  return panel;
}

function kindPanel(ctx) {
  const panel = el('div', { class: 'panel' }, [
    el('h2', { text: 'By kind' }),
    el('p', { class: 'panel-lede', text: 'Useful for planning a session: story work and collectibles behave very differently at the end of the game.' }),
  ]);
  const kinds = [...new Set(ctx.guide.trophies.map((t) => t.kind))];
  for (const kind of kinds) {
    const group = ctx.guide.trophies.filter((t) => t.kind === kind);
    const done = group.filter((t) => ctx.state.isEarned(t.id)).length;
    panel.append(barRow(KIND_LABEL[kind] ?? kind, done, group.length));
  }
  return panel;
}

function missablePanel(ctx) {
  const panel = el('div', { class: 'panel' }, [
    el('h2', { text: 'Missables' }),
    el('p', { class: 'panel-lede', text: 'The trophies that can be lost, and the ones already banked.' }),
  ]);

  const missables = ctx.guide.trophies.filter((t) => t.missable);
  if (missables.length === 0) {
    panel.append(el('p', { text: 'No trophy on this list is flagged missable.' }));
    return panel;
  }

  const list = el('ul', { class: 'missable-list' });
  for (const trophy of missables) {
    const earned = ctx.state.isEarned(trophy.id);
    list.append(
      el('li', {}, [
        el('span', { class: 'mm-name', text: `${earned ? '✓ ' : ''}${trophy.name}` }),
        el('span', { class: 'mm-note', text: trophy.missableNote || 'Can be missed.' }),
      ]),
    );
  }
  panel.append(list);
  return panel;
}

function savePanel(ctx) {
  const fileInput = el('input', {
    type: 'file',
    class: 'file-input',
    accept: 'application/json,.json',
    id: 'import-input',
    onchange: (event) => ctx.actions.importFile(event.target.files && event.target.files[0]),
  });

  return el('div', { class: 'panel' }, [
    el('h2', { text: 'Your save' }),
    el('p', { class: 'panel-lede', text: 'Progress lives in this browser under one versioned key. Export it to move it to another machine, or to keep a copy before you reset.' }),
    el('div', { class: 'tracker-actions' }, [
      el('button', { type: 'button', class: 'btn btn-primary', text: 'Export progress', onclick: () => ctx.actions.exportFile() }),
      el('button', {
        type: 'button',
        class: 'btn',
        text: 'Import progress',
        onclick: () => fileInput.click(),
      }),
      el('button', { type: 'button', class: 'btn', text: 'Reset everything', onclick: () => ctx.actions.reset() }),
      fileInput,
    ]),
    el('div', { id: 'tracker-notice' }),
  ]);
}

export function renderTracker(ctx) {
  const root = ctx.dom.tracker;
  root.replaceChildren();
  root.append(
    el('div', {}, [statsPanel(ctx), gradePanel(ctx), kindPanel(ctx)]),
    el('div', {}, [missablePanel(ctx), savePanel(ctx)]),
  );
  ctx.dom.trackerNotice = root.querySelector('#tracker-notice');
}

export { notice };
