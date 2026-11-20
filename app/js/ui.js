// ui.js — the checklist and the detail panel. Everything that builds a row of the
// list, a grouped header, the masthead progress readout, or the trophy panel lives
// here; the app module owns state and passes a context object in.

import { GRADE_LABEL, KIND_LABEL, countLabel, gradeRank, searchable, STAGE_BY_NUM } from './data.js';

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function isHiddenTrophy(trophy, state) {
  return Boolean(state.spoilers) && Boolean(trophy.hidden) && !state.isEarned(trophy.id);
}

function gradeChip(grade) {
  return el('span', { class: `chip chip-${grade}`, text: GRADE_LABEL[grade] ?? grade });
}

function badgeRow(trophy, concealed, earned) {
  const badges = el('div', { class: 'row-badges' });
  badges.append(el('span', { class: 'badge', text: KIND_LABEL[trophy.kind] ?? trophy.kind }));
  if (trophy.missable) badges.append(el('span', { class: 'badge badge-missable', text: 'Missable' }));
  if (trophy.count) {
    badges.append(el('span', { class: 'badge badge-count', text: countLabel(trophy) }));
    badges.append(el('span', { class: 'badge badge-progress', text: `${earned ? trophy.count : 0}/${trophy.count}` }));
  }
  if (trophy.chapter && !concealed) badges.append(el('span', { class: 'badge', text: trophy.chapter }));
  return badges;
}

// ---------- masthead ----------

export function renderMasthead(ctx) {
  const { guide, state } = ctx;
  const total = guide.trophies.length;
  const earnedCount = guide.trophies.filter((t) => state.isEarned(t.id)).length;
  const pct = total === 0 ? 0 : Math.round((earnedCount / total) * 100);

  ctx.dom.progressCount.textContent = String(earnedCount);
  ctx.dom.platinumFill.style.width = `${pct}%`;
  ctx.dom.platinumRail.setAttribute('aria-label', `Platinum progress: ${earnedCount} of ${total} trophies, ${pct} percent`);
  ctx.dom.railCaption.textContent =
    earnedCount === total ? 'Platinum earned — Leonida Legend' : `${total - earnedCount} trophies from the platinum`;

  const marks = ctx.dom.gradeMarks;
  marks.replaceChildren();
  const palette = { platinum: '#5f6b7a', gold: '#c9971b', silver: '#8d949c', bronze: '#9a5b2c' };
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const group = guide.trophies.filter((t) => t.grade === grade);
    if (group.length === 0) continue;
    const done = group.filter((t) => state.isEarned(t.id)).length;
    marks.append(
      el('li', {}, [
        el('span', { class: 'dot', style: `background:${palette[grade]}` }),
        `${GRADE_LABEL[grade]} `,
        el('b', { text: `${done}/${group.length}` }),
      ]),
    );
  }
}

// ---------- filtering ----------

export function visibleTrophies(ctx) {
  const { guide, state, filters } = ctx;
  const query = filters.query.trim().toLowerCase();
  return guide.trophies.filter((trophy) => {
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.kind === 'missable' && !trophy.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
    if (filters.onlyRemaining && state.isEarned(trophy.id)) return false;
    if (query && !searchable(trophy).includes(query)) return false;
    return true;
  });
}

// ---------- checklist ----------

function trophyRow(ctx, trophy) {
  const { state } = ctx;
  const earned = state.isEarned(trophy.id);
  const concealed = isHiddenTrophy(trophy, state);

  const check = el('input', {
    type: 'checkbox',
    class: 'row-check',
    checked: earned,
    'aria-label': `Mark ${concealed ? 'this trophy' : trophy.name} as earned`,
    onchange: () => ctx.actions.toggle(trophy.id),
  });

  const name = concealed ? 'Hidden trophy' : trophy.name;
  const description = concealed ? 'Hidden until earned.' : trophy.description;

  const title = el('div', { class: 'row-title' }, [
    el('span', { class: 'row-name', text: name }),
    gradeChip(trophy.grade),
  ]);

  const main = el('div', { class: 'row-main' }, [
    title,
    el('p', { class: `row-desc${concealed ? ' is-hidden' : ''}`, text: description }),
    badgeRow(trophy, concealed, earned),
  ]);

  const guideButton = el('button', {
    type: 'button',
    class: 'row-guide',
    text: 'Guide',
    'aria-label': `Open the guide for ${concealed ? 'this trophy' : trophy.name}`,
    onclick: (event) => {
      event.stopPropagation();
      ctx.actions.select(trophy.id);
    },
  });

  const row = el('div', {
    class: `trophy-row${earned ? ' is-earned' : ''}${ctx.selectedId === trophy.id ? ' is-open' : ''}`,
    onclick: (event) => {
      // The checkbox and the guide button look after themselves; re-rendering the
      // list from underneath them would swallow the checkbox's own change event.
      if (event.target.closest('.row-check, .row-guide')) return;
      ctx.actions.select(trophy.id);
    },
  }, [check, main, guideButton]);

  row.dataset.trophy = String(trophy.id);
  return row;
}

function groupHeading(ctx, group) {
  if (ctx.filters.groupBy === 'grade') {
    const count = group.items.length;
    const done = group.items.filter((t) => ctx.state.isEarned(t.id)).length;
    return [
      el('div', { class: 'group-head' }, [
        el('h2', { text: GRADE_LABEL[group.key] ?? group.key }),
        el('span', { class: 'group-count', text: `${done}/${count} earned` }),
      ]),
    ];
  }
  const stage = STAGE_BY_NUM.get(group.key);
  const count = group.items.length;
  const done = group.items.filter((t) => ctx.state.isEarned(t.id)).length;
  const head = el('div', { class: 'group-head' }, [
    el('span', { class: 'stage-num', text: `S${group.key}` }),
    el('h2', { text: stage ? stage.title : `Stage ${group.key}` }),
    el('span', { class: 'group-count', text: `${done}/${count} earned` }),
  ]);
  const note = stage ? el('p', { class: 'group-note', text: `${stage.when} · ${stage.brief}` }) : null;
  return note ? [head, note] : [head];
}

