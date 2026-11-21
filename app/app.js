// Leonida Field Guide
// Local-only ES module; the trophy JSON is the only runtime data request.

const STORAGE_KEY = 'leonida-field-guide:v1';
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'combat', 'exploration', 'online'];
const KIND_LABELS = {
  all: 'All kinds', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', combat: 'Combat', exploration: 'Exploration', online: 'Online'
};
const STAGES = [
  ['Opening hours', 'Secure the Chapter 1 run and first close-out events.'],
  ['The partnership opens', 'Advance Chapter 2 and establish partner activities.'],
  ['The city opens', 'Clear Chapter 3 strands before later closures.'],
  ['Vaults and Chapter 4', 'Finish Chapter 4 and prepare heist cleanup.'],
  ['Finale and credits', 'Complete the final mission and keep a cleanup save.'],
  ['Robberies and money', 'Finish five bank vaults and property income targets.'],
  ['Activities and collections', 'Work repeatable challenges and counts.'],
  ['Strands and choices', 'Close character missions and choice branches.'],
  ['The 100% long road', 'Finish global totals and claim the platinum.']
];

let trophies = [];
let selected = null;
let view = 'checklist';
let query = '';
let grade = 'all';
let kind = 'all';
let grouping = 'stage';
let remaining = false;
let openStage = null;
let rowIndex = 0;
let gPending = false;

const earned = new Map();
let guard = true;

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function $(selector) { return document.querySelector(selector); }
function isEarned(trophy) { return earned.has(trophy.id); }
function isMasked(trophy) { return guard && trophy.kind === 'story' && !isEarned(trophy); }
function gradeMarkup(value) { return `<span class="grade ${value}">${value}</span>`; }
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.v === 1) {
      Object.entries(saved.earned || {}).forEach(([id, time]) => earned.set(Number(id), time));
      guard = saved.guard !== false;
    }
  } catch {
    showNotice('Saved progress could not be read.');
  }
}
function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1,
      earned: Object.fromEntries(earned),
      guard
    }));
  } catch {
    showNotice('This browser could not save progress.');
  }
}
function showNotice(text) {
  const footer = $('.footer');
  if (footer) footer.dataset.notice = text;
}

function toggle(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.set(id, Date.now());
  saveProgress();
  render();
}

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const id = Number(params.get('trophy'));
  if (trophies.some(trophy => trophy.id === id)) {
    selected = id;
    view = 'checklist';
  } else {
    view = ['missables', 'roadmap', 'tracker'].includes(params.get('view'))
      ? params.get('view')
      : 'checklist';
  }
  if (KINDS.includes(params.get('kind'))) kind = params.get('kind');
  if (GRADES.includes(params.get('grade'))) grade = params.get('grade');
  if (params.has('spoilers')) {
    guard = params.get('spoilers') !== 'off';
  }
  const stage = Number(params.get('stage'));
  if (stage >= 1 && stage <= 9) openStage = stage;
  saveProgress();
}

function visibleTrophies() {
  const needle = query.trim().toLowerCase();
  const result = trophies.filter(trophy => {
    if (kind === 'missable' ? !trophy.missable : kind !== 'all' && trophy.kind !== kind) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (remaining && isEarned(trophy)) return false;
    if (!needle) return true;
    if (isMasked(trophy)) return 'hidden story trophy'.includes(needle);
    return `${trophy.name} ${trophy.description} ${trophy.kind} ${trophy.chapter}`.toLowerCase().includes(needle);
  });
  return result.sort((a, b) => (
    grouping === 'grade'
      ? GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade)
      : a.roadmapStage - b.roadmapStage
  ) || a.id - b.id);
}

