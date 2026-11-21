// Leonida Field Guide: local state, no framework, no network use after the JSON loads.

const STORAGE = 'leonida-field-guide:v3';
const MEDALS = ['platinum', 'gold', 'silver', 'bronze'];
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'combat', 'exploration', 'online'];
const KIND_NAMES = { all: 'All', story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', combat: 'Combat', exploration: 'Exploration', online: 'Online' };
const STAGES = [
  ['Opening hours', 'Secure the first chapter and early close-outs.'],
  ['The partnership opens', 'Advance the partnership and Chapter 2.'],
  ['The city opens', 'Clear Chapter 3 options before later closures.'],
  ['Vaults and Chapter 4', 'Prepare bank work and finish Chapter 4.'],
  ['Finale and credits', 'Complete the finale and retain a cleanup save.'],
  ['Money and property', 'Close financial targets and garage ownership.'],
  ['Activities and collections', 'Work repeatable totals and collection sets.'],
  ['Strands and choices', 'Finish character strands and partner choices.'],
  ['The 100 percent road', 'Finish Leonida totals and claim platinum.'],
];

let trophies = [];
let selected = null;
let view = 'checklist';
let search = '';
let grade = 'all';
let kind = 'all';
let arrangement = 'stage';
let remaining = false;
let guard = true;
let openStage = null;
let cursor = 0;
let chord = false;
const earned = new Map();

const el = (selector) => document.querySelector(selector);
const clean = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const title = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const isEarned = (record) => earned.has(record.id);
const hideStory = (record) => guard && record.kind === 'story' && !isEarned(record);
const medal = (name) => `<span class="medal ${name}">${name}</span>`;

function readSave() {
  try {
    const save = JSON.parse(localStorage.getItem(STORAGE));
    if (save?.version === 3) {
      Object.entries(save.earned || {}).forEach(([id, time]) => earned.set(Number(id), time));
      guard = save.guard !== false;
    }
  } catch {
    el('.page-foot').dataset.notice = 'The saved tracker could not be read.';
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({
      version: 3,
      earned: Object.fromEntries(earned),
      guard,
    }));
  } catch {
    el('.page-foot').dataset.notice = 'Progress could not be saved in this browser.';
  }
}

function readLocation() {
  const params = new URLSearchParams(location.hash.slice(1));
  const id = Number(params.get('trophy'));
  if (trophies.some((record) => record.id === id)) {
    selected = id;
    view = 'checklist';
  } else {
    view = ['missables', 'roadmap', 'tracker'].includes(params.get('view')) ? params.get('view') : 'checklist';
  }
  if (KINDS.includes(params.get('kind'))) kind = params.get('kind');
  if (MEDALS.includes(params.get('grade'))) grade = params.get('grade');
  if (params.has('guard')) guard = params.get('guard') !== 'off';
  const stage = Number(params.get('stage'));
  if (stage >= 1 && stage <= 9) openStage = stage;
}

function writeLocation() {
  const params = new URLSearchParams();
  params.set('view', view);
  if (selected !== null) params.set('trophy', String(selected));
  if (kind !== 'all') params.set('kind', kind);
  if (grade !== 'all') params.set('grade', grade);
  params.set('guard', guard ? 'on' : 'off');
  location.hash = params.toString();
}

function visibleTrophies() {
  const needle = search.trim().toLowerCase();
  return trophies.filter((record) => {
    if (kind === 'missable' ? !record.missable : kind !== 'all' && record.kind !== kind) return false;
    if (grade !== 'all' && record.grade !== grade) return false;
    if (remaining && isEarned(record)) return false;
    if (!needle) return true;
    if (hideStory(record)) return 'hidden story trophy'.includes(needle);
    return `${record.name} ${record.description} ${record.kind} ${record.chapter}`.toLowerCase().includes(needle);
  }).sort((a, b) =>
    (arrangement === 'grade'
      ? MEDALS.indexOf(a.grade) - MEDALS.indexOf(b.grade)
      : a.roadmapStage - b.roadmapStage) || a.id - b.id);
}

function bindMarks(root) {
  root.querySelectorAll('[data-earn]').forEach((control) => {
    const run = () => toggleEarned(Number(control.dataset.earn));
    control.type === 'checkbox' ? control.onchange = run : control.onclick = run;
  });
}

function toggleEarned(id) {
  earned.has(id) ? earned.delete(id) : earned.set(id, Date.now());
  saveProgress();
  render();
}