export function renderList(ctx) {
  const list = ctx.dom.trophyList;
  const matching = visibleTrophies(ctx);
  list.replaceChildren();

  ctx.dom.filterSummary.textContent =
    matching.length === ctx.guide.trophies.length
      ? `Showing all ${matching.length} trophies`
      : `Showing ${matching.length} of ${ctx.guide.trophies.length} trophies`;

  if (matching.length === 0) {
    list.append(
      el('div', { class: 'empty' }, [
        el('p', { text: 'No trophy matches these filters.' }),
        el('p', { text: 'Try a broader search, or clear the grade and kind filters.' }),
      ]),
    );
    return;
  }

  const groups = new Map();
  for (const trophy of matching) {
    const key = ctx.filters.groupBy === 'grade' ? trophy.grade : trophy.roadmapStage;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trophy);
  }

  const keys = [...groups.keys()].sort((a, b) =>
    ctx.filters.groupBy === 'grade' ? gradeRank(a) - gradeRank(b) : Number(a) - Number(b),
  );

  for (const key of keys) {
    for (const node of groupHeading(ctx, { key, items: groups.get(key) })) list.append(node);
    const sorted = groups.get(key).slice().sort((a, b) => a.id - b.id);
    for (const trophy of sorted) list.append(trophyRow(ctx, trophy));
  }
}

// ---------- detail panel ----------

export function renderDetail(ctx) {
  const panel = ctx.dom.detail;
  panel.replaceChildren();

  const trophy = ctx.selectedId === null ? null : ctx.guide.byId.get(ctx.selectedId);
  if (!trophy) {
    panel.append(
      el('div', { class: 'detail-empty' }, [
        el('strong', { text: 'Pick a trophy' }),
        el('p', { text: 'Every row has a guide: what to do, where it can be missed, how it works, and where each fact came from.' }),
        el('p', { text: 'Your progress is saved in this browser. Tick a row and it stays ticked.' }),
      ]),
    );
    return;
  }

  const earned = ctx.state.isEarned(trophy.id);
  const concealed = isHiddenTrophy(trophy, ctx.state);

  const head = el('div', { class: 'detail-head' }, [
    el('div', { class: 'detail-kicker' }, [
      gradeChip(trophy.grade),
      el('span', { class: 'badge', text: KIND_LABEL[trophy.kind] ?? trophy.kind }),
      trophy.missable ? el('span', { class: 'badge badge-missable', text: 'Missable' }) : null,
      el('span', { class: 'badge', text: `Stage ${trophy.roadmapStage}` }),
    ].filter(Boolean)),
    el('h2', { text: concealed ? 'Hidden trophy' : trophy.name }),
    el('p', {
      class: `detail-desc${concealed ? ' is-hidden' : ''}`,
      text: concealed ? 'Hidden until earned. Turn off “Hide story spoilers” to read it now.' : trophy.description,
    }),
  ]);

  const body = el('div', { class: 'detail-body' });

  if (!concealed) {
    // Citations sit directly under the official description: every fact on this page
    // should be attributable at a glance, before the guide itself.
    if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
      body.append(
        el('div', { class: 'detail-section' }, [
          el('h3', { text: 'Sources' }),
          el('ul', { class: 'sources' }, trophy.sources.map((source) =>
            el('li', {}, [
              el('a', { href: source.url, target: '_blank', rel: 'noreferrer noopener', text: source.label }),
            ]),
          )),
        ]),
      );
    }
  }

  if (trophy.missableNote) {
    body.append(
      el('div', { class: 'detail-section' }, [
        el('div', { class: 'missable-note' }, [
          el('strong', { text: 'Where it can be missed' }),
          trophy.missableNote,
        ]),
      ]),
    );
  }

  if (!concealed) {
    body.append(
      el('div', { class: 'detail-section' }, [
        el('h3', { text: 'How it works' }),
        el('p', { class: 'detail-guide', text: trophy.guide }),
      ]),
    );

    if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
      body.append(
        el('div', { class: 'detail-section' }, [
          el('h3', { text: 'Step by step' }),
          el('ol', { class: 'steps' }, trophy.steps.map((step) => el('li', { text: step }))),
        ]),
      );
    }
  } else {
    body.append(
      el('div', { class: 'detail-section' }, [
        el('p', { class: 'detail-guide', text: 'The guide for this trophy is hidden with its name, so nothing in the story is given away. Turn the spoiler switch off in the header and it appears here.' }),
      ]),
    );
  }

  const actions = el('div', { class: 'detail-actions' }, [
    el('button', {
      type: 'button',
      class: `btn ${earned ? 'btn-done' : 'btn-primary'}`,
      text: earned ? '✓ Earned — undo' : 'Mark as earned',
      onclick: () => ctx.actions.toggle(trophy.id),
    }),
    el('button', {
      type: 'button',
      class: 'btn',
      text: 'Show in roadmap',
      onclick: () => ctx.actions.openView('roadmap', { focusStage: trophy.roadmapStage }),
    }),
  ]);

  panel.append(el('div', { class: 'detail' }, [head, body, actions]));
}

export function renderChecklist(ctx) {
  renderList(ctx);
  renderDetail(ctx);
}
