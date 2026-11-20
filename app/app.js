const KEY = 'gta6-trophy-guide:v1';
const KINDS = ['story', 'missable', 'collectibles', 'activities', 'combat', 'exploration', 'online'];
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const STAGES = [
  ['Chapter 1 and the meditation window', 'Finish Chapter 1, but take Lucia\u2019s balcony invitation at Jason\u2019s house first: it is the one event here that does not wait.'],
  ['Chapters 2 and 3: the systems open', 'Story missions that unlock joint free-roam, garages, vehicle registration and the Snap Gun. Play them, and bank the early bronzes.'],
  ['Character strands and strangers', 'Start these as the calls arrive and finish them before the final mission. Six strands end in a final mission; eight stranger strands make one silver.'],
  ['Chapters 4 and 5, and the credits', 'The late story, taken after the strands are closed. Free-roam continues after the credits, so nothing in the cleanup is lost.'],
  ['Robberies, getaways and gang jobs', 'Jewelry, bank vaults, armored trucks and gang operations. Several overlap: a bank vault is also a 4-star escape.'],
  ['One-off secrets', 'Hidden single-event trophies. Most are short experiments; try them in one sitting between larger goals.'],
  ['Activities and money', 'Races, drones, the range, fishing, arcade, laundering, shopping, garages and registrations.'],
  ['Collections and counts', 'Stunts, cards, WAiNK scans, challenges, vehicle discoveries and the exploration sweep. Long, forgiving, and worth doing together.'],
  ['Strength, choices and the platinum', 'Maximum Strength for both characters, 500 choices, the in-game 100% checklist, then the platinum.']
];
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

let trophies = [];
let byId = new Map();
const store = load();
const ui = { view: 'checklist', id: null, q: '', kind: 'all', grade: 'all', sort: 'stage', remaining: false, stage: null, status: '', err: false };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version === 1 && s.earned) return { version: 1, earned: s.earned, settings: { spoilers: true, ...s.settings } };
  } catch (e) { /* fall through */ }
  return { version: 1, earned: {}, settings: { spoilers: true } };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ } }
const earned = (t) => !!store.earned[t.id];
const masked = (t) => store.settings.spoilers && t.hidden && t.kind === 'story' && !earned(t);

function toggle(id) {
  if (store.earned[id]) delete store.earned[id]; else store.earned[id] = Date.now();
  save(); render();
}

function parseHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.has('spoilers')) { store.settings.spoilers = p.get('spoilers') !== 'off'; save(); }
  if (p.has('kind') && (p.get('kind') === 'all' || KINDS.includes(p.get('kind')))) ui.kind = p.get('kind');
  if (p.has('grade') && (p.get('grade') === 'all' || GRADES.includes(p.get('grade')))) ui.grade = p.get('grade');
  const stage = parseInt(p.get('stage'), 10);
  ui.stage = stage >= 1 && stage <= 9 ? stage : null;
  const id = parseInt(p.get('trophy'), 10);
  if (byId.has(id)) { ui.view = 'checklist'; ui.id = id; }
  else if (p.get('view') === 'roadmap' || p.get('view') === 'tracker') ui.view = p.get('view');
  else ui.view = 'checklist';
}

function matches(t) {
  if (ui.kind === 'missable' ? !t.missable : ui.kind !== 'all' && t.kind !== ui.kind) return false;
  if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
  if (ui.remaining && earned(t)) return false;
  const q = ui.q.trim().toLowerCase();
  if (q && (masked(t) || !(t.name + ' ' + t.description + ' ' + t.kind + ' ' + t.chapter).toLowerCase().includes(q))) return false;
  return true;
}

