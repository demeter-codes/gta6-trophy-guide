// Leonida Field Guide: checklist, roadmap and tracker for the 55 GTA VI trophies on PlayStation 5.
// Plain ES module, no dependencies, no network beyond reading data/trophies.json from the same folder.

const STORE_KEY = 'leonida-field-guide:v1';
const EXPORT_APP = 'leonida-field-guide';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'combat', 'exploration', 'online'];
const KIND_NAMES = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  combat: 'Combat',
  exploration: 'Exploration',
  online: 'Online',
};

const STAGES = [
  { name: 'Opening hours', brief: 'Chapter 1: bank the first bronzes, take the balcony meditation and begin the first strands.' },
  { name: 'The partnership opens', brief: 'Chapter 2: unlock Jason and Lucia together, then try the activities that open with it.' },
  { name: 'The city opens', brief: 'Chapter 3: jewelry jobs, the Key Cloner and the first shop robberies with a partner.' },
  { name: 'Chapter 4 and the vaults', brief: 'Play the optional vault mission before the chapter closes, then finish the story missions.' },
  { name: 'Finale and credits', brief: 'Chapter 5 and the final mission. Free roam carries on afterwards.' },
  { name: 'Robberies and money', brief: 'Gang operations, vaults, armored trucks, laundering, garages and shops.' },
  { name: 'Activities and collections', brief: 'Stunts, ranges, races, scans, cards, challenges and the map.' },
  { name: 'Strands and choices', brief: 'Final missions for each character strand, the stranger count and the choice-driven stats.' },
  { name: 'Secrets and the long road', brief: 'One-off hidden events, then the 100% checklist that leads to the platinum.' },
];

const store = {
  earned: new Map(),
  guard: true,
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && raw.v === 1) {
        for (const [id, at] of Object.entries(raw.earned || {})) this.earned.set(Number(id), at);
        this.guard = raw.guard !== false;
      }
    } catch {
      ui.notice = { text: 'Saved progress could not be read; starting clean.', bad: true };
    }
  },
  save() {
    const earned = Object.fromEntries(this.earned);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, earned, guard: this.guard }));
      return true;
    } catch {
      ui.notice = { text: 'This browser would not store your progress.', bad: true };
      return false;
    }
  },
};

const ui = {
  view: 'checklist',
  selected: null,
  q: '',
  kind: 'all',
  grade: 'all',
  arrange: 'stage',
  remaining: false,
  stage: null,
  openStages: new Set(),
  notice: { text: '', bad: false },
};

let trophies = [];
const byId = new Map();

const $ = (sel) => document.querySelector(sel);

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isEarned = (t) => store.earned.has(t.id);
const isMasked = (t) => store.guard && t.kind === 'story' && !isEarned(t);

function toggleEarned(id) {
  if (store.earned.has(id)) store.earned.delete(id);
  else store.earned.set(id, Date.now());
  store.save();
  draw();
}

/* hash routing: #trophy=2, #view=roadmap, #view=tracker, plus optional kind, grade, stage, spoilers */
function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  const trophyId = Number(p.get('trophy'));
  const view = p.get('view');
  if (byId.has(trophyId)) {
    ui.view = 'checklist';
    ui.selected = trophyId;
  } else {
    ui.view = view === 'roadmap' || view === 'tracker' ? view : 'checklist';
    if (!p.has('trophy')) ui.selected = ui.view === 'checklist' && p.has('view') ? null : ui.selected;
  }
  if (KINDS.includes(p.get('kind'))) ui.kind = p.get('kind');
  if (GRADES.includes(p.get('grade'))) ui.grade = p.get('grade');
  const stage = Number(p.get('stage'));
  if (stage >= 1 && stage <= STAGES.length) {
    ui.stage = stage;
    ui.openStages.add(stage);
  }
  if (p.has('spoilers')) {
    store.guard = p.get('spoilers') !== 'off';
    store.save();
  }
}

/* filtering */
function visible() {
  const q = ui.q.trim().toLowerCase();
  const out = trophies.filter((t) => {
    if (ui.kind === 'missable' ? !t.missable : ui.kind !== 'all' && t.kind !== ui.kind) return false;
    if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
    if (ui.remaining && isEarned(t)) return false;
    if (!q) return true;
    if (isMasked(t)) return 'hidden trophy story'.includes(q);
    return `${t.name} ${t.description} ${t.kind} ${t.chapter}`.toLowerCase().includes(q);
  });
  const byGrade = (a, b) => GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
  out.sort((a, b) => (ui.arrange === 'grade' ? byGrade(a, b) : a.roadmapStage - b.roadmapStage) || a.id - b.id);
  return out;
}

