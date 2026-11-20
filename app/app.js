const STORAGE_KEY = 'gta6-trophy-guide:v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_ORDER = [
  'story',
  'collectibles',
  'activities',
  'combat',
  'exploration',
  'online'
];
const ROADMAP = [
  {
    title: 'Chapter 1 and the meditation window',
    brief: 'Finish the opening chapter after completing Lucia’s invitation at Jason’s house.'
  },
  {
    title: 'Chapters 2 and 3: new systems',
    brief: 'Open the shared world, vehicles, garages and early free-roam activities.'
  },
  {
    title: 'Character strands and strangers',
    brief: 'Work through the character strands before their final missions close the window.'
  },
  {
    title: 'Chapters 4 and 5, then the credits',
    brief: 'Complete the later story after closing every time-sensitive strand.'
  },
  {
    title: 'Robberies, getaways and gang jobs',
    brief: 'Combine heists, escapes and gang work where one outing satisfies several goals.'
  },
  {
    title: 'One-off secrets',
    brief: 'Set aside a short session for unusual interactions and hidden events.'
  },
  {
    title: 'Activities and money',
    brief: 'Clear the races, range, arcade, fishing, laundering and vehicle tasks.'
  },
  {
    title: 'Collections and exploration',
    brief: 'Pair collectible sweeps with stunts, challenges, scans and vehicle discoveries.'
  },
  {
    title: 'Strength, choices and the platinum',
    brief: 'Finish the long counts, the in-game completion checklist and the remaining list.'
  }
];
const KIND_LABELS = [
  ['all', 'All kinds'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['combat', 'Combat'],
  ['exploration', 'Exploration'],
  ['online', 'Online']
];

const byId = new Map();
const earnedIds = new Set();
const restoredEarnedIds = new Set();
const openedStages = new Set();
const state = {
  trophies: [],
  view: 'checklist',
  selectedId: null,
  search: '',
  kind: 'all',
  grade: 'all',
  arrange: 'stage',
  remaining: false,
  spoilers: true,
  stage: null,
  stageStateInitialized: false,
  message: '',
  messageIsError: false
};

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character];
  });
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.version === 1 && saved.earned && typeof saved.earned === 'object') {
      Object.entries(saved.earned).forEach(([id, earnedAt]) => {
        if (earnedAt && Number.isFinite(Number(id))) {
          restoredEarnedIds.add(Number(id));
        }
      });
      state.spoilers = saved.settings?.spoilers !== false;
    }
  } catch (error) {
    state.message = 'Saved progress could not be read. You can continue and export a new copy.';
    state.messageIsError = true;
  }
}

function writeProgress() {
  const earned = {};
  for (const id of earnedIds) {
    earned[id] = Date.now();
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      earned,
      settings: { spoilers: state.spoilers }
    }));
    return true;
  } catch (error) {
    state.message = 'Progress changed on this page but could not be saved in this browser.';
    state.messageIsError = true;
    return false;
  }
}

function isEarned(trophy) {
  return earnedIds.has(trophy.id);
}

function isMasked(trophy) {
  return state.spoilers
    && trophy.hidden
    && trophy.kind === 'story'
    && !isEarned(trophy);
}

function updateEarned(id) {
  if (earnedIds.has(id)) {
    earnedIds.delete(id);
  } else {
    earnedIds.add(id);
  }
  writeProgress();
  render();
}

function parseLocation() {
  const parameters = new URLSearchParams(location.hash.slice(1));
  const trophyId = Number(parameters.get('trophy'));
  const stageId = Number(parameters.get('stage'));
  const view = parameters.get('view');

  if (Number.isInteger(trophyId) && byId.has(trophyId)) {
    state.view = 'checklist';
    state.selectedId = trophyId;
  } else if (['roadmap', 'tracker'].includes(view)) {
    state.view = view;
    state.selectedId = null;
  } else {
    state.view = 'checklist';
    state.selectedId = null;
  }

  state.stage = Number.isInteger(stageId) && stageId >= 1 && stageId <= 9
    ? stageId
    : null;
  if (state.stage) {
    openedStages.add(state.stage);
    state.stageStateInitialized = true;
  }

  const kind = parameters.get('kind');
  if (KIND_LABELS.some(([value]) => value === kind)) {
    state.kind = kind;
  }
  const grade = parameters.get('grade');
  if (GRADE_ORDER.includes(grade)) {
    state.grade = grade;
  }
  if (parameters.has('spoilers')) {
    state.spoilers = parameters.get('spoilers') !== 'off';
    writeProgress();
  }
}