function badge(t) { return `<span class="badge ${t.grade}">${t.grade}</span>`; }
function tags(t) {
  if (masked(t)) return '<span class="tag">story</span>';
  return `<span class="tag">${t.kind}</span>` + (t.missable ? '<span class="tag miss">missable</span>' : '') + (t.hidden ? '<span class="tag">hidden on PSN</span>' : '');
}
function row(t) {
  const m = masked(t);
  return `<div class="row${earned(t) ? ' earned' : ''}" role="button" tabindex="0" data-id="${t.id}" aria-current="${ui.id === t.id}">
<input type="checkbox" aria-label="Earned: ${m ? 'hidden trophy' : esc(t.name)}" data-earn="${t.id}"${earned(t) ? ' checked' : ''}>
<div><span class="nm${m ? ' hiddenname' : ''}">${m ? 'Hidden trophy' : esc(t.name)}</span><span class="ds">${m ? 'Earn it, or switch spoilers off, to read it.' : esc(t.description)}</span><div class="tags">${tags(t)}</div></div>
<div class="side">${badge(t)}<span class="tag">Stage ${t.roadmapStage}</span></div></div>`;
}

function checklist() {
  const list = trophies.filter(matches);
  const groups = new Map();
  for (const t of list) {
    const g = ui.sort === 'grade' ? cap(t.grade) : `Stage ${t.roadmapStage}: ${STAGES[t.roadmapStage - 1][0]}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(t);
  }
  const keys = [...groups.keys()].sort((a, b) => ui.sort === 'grade' ? GRADES.indexOf(a.toLowerCase()) - GRADES.indexOf(b.toLowerCase()) : parseInt(a.slice(6), 10) - parseInt(b.slice(6), 10));
  const opts = (arr, cur) => `<option value="all">All</option>` + arr.map((v) => `<option value="${v}"${v === cur ? ' selected' : ''}>${cap(v)}</option>`).join('');
  const body = list.length
    ? keys.map((k) => `<div class="group">${esc(k)}</div>${groups.get(k).map(row).join('')}`).join('')
    : `<div class="empty"><h2>Nothing matches.</h2><p>${ui.kind === 'online' ? 'The game has no online trophies: GAMES.GG says every trophy is earned offline.' : 'Loosen a filter or clear the search.'}</p></div>`;
  return `<div class="layout"><section aria-label="Trophy checklist">
<div class="tools">
<label>Search<input type="search" id="q" value="${esc(ui.q)}" placeholder="Name or description"></label>
<label>Kind<select id="kind">${opts(KINDS, ui.kind)}</select></label>
<label>Grade<select id="grade">${opts(GRADES, ui.grade)}</select></label>
<label>Arrange by<select id="sort"><option value="stage"${ui.sort === 'stage' ? ' selected' : ''}>Roadmap stage</option><option value="grade"${ui.sort === 'grade' ? ' selected' : ''}>Grade</option></select></label>
<label class="check"><input type="checkbox" id="remaining"${ui.remaining ? ' checked' : ''}> Remaining only</label></div>
<p class="shown">${list.length} of ${trophies.length} trophies shown</p>${body}</section>
<aside class="detail" aria-label="Trophy detail">${detail()}</aside></div>`;
}

function detail() {
  const t = byId.get(ui.id);
  if (!t) return `<div class="empty"><h2>Pick a trophy.</h2><p>Its guide, steps, missable warning and sources open here. Links look like #trophy=2.</p></div>`;
  const m = masked(t);
  const btn = `<button class="btn${earned(t) ? ' on' : ''}" type="button" data-earn="${t.id}">${earned(t) ? 'Earned. Undo' : 'Mark earned'}</button>`;
  if (m) return `<div class="meta">${badge(t)}<span>Story</span></div><h2 class="hiddenname">Hidden trophy</h2>
<p class="desc">Hidden on PlayStation, and hidden here while the spoiler switch is on.</p><p>Its name, description and guide stay covered until you earn it or switch spoilers off at the top right.</p>${btn}`;
  return `<div class="meta">${badge(t)}<span>${cap(t.kind)}</span><span>${esc(t.chapter)}</span><span>No. ${t.id} of 55</span>${t.hidden ? '<span>Hidden on PSN</span>' : ''}</div>
<h2>${esc(t.name)}</h2><p class="desc">${esc(t.description)}</p>
${t.missable ? `<div class="warn"><strong>Can be missed</strong>${esc(t.missableNote)}</div>` : ''}
<h3>Guide</h3><p>${esc(t.guide)}</p>
<h3>Steps</h3><ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h3>Sources</h3><ul class="src">${t.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ul>
<p style="margin-top:14px">${btn}</p>`;
}

function roadmap() {
  const open = ui.stage || (trophies.find((t) => !earned(t)) || { roadmapStage: 1 }).roadmapStage;
  const items = STAGES.map(([title, brief], i) => {
    const n = i + 1;
    const ts = trophies.filter((t) => t.roadmapStage === n);
    const done = ts.filter(earned).length;
    const miss = ts.filter((t) => t.missable && !earned(t));
    const alert = miss.length
      ? `<div class="alert"><b>Missable at this stage</b>${miss.map((t) => masked(t) ? '<p>A hidden story trophy can close here. Switch spoilers off to read which.</p>' : `<p><a href="#trophy=${t.id}">${esc(t.name)}</a>: ${esc(t.missableNote)}</p>`).join('')}</div>`
      : '';
    return `<details class="stage"${n === open ? ' open' : ''}><summary><span class="no">${n}</span><span><h2>${esc(title)}</h2><p class="brief">${esc(brief)}</p></span><span class="ct">${done} of ${ts.length} earned</span></summary>
<div class="body">${alert}${ts.map(row).join('')}</div></details>`;
  }).join('');
  return `<section class="road" aria-label="Roadmap"><p class="lede">Nine stages, in the order that costs the least regret. Stages 1 and 3 hold everything that can close, so they come before the credits.</p>${items}</section>`;
}

function tracker() {
  const n = trophies.length;
  const got = trophies.filter(earned).length;
  const left = trophies.filter((t) => !earned(t));
  const hrs = left.reduce((a, t) => a + t.hours, 0);
  const miss = left.filter((t) => t.missable);
  const rows = GRADES.map((g) => { const ts = trophies.filter((t) => t.grade === g); return `<tr><td>${badge({ grade: g })}</td><td class="r">${ts.filter(earned).length}</td><td class="r">${ts.length}</td></tr>`; }).join('');
  const stageRows = STAGES.map(([title], i) => { const ts = trophies.filter((t) => t.roadmapStage === i + 1); return `<tr><td><a href="#view=roadmap&stage=${i + 1}">${i + 1}. ${esc(title)}</a></td><td class="r">${ts.filter(earned).length} / ${ts.length}</td></tr>`; }).join('');
  return `<section class="tracker" aria-label="Tracker">
<div class="stat"><div class="n">${got}<span style="font-size:22px;color:var(--muted)"> / ${n}</span></div><div class="l">Trophies earned</div><div class="s">${Math.round((got / n) * 100)}% of the list</div></div>
<div class="stat"><div class="n">${Math.round(hrs)}</div><div class="l">Planning hours left</div><div class="s">A rough allocation, not a measurement</div></div>
<div class="stat"><div class="n" style="color:var(--accent)">${miss.length}</div><div class="l">Missables remaining</div><div class="s">${miss.length ? 'See the list below' : 'None left to lose'}</div></div>
<div class="stat"><div class="n">${left.length}</div><div class="l">Trophies to go</div><div class="s">${left.filter((t) => t.grade !== 'bronze').length} above bronze</div></div>
<div class="twocol"><div><h2>By grade</h2><table><thead><tr><th>Grade</th><th class="r">Earned</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table>
<h2 style="margin-top:18px">By stage</h2><table><tbody>${stageRows}</tbody></table></div>
<div><h2>Missables remaining</h2>${miss.length ? `<ul class="misslist">${miss.map((t) => masked(t) ? `<li><a href="#trophy=${t.id}">A hidden story trophy</a></li>` : `<li><a href="#trophy=${t.id}">${esc(t.name)}</a> <span class="tag">stage ${t.roadmapStage}</span></li>`).join('')}</ul>` : '<p class="empty">Every missable is earned.</p>'}
<h2 style="margin-top:18px">Your progress file</h2>
<div class="actions"><button class="btn" id="export" type="button">Export progress</button>
<label class="btn ghost" style="cursor:pointer">Import progress<input type="file" id="import" accept="application/json,.json" hidden></label>
<button class="btn ghost" id="reset" type="button">Reset</button>
<p class="note">Progress lives in this browser only. Export a JSON file to back it up or move it, then import it here.</p></div>
<p class="status${ui.err ? ' err' : ''}" role="status">${esc(ui.status)}</p>
<p class="note" style="font-size:13px;color:var(--muted)">GAMES.GG estimates about 200 hours for the platinum, story included. The hours here split that effort across trophies and are for planning only.</p></div></div></section>`;
}

function render() {
  const main = $('#main');
  const focus = document.activeElement && document.activeElement.id;
  main.innerHTML = ui.view === 'roadmap' ? roadmap() : ui.view === 'tracker' ? tracker() : checklist();
  const got = trophies.filter(earned).length;
  $('#count').textContent = `${got} of ${trophies.length} earned`;
  $('#barfill').style.width = (got / trophies.length) * 100 + '%';
  $('#bar').setAttribute('aria-valuenow', got);
  $('#spoilers').checked = store.settings.spoilers;
  document.querySelectorAll('#tabs a').forEach((a) => (a.dataset.view === ui.view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const t = byId.get(ui.id);
  document.title = ui.view === 'checklist' && t && !masked(t) ? `${t.name} | GTA VI trophy field guide` : 'Field Guide to the 55 Trophies of Grand Theft Auto VI';
  if (focus === 'q') { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: 'gta6-trophy-guide', version: 1, exported: new Date().toISOString(), earned: store.earned }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  ui.status = `Exported ${Object.keys(store.earned).length} earned trophies.`; ui.err = false; render();
}
async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.app !== 'gta6-trophy-guide' || typeof data.earned !== 'object') throw new Error('not a progress file from this guide');
    const next = {};
    for (const id of Object.keys(data.earned)) if (byId.has(Number(id)) && data.earned[id]) next[id] = Number(data.earned[id]) || Date.now();
    store.earned = next; save();
    ui.status = `Imported ${Object.keys(next).length} earned trophies.`; ui.err = false;
  } catch (e) { ui.status = 'Import failed: ' + e.message + '. Progress is unchanged.'; ui.err = true; }
  render();
}