/* markup */
const gradeTag = (g) => `<span class="grade ${g}">${g}</span>`;

function rowMarkup(t) {
  const masked = isMasked(t);
  const tags = masked
    ? '<span>story</span>'
    : `<span>${t.kind}</span>${t.missable ? '<span class="flag">missable</span>' : ''}${t.hidden ? '<span>hidden on PSN</span>' : ''}`;
  return `<div class="row${isEarned(t) ? ' done' : ''}">
    <label class="row-check"><input type="checkbox" data-earn="${t.id}"${isEarned(t) ? ' checked' : ''} aria-label="Earned: ${esc(masked ? 'hidden trophy' : t.name)}"></label>
    <button type="button" class="row-open" data-open="${t.id}" aria-current="${ui.selected === t.id}">
      <span>
        <span class="row-name${masked ? ' is-masked' : ''}">${masked ? 'Hidden trophy' : esc(t.name)}</span>
        <span class="row-desc">${masked ? 'Earn it, or switch the spoiler guard off, to read it.' : esc(t.description)}</span>
        <span class="row-tags">${tags}</span>
      </span>
      <span class="row-side">${gradeTag(t.grade)}<span>Stage ${t.roadmapStage}</span></span>
    </button>
  </div>`;
}

function rowsMarkup() {
  const list = visible();
  if (!list.length) {
    return `<div class="empty"><h3>Nothing matches.</h3><p>Loosen the search or filters to see the list again.</p><button type="button" class="link-btn" data-act="clear">Clear filters</button></div>`;
  }
  const groups = new Map();
  for (const t of list) {
    const key = ui.arrange === 'grade' ? cap(t.grade) : `Stage ${t.roadmapStage}: ${STAGES[t.roadmapStage - 1].name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  return [...groups].map(([title, items]) => `<h2 class="group-title">${esc(title)}</h2>${items.map(rowMarkup).join('')}`).join('');
}

function panelMarkup() {
  const t = byId.get(ui.selected);
  if (!t) {
    return `<div class="panel-body"><p class="kicker">Field note</p><h2>Pick a trophy</h2><p class="guide">Its official wording, guide, steps, missable warning and sources appear here.</p></div>`;
  }
  if (isMasked(t)) {
    return `<div class="panel-body">
      <div class="facts">${gradeTag(t.grade)}<span>Story</span></div>
      <h2 class="is-masked">Hidden trophy</h2>
      <p class="official">Held back by the spoiler guard.</p>
      <p class="guide">Earn it, or switch the guard off, to read the official wording and the guide.</p>
      <button type="button" class="btn solid" data-earn-btn="${t.id}">Mark earned</button>
    </div>`;
  }
  const warn = t.missable
    ? `<div class="warn" role="note"><b>Can be missed</b><p>${esc(t.missableNote)}</p></div>`
    : '';
  return `<div class="panel-body">
    <div class="facts">${gradeTag(t.grade)}<span>${cap(t.kind)}</span><span>${esc(t.chapter)}</span><span>No. ${t.id} of ${trophies.length}</span>${t.hidden ? '<span>Hidden on PSN</span>' : ''}</div>
    <h2>${esc(t.name)}</h2>
    <p class="official">${esc(t.description)}</p>
    ${warn}
    <h3>Guide</h3>
    <p class="guide">${esc(t.guide)}</p>
    <h3>Steps</h3>
    <ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <h3>Sources</h3>
    <ul class="sources">${t.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ul>
    <button type="button" class="btn solid" data-earn-btn="${t.id}">${isEarned(t) ? 'Earned. Mark as not earned' : 'Mark earned'}</button>
  </div>`;
}

function drawChecklist() {
  $('#f-search').value = ui.q;
  $('#f-grade').value = ui.grade;
  $('#f-arrange').value = ui.arrange;
  $('#f-remaining').checked = ui.remaining;
  $('#f-spoilers').checked = store.guard;
  $('#kind-bar').innerHTML = KINDS.map((k) => `<button type="button" class="kind-btn" data-kind="${k}" aria-pressed="${ui.kind === k}">${KIND_NAMES[k]}</button>`).join('');
  drawRows();
  $('#panel').innerHTML = panelMarkup();
}

function drawRows() {
  $('#shown').textContent = `${visible().length} of ${trophies.length} trophies shown`;
  $('#rows').innerHTML = rowsMarkup();
}

function drawRoadmap() {
  if (!ui.openStages.size) {
    const first = trophies.filter((t) => !isEarned(t)).map((t) => t.roadmapStage).sort((a, b) => a - b)[0];
    ui.openStages.add(first || 1);
  }
  $('#stages').innerHTML = STAGES.map((stage, i) => {
    const no = i + 1;
    const items = trophies.filter((t) => t.roadmapStage === no);
    const got = items.filter(isEarned).length;
    const risks = items.filter((t) => t.missable && !isEarned(t));
    const callout = risks.length
      ? `<div class="callout"><b>Missable at this stage</b>${risks.map((t) => `<p><a href="#trophy=${t.id}">${esc(t.name)}</a>: ${esc(t.missableNote)}</p>`).join('')}</div>`
      : '';
    return `<details class="stage" data-stage="${no}"${ui.openStages.has(no) ? ' open' : ''}>
      <summary>
        <span class="stage-no">${no}</span>
        <span><span class="stage-name">${esc(stage.name)}</span><span class="stage-brief">${esc(stage.brief)}</span></span>
        <span class="stage-count">${got} of ${items.length} earned</span>
      </summary>
      <div class="stage-body">${callout}${items.map(rowMarkup).join('')}</div>
    </details>`;
  }).join('');
}

function drawTracker() {
  const left = trophies.filter((t) => !isEarned(t));
  const risks = left.filter((t) => t.missable);
  const hours = left.reduce((sum, t) => sum + (t.hours || 0), 0);
  const total = trophies.length;
  const gradeRows = GRADES.map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    return `<tr><th scope="row">${gradeTag(g)}</th><td class="num">${all.filter(isEarned).length}</td><td class="num">${all.length}</td></tr>`;
  }).join('');
  const stageRows = STAGES.map((s, i) => {
    const all = trophies.filter((t) => t.roadmapStage === i + 1);
    return `<tr><th scope="row"><a href="#view=roadmap&stage=${i + 1}">${i + 1}. ${esc(s.name)}</a></th><td class="num">${all.filter(isEarned).length} / ${all.length}</td></tr>`;
  }).join('');
  const riskList = risks.length
    ? `<ul class="todo-list">${risks.map((t) => `<li><a href="#trophy=${t.id}">${esc(t.name)}</a><span>Stage ${t.roadmapStage}</span></li>`).join('')}</ul>`
    : '<p class="hint">No missables remain.</p>';
  $('#tracker').innerHTML = `
    <div class="stats">
      <div class="stat"><strong>${total - left.length}<small> / ${total}</small></strong><span>Earned</span><em>${Math.round(((total - left.length) / total) * 100)}% of the list</em></div>
      <div class="stat"><strong>${hours}</strong><span>Planning hours left</span><em>My split of the roughly 200-hour estimate</em></div>
      <div class="stat"><strong class="hot">${risks.length}</strong><span>Missables remaining</span><em>${risks.length ? 'Listed below with their stage' : 'None left to lose'}</em></div>
      <div class="stat"><strong>${left.length}</strong><span>Still to earn</span><em>${left.filter((t) => t.grade !== 'bronze').length} above bronze</em></div>
    </div>
    <div class="tracker-cols">
      <div>
        <h3>By grade</h3>
        <table><thead><tr><th>Grade</th><th class="num">Earned</th><th class="num">Total</th></tr></thead><tbody>${gradeRows}</tbody></table>
        <h3>By stage</h3>
        <table><tbody>${stageRows}</tbody></table>
      </div>
      <div>
        <h3>Your progress file</h3>
        <div class="actions">
          <button type="button" class="btn solid" data-act="export">Export progress</button>
          <label class="btn file-btn">Import progress<input type="file" id="import-file" accept="application/json,.json" aria-label="Import a progress file"></label>
          <button type="button" class="btn" data-act="reset">Reset</button>
        </div>
        <p class="hint">Progress lives in this browser. Export a JSON file to back it up or move it elsewhere; import reads it back.</p>
        <p id="status" class="status${ui.notice.bad ? ' bad' : ''}" role="status">${esc(ui.notice.text)}</p>
        <h3>Missables remaining</h3>
        ${riskList}
      </div>
    </div>`;
}

function drawChrome() {
  const got = trophies.filter(isEarned).length;
  $('#meter-text').textContent = `${got} of ${trophies.length}`;
  const bar = $('#meter-bar');
  bar.setAttribute('aria-valuenow', got);
  bar.firstElementChild.style.width = `${(got / trophies.length) * 100}%`;
  $('#btn-next').disabled = got === trophies.length;
  document.querySelectorAll('[data-tab]').forEach((a) => {
    if (a.dataset.tab === ui.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  for (const name of ['checklist', 'roadmap', 'tracker']) $(`#view-${name}`).hidden = name !== ui.view;
}

function draw() {
  drawChrome();
  if (ui.view === 'checklist') drawChecklist();
  else if (ui.view === 'roadmap') drawRoadmap();
  else drawTracker();
}

function say(text, bad = false) {
  ui.notice = { text, bad };
  const el = $('#status');
  if (el) {
    el.textContent = text;
    el.classList.toggle('bad', bad);
  }
}

/* export, import, reset */
function exportProgress() {
  const body = JSON.stringify({
    app: EXPORT_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: Object.fromEntries(store.earned),
  }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say(`Exported ${store.earned.size} earned trophies.`);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== EXPORT_APP || data.version !== 1 || typeof data.earned !== 'object' || Array.isArray(data.earned) || !data.earned) {
      throw new Error('this is not a progress file from this guide');
    }
    const next = new Map();
    for (const [id, at] of Object.entries(data.earned)) {
      if (at && byId.has(Number(id))) next.set(Number(id), at);
    }
    store.earned = next;
    const ok = store.save();
    draw();
    say(ok ? `Imported ${next.size} earned trophies.` : 'Imported, but this browser would not store it.', !ok);
  } catch (err) {
    say(`Import failed: ${err.message}. Nothing was changed.`, true);
  }
}

function resetProgress() {
  if (!confirm('Clear every earned trophy from this browser?')) return;
  store.earned.clear();
  store.save();
  draw();
  say('Progress cleared.');
}

function openNext() {
  const next = trophies.filter((t) => !isEarned(t)).sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id)[0];
  if (next) location.hash = `trophy=${next.id}`;
}