function matchesFilters(trophy) {
  if (state.kind === 'missable' && !trophy.missable) {
    return false;
  }
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && trophy.grade !== state.grade) {
    return false;
  }
  if (state.remaining && isEarned(trophy)) {
    return false;
  }
  const query = state.search.trim().toLocaleLowerCase();
  if (query) {
    if (isMasked(trophy)) {
      return 'hidden trophy'.includes(query);
    }
    const searchable = [
      trophy.name,
      trophy.description,
      trophy.kind,
      trophy.chapter
    ].join(' ').toLocaleLowerCase();
    if (!searchable.includes(query)) {
      return false;
    }
  }
  return true;
}

function gradeBadge(grade) {
  return `<span class="badge ${escapeText(grade)}">${escapeText(grade)}</span>`;
}

function trophyTags(trophy) {
  if (isMasked(trophy)) {
    return '<span class="tag">story</span>';
  }
  const tags = [`<span class="tag">${escapeText(trophy.kind)}</span>`];
  if (trophy.missable) {
    tags.push('<span class="tag miss">missable</span>');
  }
  if (trophy.hidden) {
    tags.push('<span class="tag">hidden on PSN</span>');
  }
  return tags.join('');
}

function trophyRow(trophy) {
  const masked = isMasked(trophy);
  const label = masked ? 'Hidden trophy' : trophy.name;
  const description = masked
    ? 'Earn it, or turn spoilers off, to read the details.'
    : trophy.description;
  return `<li class="entry${isEarned(trophy) ? ' earned' : ''}">
    <label class="earned-toggle">
      <input type="checkbox" data-earned="${trophy.id}" ${isEarned(trophy) ? 'checked' : ''} aria-label="Mark ${escapeText(label)} earned">
      <span class="sr-only">Earned</span>
    </label>
    <button class="entry-open" type="button" data-open="${trophy.id}" aria-current="${state.selectedId === trophy.id}">
      <span class="entry-copy">
        <span class="entry-name${masked ? ' hidden-name' : ''}">${escapeText(label)}</span>
        <span class="entry-description">${escapeText(description)}</span>
        <span class="tags">${trophyTags(trophy)}</span>
      </span>
      <span class="entry-aside">
        ${gradeBadge(trophy.grade)}
        <span class="tag">Stage ${trophy.roadmapStage}</span>
      </span>
    </button>
  </li>`;
}

function makeKindChips() {
  return KIND_LABELS.map(([value, label]) => {
    const current = state.kind === value;
    return `<button type="button" class="chip${current ? ' selected' : ''}" data-kind="${value}" aria-pressed="${current}">${label}</button>`;
  }).join('');
}

function visibleTrophies() {
  const list = state.trophies.filter(matchesFilters);
  return list.sort((a, b) => {
    if (state.arrange === 'grade') {
      const byGrade = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
      return byGrade || a.id - b.id;
    }
    return a.roadmapStage - b.roadmapStage || a.id - b.id;
  });
}