document.addEventListener('click', (e) => {
  const earn = e.target.closest('[data-earn]');
  if (earn) { e.stopPropagation(); if (earn.tagName === 'BUTTON') toggle(Number(earn.dataset.earn)); return; }
  const r = e.target.closest('.row');
  if (r) { location.hash = 'trophy=' + r.dataset.id; return; }
  if (e.target.id === 'export') exportProgress();
  if (e.target.id === 'reset' && confirm('Clear all earned trophies from this browser?')) { store.earned = {}; save(); ui.status = 'Progress cleared.'; ui.err = false; render(); }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('input[data-earn]')) return toggle(Number(t.dataset.earn));
  if (t.id === 'spoilers') { store.settings.spoilers = t.checked; save(); return render(); }
  if (t.id === 'import' && t.files[0]) return importProgress(t.files[0]);
  if (t.id === 'kind') ui.kind = t.value;
  else if (t.id === 'grade') ui.grade = t.value;
  else if (t.id === 'sort') ui.sort = t.value;
  else if (t.id === 'remaining') ui.remaining = t.checked;
  else return;
  render();
});
document.addEventListener('input', (e) => { if (e.target.id === 'q') { ui.q = e.target.value; render(); } });
document.addEventListener('keydown', (e) => {
  const r = e.target.closest && e.target.closest('.row');
  if (r && e.target === r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.hash = 'trophy=' + r.dataset.id; }
});
window.addEventListener('hashchange', () => {
  const was = ui.view;
  parseHash();
  render();
  if (ui.view !== was || !/^#trophy=\d+$/.test(location.hash)) window.scrollTo(0, 0);
});

fetch('data/trophies.json').then((r) => r.json()).then((d) => {
  trophies = d.trophies;
  byId = new Map(trophies.map((t) => [t.id, t]));
  parseHash();
  render();
}).catch(() => { $('#main').innerHTML = '<div class="empty"><h2>Could not load the trophy data.</h2><p>Serve this folder over HTTP, for example with node serve.ts.</p></div>'; });