function clearFilters() {
  Object.assign(ui, { q: '', kind: 'all', grade: 'all', arrange: 'stage', remaining: false });
  drawChecklist();
}

/* events */
document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.open) location.hash = `trophy=${t.dataset.open}`;
  else if (t.dataset.earnBtn) toggleEarned(Number(t.dataset.earnBtn));
  else if (t.dataset.kind) { ui.kind = t.dataset.kind; drawChecklist(); }
  else if (t.id === 'btn-next') openNext();
  else if (t.dataset.act === 'export') exportProgress();
  else if (t.dataset.act === 'reset') resetProgress();
  else if (t.dataset.act === 'clear') clearFilters();
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.earn) toggleEarned(Number(el.dataset.earn));
  else if (el.id === 'f-grade') { ui.grade = el.value; drawChecklist(); }
  else if (el.id === 'f-arrange') { ui.arrange = el.value; drawChecklist(); }
  else if (el.id === 'f-remaining') { ui.remaining = el.checked; drawChecklist(); }
  else if (el.id === 'f-spoilers') { store.guard = el.checked; store.save(); draw(); }
  else if (el.id === 'import-file' && el.files[0]) { importProgress(el.files[0]); el.value = ''; }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'f-search') { ui.q = e.target.value; drawRows(); }
});

document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.dataset || !d.dataset.stage) return;
  if (d.open) ui.openStages.add(Number(d.dataset.stage));
  else ui.openStages.delete(Number(d.dataset.stage));
}, true);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === '/' && ui.view === 'checklist') { e.preventDefault(); $('#f-search').focus(); }
  else if (e.key === 'n') openNext();
});

window.addEventListener('hashchange', () => {
  readHash();
  draw();
  window.scrollTo(0, 0);
});

/* start */
store.load();
fetch('data/trophies.json')
  .then((res) => {
    if (!res.ok) throw new Error(`data request returned ${res.status}`);
    return res.json();
  })
  .then((data) => {
    trophies = data.trophies;
    for (const t of trophies) byId.set(t.id, t);
    for (const id of [...store.earned.keys()]) if (!byId.has(id)) store.earned.delete(id);
    readHash();
    draw();
  })
  .catch((err) => {
    $('#main').innerHTML = `<p class="notice" role="alert">The guide could not load its data (${esc(err.message)}). Serve the folder with <code>node serve.ts</code> and reload.</p>`;
  });