function renderHeader() {
  const count = earned.size;
  $('#earned-figure').textContent = `${count} of 55`;
  $('#progress-bar').setAttribute('aria-valuenow', String(count));
  $('#progress-bar span').style.width = `${count / 55 * 100}%`;
  $('#grade-counts').innerHTML = GRADES.map(value => {
    const got = trophies.filter(trophy => trophy.grade === value && isEarned(trophy)).length;
    const total = trophies.filter(trophy => trophy.grade === value).length;
    return `<span class="grade-count">${gradeMarkup(value)} <strong>${got}/${total}</strong></span>`;
  }).join('');
  const missableLeft = trophies.filter(trophy => trophy.missable && !isEarned(trophy)).length;
  $('#missable-count').textContent = String(missableLeft);
  document.querySelectorAll('.view-tabs a').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });
  const next = trophies.find(trophy => !isEarned(trophy));
  $('#next-button').disabled = !next;
  $('#next-button').onclick = () => {
    if (!next) {
      view = 'tracker';
      location.hash = '#view=tracker';
    } else {
      selected = next.id;
      view = 'checklist';
      location.hash = `#trophy=${next.id}`;
    }
  };
}

function renderChecklist() {
  $('#search').value = query;
  $('#grade-filter').value = grade;
  $('#group-filter').value = grouping;
  $('#remaining-filter').checked = remaining;
  $('#spoiler-filter').checked = guard;
  $('#kind-tabs').innerHTML = KINDS.map(value =>
    `<button type="button" class="kind-button${kind === value ? ' active' : ''}" data-kind="${value}" aria-pressed="${kind === value}">${KIND_LABELS[value]}</button>`
  ).join('');
  $('#kind-tabs').querySelectorAll('[data-kind]').forEach(button => {
    button.onclick = () => { kind = button.dataset.kind; writeHash(); render(); };
  });
  const list = visibleTrophies();
  $('#shown-count').textContent = `${list.length} of ${trophies.length} trophies shown`;
  if (!list.length) {
    const complete = earned.size === trophies.length;
    $('#trophy-list').innerHTML = complete
      ? '<div class="empty"><h3>Every trophy is earned.</h3><p>The route and tracker are ready for a final backup.</p></div>'
      : `<div class="empty"><h3>No trophies match this view.</h3><p>Clear the search or change the kind and grade filters.</p><button type="button" class="small-button" data-clear>Clear filters</button></div>`;
  } else {
    const groups = new Map();
    list.forEach(trophy => {
      const label = grouping === 'grade'
        ? titleCase(trophy.grade)
        : `Stage ${trophy.roadmapStage} · ${STAGES[trophy.roadmapStage - 1][0]}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(trophy);
    });
    $('#trophy-list').innerHTML = [...groups].map(([label, items]) =>
      `<h2 class="stage-heading">${escapeText(label)}</h2>` +
      items.map(trophy => trophyRow(trophy)).join('')
    ).join('');
  }
  $('#detail-panel').innerHTML = detailMarkup();
  bindChecklist();
}

function trophyRow(trophy) {
  const masked = isMasked(trophy);
  const name = masked ? 'Hidden trophy' : trophy.name;
  const description = masked ? 'Earn it or switch off the spoiler guard.' : trophy.description;
  const meta = masked
    ? 'Story'
    : `${trophy.kind} · ${trophy.chapter}${trophy.count != null ? ` · Target ${Number(trophy.count).toLocaleString()}` : ''}${trophy.missable ? ' · Missable' : ''}`;
  return `<article class="trophy-row${isEarned(trophy) ? ' earned' : ''}">
    <label class="row-check"><input type="checkbox" data-toggle="${trophy.id}" ${isEarned(trophy) ? 'checked' : ''} aria-label="Mark ${escapeText(name)} earned"></label>
    <button type="button" class="row-open${selected === trophy.id ? ' selected' : ''}" data-open="${trophy.id}">
      <span><b class="row-title">${escapeText(name)}</b><span class="row-description">${escapeText(description)}</span><span class="row-meta">${escapeText(meta)}</span></span>
      <span class="row-side">${gradeMarkup(trophy.grade)}<span>Stage ${trophy.roadmapStage}</span></span>
    </button>
  </article>`;
}

function detailMarkup() {
  const trophy = trophies.find(item => item.id === selected);
  if (!trophy) {
    return '<div class="detail-inner"><p class="eyebrow">Field note</p><h2>Choose a trophy</h2><p class="official">The guide, steps and cited sources open beside the checklist.</p></div>';
  }
  if (isMasked(trophy)) {
    return `<div class="detail-inner">
      <div class="detail-facts">${gradeMarkup(trophy.grade)}<span>Story trophy</span></div>
      <h2 class="masked-name">Hidden trophy</h2>
      <p class="official">Held back by the spoiler guard.</p>
      <p class="guide-text">Earn this trophy or disable the guard to reveal its official wording and guide.</p>
      <button type="button" class="panel-button" data-toggle="${trophy.id}">${isEarned(trophy) ? 'Mark not earned' : 'Mark earned'}</button>
    </div>`;
  }
  const warning = trophy.missable
    ? `<div class="warning"><b>Missable</b><p>${escapeText(trophy.missableNote)}</p></div>`
    : '';
  return `<div class="detail-inner">
    <div class="detail-facts">${gradeMarkup(trophy.grade)}<span>${escapeText(titleCase(trophy.kind))}</span><span>${escapeText(trophy.chapter)}</span><span>#${trophy.id} / 55</span>${trophy.hidden ? '<span>Hidden on PSN</span>' : ''}</div>
    <h2>${escapeText(trophy.name)}</h2>
    <p class="official">${escapeText(trophy.description)}</p>
    ${warning}
    <h3>Guide</h3>
    <p class="guide-text">${escapeText(trophy.guide)}</p>
    <h3>Steps</h3>
    <ol>${trophy.steps.map(step => `<li>${escapeText(step)}</li>`).join('')}</ol>
    <h3>Sources</h3>
    <ul class="sources">${trophy.sources.map(source => `<li><a href="${escapeText(source.url)}" target="_blank" rel="noopener noreferrer">${escapeText(source.label)}</a></li>`).join('')}</ul>
    <button type="button" class="panel-button" data-toggle="${trophy.id}">${isEarned(trophy) ? 'Mark not earned' : 'Mark earned'}</button>
  </div>`;
}

function bindChecklist() {
  document.querySelectorAll('[data-open]').forEach(button => {
    button.onclick = () => {
      selected = Number(button.dataset.open);
      writeHash();
      render();
    };
  });
  document.querySelectorAll('[data-toggle]').forEach(input => {
    input.onchange = input.onclick = event => {
      event.prevent && event.prevent();
      toggle(Number(input.dataset.toggle));
    };
  });
  const clear = $('[data-clear]');
  if (clear) clear.onclick = () => {
    query = ''; grade = 'all'; kind = 'all'; remaining = false;
    writeHash(); render();
  };
}

function renderMissables() {
  const left = trophies.filter(trophy => trophy.missable);
  $('#missable-list').innerHTML = left.map(trophy => `<article class="missable-card${isEarned(trophy) ? ' earned' : ''}">
    <div>${gradeMarkup(trophy.grade)}</div>
    <div><p class="missable-stage">Stage ${trophy.roadmapStage} · ${escapeText(STAGES[trophy.roadmapStage - 1][0])}</p><h3>${escapeText(trophy.name)}</h3><p class="official">${escapeText(trophy.description)}</p></div>
    <div><p class="missable-note">${escapeText(trophy.missableNote)}</p><div class="card-actions"><a class="small-button" href="#trophy=${trophy.id}">Open guide</a><button type="button" class="small-button${isEarned(trophy) ? '' : ' solid'}" data-toggle="${trophy.id}">${isEarned(trophy) ? 'Mark not earned' : 'Mark earned'}</button></div></div>
  </article>`).join('');
  document.querySelectorAll('#missable-list [data-toggle]').forEach(button => {
    button.onclick = () => toggle(Number(button.dataset.toggle));
  });
}

function renderRoadmap() {
  const next = trophies.find(trophy => !isEarned(trophy));
  $('#do-next').innerHTML = next
    ? `<strong>Do next:</strong> Stage ${next.roadmapStage} · ${escapeText(next.name)}. <a href="#trophy=${next.id}">Open the guide</a>`
    : '<strong>Route complete:</strong> all 55 trophies are earned.';
  $('#roadmap-stages').innerHTML = STAGES.map((stage, index) => {
    const number = index + 1;
    const items = trophies.filter(trophy => trophy.roadmapStage === number);
    const got = items.filter(isEarned).length;
    const expanded = openStage === null ? number === (next ? next.roadmapStage : 9) : openStage === number;
    return `<section class="roadmap-stage">
      <button type="button" class="roadmap-head" data-stage="${number}" aria-expanded="${expanded}">
        <span class="stage-number">${number}</span>
        <span><strong>${escapeText(stage[0])}</strong><small>${escapeText(stage[1])}</small></span>
        <span class="stage-progress">${got}/${items.length} earned</span>
      </button>
      ${expanded ? `<div class="stage-items">${items.map(trophy => `<label class="stage-item"><input type="checkbox" data-toggle="${trophy.id}" ${isEarned(trophy) ? 'checked' : ''}><span>${escapeText(trophy.name)}${trophy.missable ? ' · missable' : ''}</span></label>`).join('')}</div>` : ''}
    </section>`;
  }).join('');
  document.querySelectorAll('[data-stage]').forEach(button => {
    button.onclick = () => { openStage = openStage === Number(button.dataset.stage) ? null : Number(button.dataset.stage); renderRoadmap(); };
  });
  document.querySelectorAll('.roadmap-stage [data-toggle]').forEach(input => {
    input.onchange = () => toggle(Number(input.dataset.toggle));
  });
}

function renderTracker() {
  const count = earned.size;
  const missableLeft = trophies.filter(trophy => trophy.missable && !isEarned(trophy)).length;
  const hoursLeft = trophies.reduce((sum, trophy) => isEarned(trophy) ? sum : sum + (trophy.hours || 0), 0);
  $('#tracker-panel').innerHTML = `<div class="tracker-grid">
    <article class="tracker-card"><h3>Overall</h3><p><strong>${count} / 55</strong> earned</p><p>${55 - count} remaining</p></article>
    <article class="tracker-card"><h3>Close-outs</h3><p><strong>${11 - missableLeft} / 11</strong> missables cleared</p><p>${missableLeft} still vulnerable</p></article>
    <article class="tracker-card"><h3>Plan</h3><p><strong>${hoursLeft}</strong> estimated hours left</p><p>Planning only, not unlock time</p></article>
    <article class="tracker-card"><h3>Grades</h3>${GRADES.map(value => `<p>${titleCase(value)}: ${trophies.filter(t => t.grade === value && isEarned(t)).length}/${trophies.filter(t => t.grade === value).length}</p>`).join('')}</article>
    <article class="tracker-card"><h3>Stages</h3>${STAGES.map((stage, index) => {
      const items = trophies.filter(t => t.roadmapStage === index + 1);
      return `<p>${index + 1}. ${stage[0]}: ${items.filter(isEarned).length}/${items.length}</p>`;
    }).join('')}</article>
    <article class="tracker-card"><h3>Storage</h3><p>Key: <code>${STORAGE_KEY}</code></p><p>Browser-local JSON backup</p></article>
    <div class="tracker-actions"><button type="button" class="small-button solid" id="export-progress">Export JSON</button><button type="button" class="small-button" id="import-progress">Import JSON</button><button type="button" class="small-button" id="reset-progress">Reset</button><input id="import-file" type="file" accept="application/json" hidden></div>
  </div>`;
  $('#export-progress').onclick = exportProgress;
  $('#import-progress').onclick = () => $('#import-file').click();
  $('#import-file').onchange = event => importProgress(event.target.files[0]);
  $('#reset-progress').onclick = () => {
    if (confirm('Clear all locally saved trophy progress?')) {
      earned.clear();
      saveProgress();
      render();
    }
  };
}

function exportProgress() {
  const payload = {
    app: 'leonida-field-guide',
    v: 1,
    earned: Object.fromEntries(earned),
    guard
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}
async function importProgress(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.app !== 'leonida-field-guide' || payload.v !== 1 || typeof payload.earned !== 'object') {
      throw new Error('Invalid progress file');
    }
    earned.clear();
    Object.entries(payload.earned).forEach(([id, time]) => {
      if (trophies.some(trophy => trophy.id === Number(id))) earned.set(Number(id), time);
    });
    guard = payload.guard !== false;
    saveProgress();
    render();
  } catch {
    showNotice('That file did not contain valid Leonida progress.');
  }
}

function writeHash() {
  const params = new URLSearchParams();
  params.set('view', view);
  if (selected != null) params.set('trophy', String(selected));
  if (kind !== 'all') params.set('kind', kind);
  if (grade !== 'all') params.set('grade', grade);
  params.set('spoilers', guard ? 'on' : 'off');
  location.hash = params.toString();
}

function render() {
  renderHeader();
  ['checklist', 'missables', 'roadmap', 'tracker'].forEach(name => {
    $(`#${name}-view`).hidden = view !== name;
  });
  if (view === 'checklist') renderChecklist();
  if (view === 'missables') renderMissables();
  if (view === 'roadmap') renderRoadmap();
  if (view === 'tracker') renderTracker();
}

function bindGlobal() {
  $('#search').addEventListener('input', event => { query = event.target.value; writeHash(); renderChecklist(); });
  $('#grade-filter').addEventListener('change', event => { grade = event.target.value; writeHash(); render(); });
  $('#group-filter').addEventListener('change', event => { grouping = event.target.value; render(); });
  $('#remaining-filter').addEventListener('change', event => { remaining = event.target.checked; render(); });
  $('#spoiler-filter').addEventListener('change', event => { guard = event.target.checked; saveProgress(); writeHash(); render(); });
  $('#keys-button').onclick = () => $('#keys-dialog').showModal();
  window.addEventListener('hashchange', () => { readHash(); render(); });
  document.addEventListener('keydown', event => {
    if (event.target.matches('input, select, textarea')) {
      if (event.key === 'Escape') event.target.blur();
      return;
    }
    if (event.key === '/') { event.preventDefault(); $('#search').focus(); return; }
    if (event.key === '?') { $('#keys-dialog').showModal(); return; }
    if (event.key === 'g') { gPending = true; setTimeout(() => gPending = false, 800); return; }
    if (gPending) {
      const map = { c: 'checklist', m: 'missables', r: 'roadmap', t: 'tracker' };
      if (map[event.key]) {
        gPending = false;
        view = map[event.key];
        location.hash = `#view=${view}`;
        return;
      }
    }
    if (view !== 'checklist') return;
    const list = visibleTrophies();
    if (!list.length) return;
    if (event.key === 'j' || event.key === 'k') {
      event.preventDefault();
      rowIndex = event.key === 'j'
        ? Math.min(rowIndex + 1, list.length - 1)
        : Math.max(rowIndex - 1, 0);
      selected = list[rowIndex].id;
      writeHash();
      render();
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (selected == null) selected = list[0].id;
      toggle(selected);
    }
  });
}

async function init() {
  loadProgress();
  const response = await fetch('data/trophies.json');
  const payload = await response.json();
  trophies = payload.trophies || payload;
  readHash();
  bindGlobal();
  render();
}

init();