function renderHeader() {
  const count = earned.size;
  el('#earned-total').textContent = `${count} of 55`;
  el('#completion-bar').setAttribute('aria-valuenow', String(count));
  el('#completion-bar span').style.width = `${count / 55 * 100}%`;
  el('#medal-counts').innerHTML = MEDALS.map((name) => {
    const got = trophies.filter((record) => record.grade === name && isEarned(record)).length;
    const total = trophies.filter((record) => record.grade === name).length;
    return `<span class="medal-count">${medal(name)} <strong>${got}/${total}</strong></span>`;
  }).join('');
  el('#missables-remaining').textContent = String(trophies.filter((record) => record.missable && !isEarned(record)).length);
  document.querySelectorAll('.view-nav a').forEach((link) => link.classList.toggle('selected', link.dataset.view === view));

  const next = trophies.find((record) => !isEarned(record));
  el('#next-trophy').disabled = !next;
  el('#next-trophy').onclick = () => {
    if (!next) {
      view = 'tracker';
      location.hash = '#view=tracker';
    } else {
      selected = next.id;
      view = 'checklist';
      location.hash = `#view=checklist&trophy=${next.id}`;
    }
  };
}

function rowMarkup(record) {
  const masked = hideStory(record);
  const name = masked ? 'Hidden story trophy' : record.name;
  const description = masked ? 'Held behind the spoiler guard.' : record.description;
  const facts = masked
    ? 'Story'
    : `${record.kind} · ${record.chapter}${record.count != null ? ` · Target ${Number(record.count).toLocaleString()}` : ''}${record.missable ? ' · Missable' : ''}`;
  return `<article class="trophy-row${isEarned(record) ? ' complete' : ''}">
    <label class="row-mark"><input type="checkbox" data-earn="${record.id}" ${isEarned(record) ? 'checked' : ''} aria-label="Mark ${clean(name)} earned"></label>
    <button type="button" class="row-open${selected === record.id ? ' current' : ''}" data-open="${record.id}">
      <span><b class="row-title">${clean(name)}</b><span class="row-description">${clean(description)}</span><span class="row-facts">${clean(facts)}</span></span>
      <span class="row-medal">${medal(record.grade)}<span>Stage ${record.roadmapStage}</span></span>
    </button>
  </article>`;
}

function guideMarkup() {
  const record = trophies.find((item) => item.id === selected);
  if (!record) {
    return `<div class="guide-inner"><p class="edition">Field note</p><h2>Choose a trophy</h2><p class="official">The guide, steps and sources open beside the ledger.</p></div>`;
  }
  if (hideStory(record)) {
    return `<div class="guide-inner">
      <div class="guide-facts">${medal(record.grade)}<span>Story trophy</span></div>
      <h2 class="guard-title">Hidden story trophy</h2>
      <p class="official">Held back by the spoiler guard.</p>
      <p class="guide-text">Earn the record or turn the guard off to reveal its official wording and guide.</p>
      <button type="button" class="mark-trophy" data-earn="${record.id}">${isEarned(record) ? 'Mark not earned' : 'Mark earned'}</button>
    </div>`;
  }
  const warning = record.missable
    ? `<div class="missable-warning"><b>Missable</b><p>${clean(record.missableNote)}</p></div>` : '';
  return `<div class="guide-inner">
    <div class="guide-facts">${medal(record.grade)}<span>${clean(title(record.kind))}</span><span>${clean(record.chapter)}</span><span>#${record.id} / 55</span>${record.hidden ? '<span>Hidden on PSN</span>' : ''}</div>
    <h2>${clean(record.name)}</h2>
    <p class="official">${clean(record.description)}</p>
    ${warning}
    <h3>Guide</h3><p class="guide-text">${clean(record.guide)}</p>
    <h3>Steps</h3><ol>${record.steps.map((step) => `<li>${clean(step)}</li>`).join('')}</ol>
    <h3>Sources</h3><ul>${record.sources.map((source) => `<li><a href="${clean(source.url)}" target="_blank" rel="noopener noreferrer">${clean(source.label)}</a></li>`).join('')}</ul>
    <button type="button" class="mark-trophy" data-earn="${record.id}">${isEarned(record) ? 'Mark not earned' : 'Mark earned'}</button>
  </div>`;
}