function checklistMarkup() {
  const list = visibleTrophies();
  const groups = new Map();
  for (const trophy of list) {
    const key = state.arrange === 'grade'
      ? titleCase(trophy.grade)
      : `Stage ${trophy.roadmapStage}: ${ROADMAP[trophy.roadmapStage - 1].title}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(trophy);
  }
  const sortedGroups = Array.from(groups.entries());
  if (state.arrange === 'grade') {
    sortedGroups.sort((a, b) => GRADE_ORDER.indexOf(a[0].toLowerCase()) - GRADE_ORDER.indexOf(b[0].toLowerCase()));
  } else {
    sortedGroups.sort((a, b) => Number(a[0].match(/\d+/)[0]) - Number(b[0].match(/\d+/)[0]));
  }

  const listMarkup = sortedGroups.length
    ? sortedGroups.map(([heading, trophies]) => `<li class="group">
        <h2>${escapeText(heading)}</h2>
        <ol>${trophies.map(trophyRow).join('')}</ol>
      </li>`).join('')
    : `<li class="empty-state">
        <h2>No trophies match those filters.</h2>
        <p>Clear the search or reset the filters to see the full list.</p>
        <button class="text-button" type="button" id="clear-filters">Clear filters</button>
      </li>`;

  return listMarkup;
}

function detailMarkup() {
  const trophy = byId.get(state.selectedId);
  if (!trophy) {
    return `<div class="detail-empty">
      <p class="folio">Field note</p>
      <h2>Choose a trophy</h2>
      <p>Its description, route, missable window and citations will appear here.</p>
    </div>`;
  }
  if (isMasked(trophy)) {
    return `<div class="detail-inner">
      <div class="detail-meta">${gradeBadge(trophy.grade)} <span>Story</span></div>
      <h2 class="hidden-name">Hidden trophy</h2>
      <p class="description">This story trophy is hidden on PlayStation and in the guide while spoilers are on.</p>
      <p>Earn it or turn off the spoiler setting to reveal its official details and guide.</p>
      <button class="button primary" type="button" data-earned="${trophy.id}">Mark earned</button>
    </div>`;
  }

  const sources = trophy.sources.map((source) => `<li>
    <a href="${escapeText(source.url)}" target="_blank" rel="noopener noreferrer">${escapeText(source.label)}</a>
  </li>`).join('');
  const steps = trophy.steps.map((step) => `<li>${escapeText(step)}</li>`).join('');
  const warning = trophy.missable
    ? `<aside class="warning" aria-label="Missable trophy">
        <strong>Can be missed</strong>
        <p>${escapeText(trophy.missableNote)}</p>
      </aside>`
    : '';
  return `<article class="detail-inner">
    <div class="detail-meta">
      ${gradeBadge(trophy.grade)}
      <span>${escapeText(titleCase(trophy.kind))}</span>
      <span>${escapeText(trophy.chapter)}</span>
      <span>No. ${trophy.id} of 55</span>
      ${trophy.hidden ? '<span>Hidden on PSN</span>' : ''}
    </div>
    <h2>${escapeText(trophy.name)}</h2>
    <p class="description">${escapeText(trophy.description)}</p>
    ${warning}
    <h3>Guide</h3>
    <p>${escapeText(trophy.guide)}</p>
    <h3>Steps</h3>
    <ol class="guide-steps">${steps}</ol>
    <h3>Sources</h3>
    <ul class="source-list">${sources}</ul>
    <button class="button primary earned-button" type="button" data-earned="${trophy.id}">
      ${isEarned(trophy) ? 'Earned · mark remaining' : 'Mark earned'}
    </button>
  </article>`;
}

function missableCallout(trophy) {
  if (isMasked(trophy)) {
    return '<p>A hidden story trophy can close here. Turn spoilers off to see its name and note.</p>';
  }
  return `<p><a href="#trophy=${trophy.id}">${escapeText(trophy.name)}</a>: ${escapeText(trophy.missableNote)}</p>`;
}

function roadmapMarkup() {
  const firstUnearned = state.trophies.find((trophy) => !isEarned(trophy));
  const defaultStage = state.stage || firstUnearned?.roadmapStage || 1;
  if (!state.stageStateInitialized) {
    openedStages.add(defaultStage);
    state.stageStateInitialized = true;
  }
  return ROADMAP.map((stage, index) => {
    const number = index + 1;
    const group = state.trophies.filter((trophy) => trophy.roadmapStage === number);
    const completed = group.filter(isEarned).length;
    const missables = group.filter((trophy) => trophy.missable && !isEarned(trophy));
    const open = openedStages.has(number);
    const callout = missables.length
      ? `<aside class="stage-warning">
          <strong>Missable at this stage</strong>
          ${missables.map(missableCallout).join('')}
        </aside>`
      : '';
    return `<details class="stage" data-stage="${number}" ${open ? 'open' : ''}>
      <summary>
        <span class="stage-number">${String(number).padStart(2, '0')}</span>
        <span class="stage-heading">
          <span class="stage-title">${escapeText(stage.title)}</span>
          <span class="stage-brief">${escapeText(stage.brief)}</span>
        </span>
        <span class="stage-count">${completed} of ${group.length} earned</span>
      </summary>
      <div class="stage-content">
        ${callout}
        <ol class="stage-list">${group.map(trophyRow).join('')}</ol>
      </div>
    </details>`;
  }).join('');
}

function gradeTableMarkup() {
  return GRADE_ORDER.map((grade) => {
    const group = state.trophies.filter((trophy) => trophy.grade === grade);
    const completed = group.filter(isEarned).length;
    return `<tr>
      <th scope="row">${gradeBadge(grade)}</th>
      <td class="numeric">${completed}</td>
      <td class="numeric">${group.length}</td>
    </tr>`;
  }).join('');
}

function stageTableMarkup() {
  return ROADMAP.map((stage, index) => {
    const number = index + 1;
    const group = state.trophies.filter((trophy) => trophy.roadmapStage === number);
    const completed = group.filter(isEarned).length;
    return `<tr>
      <th scope="row"><a href="#view=roadmap&stage=${number}">${number}. ${escapeText(stage.title)}</a></th>
      <td class="numeric">${completed} / ${group.length}</td>
    </tr>`;
  }).join('');
}

function trackerMarkup() {
  const total = state.trophies.length;
  const completed = state.trophies.filter(isEarned).length;
  const remaining = state.trophies.filter((trophy) => !isEarned(trophy));
  const missed = remaining.filter((trophy) => trophy.missable);
  const hoursLeft = remaining.reduce((sum, trophy) => sum + (Number(trophy.hours) || 0), 0);
  const higherGrades = remaining.filter((trophy) => trophy.grade !== 'bronze').length;
  const missableList = missed.length
    ? `<ul class="missable-list">${missed.map((trophy) => `<li>
        <a href="#trophy=${trophy.id}">${escapeText(isMasked(trophy) ? 'Hidden story trophy' : trophy.name)}</a>
        <span class="tag">Stage ${trophy.roadmapStage}</span>
      </li>`).join('')}</ul>`
    : '<p class="empty-copy">Every missable trophy is marked earned.</p>';
  return `<section class="tracker-grid" aria-label="Progress tracker">
    <div class="stat"><strong>${completed}<span> / ${total}</span></strong><span>Trophies earned</span><small>${total ? Math.round(completed / total * 100) : 0}% of the list</small></div>
    <div class="stat"><strong>${Math.round(hoursLeft)}</strong><span>Planning hours left</span><small>A rough allocation, not a timer</small></div>
    <div class="stat"><strong class="accent">${missed.length}</strong><span>Missables remaining</span><small>${missed.length ? 'See their stage and note below' : 'None left to lose'}</small></div>
    <div class="stat"><strong>${remaining.length}</strong><span>Trophies to go</span><small>${higherGrades} above bronze</small></div>
    <div class="tracker-columns">
      <section>
        <h2>By grade</h2>
        <table>
          <thead><tr><th scope="col">Grade</th><th class="numeric" scope="col">Earned</th><th class="numeric" scope="col">Total</th></tr></thead>
          <tbody>${gradeTableMarkup()}</tbody>
        </table>
        <h2 class="subheading">By roadmap stage</h2>
        <table>
          <tbody>${stageTableMarkup()}</tbody>
        </table>
      </section>
      <section>
        <h2>Your progress file</h2>
        <div class="file-actions">
          <button class="button primary" type="button" id="export-progress">Export progress</button>
          <label class="button secondary file-label">
            Import progress
            <input id="import-progress" type="file" accept="application/json,.json" aria-label="Import a saved progress JSON file">
          </label>
          <button class="button secondary" type="button" id="reset-progress">Reset</button>
        </div>
        <p class="file-note">Progress stays in this browser. Export a JSON file to back it up or move it to another browser.</p>
        <p class="status${state.messageIsError ? ' error' : ''}" id="status-message" role="status" aria-live="polite">${escapeText(state.message)}</p>
        <p class="file-note">The planning estimate is divided across the remaining entries; actual play time will vary.</p>
        <h2 class="subheading">Missables remaining</h2>
        ${missableList}
      </section>
    </div>
  </section>`;
}

function updateHeader() {
  const total = state.trophies.length;
  const completed = state.trophies.filter(isEarned).length;
  document.querySelector('#head-count').textContent = `${completed} / ${total}`;
  const progressBar = document.querySelector('.summary .bar');
  progressBar.setAttribute('aria-valuenow', String(completed));
  document.querySelector('#head-bar').style.width = `${total ? completed / total * 100 : 0}%`;
  const nextButton = document.querySelector('#next-unearned');
  nextButton.disabled = completed === total;
  document.querySelectorAll('.tabs a').forEach((link) => {
    if (link.dataset.view === state.view) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function preserveInputFocus(previousId) {
  if (previousId !== 'q') {
    return;
  }
  const input = document.querySelector('#q');
  if (!input) {
    return;
  }
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function render() {
  const previousFocus = document.activeElement?.id;
  const list = document.querySelector('#list');
  const detail = document.querySelector('#detail');
  list.innerHTML = checklistMarkup();
  detail.innerHTML = detailMarkup();
  document.querySelector('#stages').innerHTML = roadmapMarkup();
  document.querySelector('#tracker').innerHTML = trackerMarkup();
  document.querySelector('#kinds').innerHTML = makeKindChips();
  document.querySelector('#result-count').textContent = `${visibleTrophies().length} of ${state.trophies.length} trophies shown`;
  document.querySelector('#q').value = state.search;
  document.querySelector('#grade').value = state.grade;
  document.querySelector('#arrange').value = state.arrange;
  document.querySelector('#remaining').checked = state.remaining;
  document.querySelector('#spoilers').checked = state.spoilers;
  const kindNote = document.querySelector('#kind-note');
  kindNote.hidden = state.kind !== 'online';
  kindNote.textContent = state.kind === 'online'
    ? 'No trophies in this list are tagged online.'
    : '';
  document.querySelectorAll('.view').forEach((view) => {
    view.hidden = view.id !== `view-${state.view}`;
  });
  updateHeader();
  preserveInputFocus(previousFocus);
}

function jumpToNext() {
  const next = state.trophies
    .filter((trophy) => !isEarned(trophy))
    .sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id)[0];
  if (!next) {
    document.querySelector('#jump-status').textContent = 'All trophies are marked earned.';
    return;
  }
  location.hash = `trophy=${next.id}`;
  document.querySelector('#jump-status').textContent = `Opened ${isMasked(next) ? 'a hidden story trophy' : next.name}.`;
}

function clearFilters() {
  state.search = '';
  state.kind = 'all';
  state.grade = 'all';
  state.arrange = 'stage';
  state.remaining = false;
  render();
  document.querySelector('#q').focus();
}

function setMessage(message, isError = false) {
  state.message = message;
  state.messageIsError = isError;
  const status = document.querySelector('#status-message');
  if (status) {
    status.textContent = message;
    status.classList.toggle('error', isError);
  }
}

function exportProgress() {
  const earned = {};
  for (const id of earnedIds) {
    earned[id] = Date.now();
  }
  const contents = JSON.stringify({
    app: 'gta6-trophy-guide',
    version: 1,
    exported: new Date().toISOString(),
    earned
  }, null, 2);
  const file = new Blob([contents], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = 'gta6-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setMessage(`Exported progress for ${earnedIds.size} earned trophies.`);
}

async function importProgress(file) {
  try {
    const imported = JSON.parse(await file.text());
    if (
      imported?.app !== 'gta6-trophy-guide'
      || imported.version !== 1
      || !imported.earned
      || typeof imported.earned !== 'object'
      || Array.isArray(imported.earned)
    ) {
      throw new Error('Choose a version 1 progress file exported by this guide.');
    }
    const nextEarned = new Set();
    for (const [id, value] of Object.entries(imported.earned)) {
      const numericId = Number(id);
      if (value && byId.has(numericId)) {
        nextEarned.add(numericId);
      }
    }
    earnedIds.clear();
    nextEarned.forEach((id) => earnedIds.add(id));
    const stored = writeProgress();
    render();
    setMessage(
      stored
        ? `Imported ${earnedIds.size} earned trophies.`
        : 'Progress was imported for this page but could not be saved in this browser.',
      !stored
    );
  } catch (error) {
    setMessage(`Import failed: ${error.message} Progress was not changed.`, true);
  }
}

function handleClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const kindChip = target.closest('[data-kind]');
  if (kindChip) {
    state.kind = kindChip.dataset.kind;
    render();
    return;
  }
  const openButton = target.closest('[data-open]');
  if (openButton) {
    location.hash = `trophy=${openButton.dataset.open}`;
    return;
  }
  const earnedButton = target.closest('[data-earned]');
  if (earnedButton && earnedButton.tagName === 'BUTTON') {
    updateEarned(Number(earnedButton.dataset.earned));
    return;
  }
  if (target.closest('#next-unearned')) {
    jumpToNext();
    return;
  }
  if (target.closest('#clear-filters')) {
    clearFilters();
    return;
  }
  if (target.closest('#export-progress')) {
    exportProgress();
    return;
  }
  if (target.closest('#reset-progress')) {
    if (window.confirm('Clear every earned trophy from this browser?')) {
      earnedIds.clear();
      const saved = writeProgress();
      setMessage(
        saved ? 'Progress cleared.' : 'Progress cleared for this page but could not be saved in this browser.',
        !saved
      );
      render();
    }
  }
}

function handleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }
  if (target.matches('[data-earned]')) {
    updateEarned(Number(target.dataset.earned));
    return;
  }
  if (target.id === 'grade') {
    state.grade = target.value;
  } else if (target.id === 'arrange') {
    state.arrange = target.value;
  } else if (target.id === 'remaining') {
    state.remaining = target.checked;
  } else if (target.id === 'spoilers') {
    state.spoilers = target.checked;
    writeProgress();
  } else if (target.id === 'import-progress' && target.files?.[0]) {
    importProgress(target.files[0]);
    target.value = '';
    return;
  } else {
    return;
  }
  render();
}

function handleKeyboard(event) {
  const target = event.target;
  const isEditing = target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  if (event.key === '/' && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditing) {
    event.preventDefault();
    document.querySelector('#q').focus();
    return;
  }
  if (event.key.toLowerCase() === 'n' && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditing) {
    event.preventDefault();
    jumpToNext();
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('change', handleChange);
document.addEventListener('keydown', handleKeyboard);
document.addEventListener('input', (event) => {
  if (event.target.id === 'q') {
    state.search = event.target.value;
    render();
  }
});
document.addEventListener('toggle', (event) => {
  const stage = event.target;
  if (!(stage instanceof HTMLDetailsElement) || !stage.matches('[data-stage]')) {
    return;
  }
  const number = Number(stage.dataset.stage);
  if (stage.open) {
    openedStages.add(number);
  } else {
    openedStages.delete(number);
  }
}, true);
window.addEventListener('hashchange', () => {
  parseLocation();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

readProgress();
fetch('data/trophies.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Trophy data request failed with status ${response.status}.`);
    }
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
      throw new Error('The trophy data file does not contain all 55 entries.');
    }
    state.trophies = data.trophies;
    state.trophies.forEach((trophy) => byId.set(trophy.id, trophy));
    for (const id of restoredEarnedIds) {
      if (byId.has(id)) {
        earnedIds.add(id);
      }
    }
    parseLocation();
    if (state.stage) {
      openedStages.add(state.stage);
    }
    render();
  })
  .catch((error) => {
    document.querySelector('#main').innerHTML = `<section class="data-error" role="alert">
      <h2>The field guide could not open.</h2>
      <p>${escapeText(error.message)}</p>
      <p>Run <code>node serve.ts</code> and reopen this page so its local data file can load.</p>
    </section>`;
  });