function renderChecklist() {
  el('#search-input').value = search;
  el('#grade-select').value = grade;
  el('#group-select').value = arrangement;
  el('#remaining-only').checked = remaining;
  el('#spoiler-toggle').checked = guard;
  el('#kind-filter').innerHTML = KINDS.map((filter) => `<button type="button" class="${kind === filter ? 'active' : ''}" data-kind="${filter}" aria-pressed="${kind === filter}">${KIND_NAMES[filter]}</button>`).join('');
  el('#kind-filter').querySelectorAll('[data-kind]').forEach((button) => {
    button.onclick = () => { kind = button.dataset.kind; writeLocation(); render(); };
  });

  const records = visibleTrophies();
  el('#result-summary').textContent = `${records.length} of ${trophies.length} trophies shown`;
  if (!records.length) {
    el('#trophy-rows').innerHTML = earned.size === trophies.length
      ? `<div class="empty-state"><h3>Every trophy is earned.</h3><p>The roadmap and tracker are ready for a final close-out.</p></div>`
      : `<div class="empty-state"><h3>No trophies match.</h3><p>Clear the search or change the filters.</p><button type="button" class="small-button" data-clear>Clear filters</button></div>`;
  } else {
    const groups = new Map();
    records.forEach((record) => {
      const label = arrangement === 'grade' ? title(record.grade) : `Stage ${record.roadmapStage} · ${STAGES[record.roadmapStage - 1][0]}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(record);
    });
    el('#trophy-rows').innerHTML = [...groups].map(([label, items]) => `<h2 class="stage-label">${clean(label)}</h2>${items.map(rowMarkup).join('')}`).join('');
  }
  el('#guide-pane').innerHTML = guideMarkup();
  el('#trophy-rows').querySelectorAll('[data-open]').forEach((button) => {
    button.onclick = () => { selected = Number(button.dataset.open); writeLocation(); render(); };
  });
  bindMarks(el('#trophy-rows'));
  bindMarks(el('#guide-pane'));
  const clear = el('[data-clear]');
  if (clear) clear.onclick = () => { search = ''; grade = 'all'; kind = 'all'; remaining = false; writeLocation(); render(); };
}

function renderMissables() {
  const records = trophies.filter((record) => record.missable);
  el('#missable-cards').innerHTML = records.map((record) => `<article class="missable-card${isEarned(record) ? ' complete' : ''}">
    <div>${medal(record.grade)}</div>
    <div><p class="missable-stage">Stage ${record.roadmapStage} · ${clean(STAGES[record.roadmapStage - 1][0])}</p><h3>${clean(record.name)}</h3><p class="official">${clean(record.description)}</p></div>
    <div><p class="missable-note">${clean(record.missableNote)}</p><div class="card-actions"><a class="small-button" href="#view=checklist&trophy=${record.id}&guard=off">Open guide</a><button type="button" class="small-button${isEarned(record) ? '' : ' solid'}" data-earn="${record.id}">${isEarned(record) ? 'Mark not earned' : 'Mark earned'}</button></div></div>
  </article>`).join('');
  bindMarks(el('#missable-cards'));
}

function renderRoadmap() {
  const next = trophies.find((record) => !isEarned(record));
  el('#roadmap-next').innerHTML = next
    ? `<strong>Do next:</strong> Stage ${next.roadmapStage} · ${clean(next.name)}. <a href="#view=checklist&trophy=${next.id}&guard=off">Open guide</a>`
    : '<strong>Route complete:</strong> all 55 trophies are earned.';
  el('#roadmap-stages').innerHTML = STAGES.map((stage, index) => {
    const number = index + 1;
    const items = trophies.filter((record) => record.roadmapStage === number);
    const got = items.filter(isEarned).length;
    const expanded = openStage === null ? number === (next ? next.roadmapStage : 9) : openStage === number;
    return `<section class="roadmap-stage">
      <button type="button" class="roadmap-heading" data-stage="${number}" aria-expanded="${expanded}">
        <span class="stage-number">${number}</span><span><strong>${clean(stage[0])}</strong><small>${clean(stage[1])}</small></span><span class="stage-count">${got}/${items.length} earned</span>
      </button>
      ${expanded ? `<div class="stage-items">${items.map((record) => `<label class="stage-item"><input type="checkbox" data-earn="${record.id}" ${isEarned(record) ? 'checked' : ''}><span>${clean(record.name)}${record.missable ? ' · missable' : ''}</span></label>`).join('')}</div>` : ''}
    </section>`;
  }).join('');
  el('#roadmap-stages').querySelectorAll('[data-stage]').forEach((button) => {
    button.onclick = () => { openStage = openStage === Number(button.dataset.stage) ? null : Number(button.dataset.stage); renderRoadmap(); };
  });
  bindMarks(el('#roadmap-stages'));
}

function exportProgress() {
  const payload = { app: 'leonida-field-guide', version: 3, earned: Object.fromEntries(earned), guard };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.app !== 'leonida-field-guide' || payload.version !== 3 || typeof payload.earned !== 'object') throw new Error('invalid');
    earned.clear();
    Object.entries(payload.earned).forEach(([id, time]) => {
      if (trophies.some((record) => record.id === Number(id))) earned.set(Number(id), time);
    });
    guard = payload.guard !== false;
    saveProgress();
    render();
  } catch {
    el('.page-foot').dataset.notice = 'That file is not a valid Leonida progress backup.';
  }
}

function renderTracker() {
  const count = earned.size;
  const missableLeft = trophies.filter((record) => record.missable && !isEarned(record)).length;
  const remainingHours = trophies.reduce((sum, record) => isEarned(record) ? sum : sum + (record.hours || 0), 0);
  el('#tracker-cards').innerHTML = `<div class="tracker-grid">
    <article class="tracker-card"><h3>Overall</h3><p><strong>${count} / 55</strong> earned</p><p>${55 - count} remaining</p></article>
    <article class="tracker-card"><h3>Close-outs</h3><p><strong>${11 - missableLeft} / 11</strong> missables cleared</p><p>${missableLeft} still vulnerable</p></article>
    <article class="tracker-card"><h3>Plan</h3><p><strong>${remainingHours}</strong> estimated hours left</p><p>Planning estimate, not unlock time</p></article>
    <article class="tracker-card"><h3>Medals</h3>${MEDALS.map((name) => `<p>${title(name)}: ${trophies.filter((record) => record.grade === name && isEarned(record)).length}/${trophies.filter((record) => record.grade === name).length}</p>`).join('')}</article>
    <article class="tracker-card"><h3>Stages</h3>${STAGES.map((stage, index) => {
      const items = trophies.filter((record) => record.roadmapStage === index + 1);
      return `<p>${index + 1}. ${stage[0]}: ${items.filter(isEarned).length}/${items.length}</p>`;
    }).join('')}</article>
    <article class="tracker-card"><h3>Storage</h3><p>Key: <code>${STORAGE}</code></p><p>Saved in this browser only</p></article>
    <div class="tracker-actions"><button type="button" class="small-button solid" id="export-save">Export JSON</button><button type="button" class="small-button" id="import-save">Import JSON</button><button type="button" class="small-button" id="reset-save">Reset</button><input id="save-file" type="file" accept="application/json" hidden></div>
  </div>`;
  el('#export-save').onclick = exportProgress;
  el('#import-save').onclick = () => el('#save-file').click();
  el('#save-file').onchange = (event) => importProgress(event.target.files[0]);
  el('#reset-save').onclick = () => {
    if (confirm('Clear all locally saved trophy progress?')) { earned.clear(); saveProgress(); render(); }
  };
}

function render() {
  renderHeader();
  ['checklist', 'missables', 'roadmap', 'tracker'].forEach((name) => {
    el(`#${name}-view`).hidden = view !== name;
  });
  if (view === 'checklist') renderChecklist();
  if (view === 'missables') renderMissables();
  if (view === 'roadmap') renderRoadmap();
  if (view === 'tracker') renderTracker();
}

function bindKeys() {
  el('#search-input').addEventListener('input', (event) => { search = event.target.value; writeLocation(); renderChecklist(); });
  el('#grade-select').addEventListener('change', (event) => { grade = event.target.value; writeLocation(); render(); });
  el('#group-select').addEventListener('change', (event) => { arrangement = event.target.value; render(); });
  el('#remaining-only').addEventListener('change', (event) => { remaining = event.target.checked; render(); });
  el('#spoiler-toggle').addEventListener('change', (event) => { guard = event.target.checked; saveProgress(); writeLocation(); render(); });
  el('#open-shortcuts').onclick = () => el('#shortcut-dialog').showModal();
  window.addEventListener('hashchange', () => { readLocation(); render(); });
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, select, textarea')) {
      if (event.key === 'Escape') event.target.blur();
      return;
    }
    if (event.key === '/') { event.preventDefault(); el('#search-input').focus(); return; }
    if (event.key === '?') { el('#shortcut-dialog').showModal(); return; }
    if (event.key === 'g') { chord = true; setTimeout(() => chord = false, 800); return; }
    if (chord) {
      const destinations = { c: 'checklist', m: 'missables', r: 'roadmap', t: 'tracker' };
      if (destinations[event.key]) { chord = false; view = destinations[event.key]; location.hash = `#view=${view}`; return; }
    }
    if (view !== 'checklist') return;
    const records = visibleTrophies();
    if (!records.length) return;
    if (event.key === 'j' || event.key === 'k') {
      event.preventDefault();
      cursor = event.key === 'j' ? Math.min(cursor + 1, records.length - 1) : Math.max(cursor - 1, 0);
      selected = records[cursor].id;
      writeLocation();
      render();
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (selected === null) selected = records[0].id;
      toggleEarned(selected);
    }
  });
}

async function start() {
  readSave();
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error(`Trophy data returned ${response.status}`);
  const document = await response.json();
  trophies = Array.isArray(document) ? document : document.trophies;
  readLocation();
  bindKeys();
  render();
}

start().catch((error) => {
  console.error(error);
  el('#trophy-rows').innerHTML = '<div class="empty-state"><h3>Trophy data could not load.</h3><p>Serve this directory with the included local server.</p></div>';
});
