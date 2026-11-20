const iconCheck = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2 6 2.4 2.4L10 3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function gradeName(grade) {
  return grade ? grade[0].toUpperCase() + grade.slice(1) : "";
}

function displayedName(trophy, progress) {
  return progress.spoilers && trophy.kind === "story" && !progress.earned[trophy.id]
    ? "Hidden trophy"
    : trophy.name;
}

export function updateProgressHeader(trophies, progress) {
  const earned = Object.keys(progress.earned).length;
  const percent = Math.round(earned / trophies.length * 100);
  document.getElementById("header-progress").innerHTML = `${earned} <small>/ ${trophies.length}</small>`;
  document.getElementById("header-percent").textContent = `${percent}% complete`;
  document.getElementById("list-progress-label").textContent = `${earned} of ${trophies.length} earned`;
  document.getElementById("list-progress-percent").textContent = `${String(percent).padStart(2, "0")}%`;
  document.getElementById("list-progress-bar").style.width = `${percent}%`;
  const progressbar = document.querySelector('[role="progressbar"]');
  progressbar.setAttribute("aria-valuenow", String(earned));
}

export function renderChecklist({ trophies, progress, filters, selectedId, stageNames, onSelect, onEarn }) {
  const list = document.getElementById("trophy-list");
  list.replaceChildren();
  const filtered = trophies.filter((trophy) => {
    const earned = Boolean(progress.earned[trophy.id]);
    if (filters.kind === "missable" ? !trophy.missable : filters.kind !== "all" && trophy.kind !== filters.kind) return false;
    if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
    if (filters.remaining && earned) return false;
    const needle = filters.query.trim().toLowerCase();
    if (needle) {
      const searchable = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.chapter ?? ""} ${trophy.kind}`.toLowerCase();
      if (!searchable.includes(needle)) return false;
    }
    return true;
  });
  document.getElementById("result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;
  document.getElementById("empty-state").hidden = filtered.length !== 0;

  const groups = new Map();
  for (const trophy of filtered) {
    const key = filters.kind === "missable"
      ? `${String(trophy.missableStage).padStart(2, "0")} · ${stageNames[trophy.missableStage - 1]}`
      : filters.group === "grade"
      ? gradeName(trophy.grade)
      : `${String(trophy.roadmapStage).padStart(2, "0")} · ${stageNames[trophy.roadmapStage - 1]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trophy);
  }
  const gradeOrder = { Platinum: 0, Gold: 1, Silver: 2, Bronze: 3 };
  const entries = [...groups.entries()].sort((a, b) => filters.kind === "missable"
    ? a[0].localeCompare(b[0])
    : filters.group === "grade"
    ? gradeOrder[a[0]] - gradeOrder[b[0]]
    : a[0].localeCompare(b[0]));
  for (const [label, group] of entries) {
    list.append(node("h3", "group-heading", label));
    for (const trophy of group) {
      const earned = Boolean(progress.earned[trophy.id]);
      const item = node("div", `trophy-entry${trophy.id === selectedId ? " is-selected" : ""}`);
      const toggle = node("button", `earned-toggle${earned ? " is-earned" : ""}`);
      toggle.type = "button";
      toggle.setAttribute("aria-label", `${earned ? "Unmark" : "Mark"} ${displayedName(trophy, progress)} earned`);
      toggle.setAttribute("aria-pressed", String(earned));
      toggle.innerHTML = iconCheck;
      toggle.addEventListener("click", () => onEarn(trophy));

      const row = node("button", "trophy-row");
      row.type = "button";
      row.setAttribute("aria-label", `Open ${displayedName(trophy, progress)}`);
      const copy = node("span", "trophy-copy");
      copy.append(node("strong", "", displayedName(trophy, progress)));
      const teaser = progress.spoilers && trophy.kind === "story" && !earned
        ? "Story details hidden until earned"
        : trophy.description;
      copy.append(node("span", "", teaser));
      const meta = node("span", "row-meta");
      meta.append(node("span", `grade-tag ${trophy.grade}`, gradeName(trophy.grade)));
      meta.append(node("span", "row-kind", trophy.kind));
      row.append(copy, meta);
      row.addEventListener("click", () => onSelect(trophy));
      item.append(toggle, row);
      list.append(item);
    }
  }
}

export function renderDetail({ trophy, progress, onEarn, onDisableSpoilers }) {
  const panel = document.getElementById("detail-panel");
  panel.replaceChildren();
  if (!trophy) {
    const empty = node("div", "detail-empty");
    empty.append(node("span", "detail-empty-mark", "—"));
    empty.append(node("h2", "", "Choose a field note"));
    empty.append(node("p", "", "Select any entry to read its condition, guidance, steps and sources here."));
    panel.append(empty);
    return;
  }

  const earned = Boolean(progress.earned[trophy.id]);
  if (progress.spoilers && trophy.kind === "story" && !earned) {
    const lock = node("div", "spoiler-lock");
    lock.append(node("span", "eyebrow", `Entry ${String(trophy.id).padStart(2, "0")} · Story record`));
    lock.append(node("h2", "", "Hidden trophy"));
    lock.append(node("p", "", "This story entry stays covered until you earn it. The checklist keeps the grade visible while the title, condition and guide remain concealed."));
    const reveal = node("button", "", "Turn spoilers off to reveal");
    reveal.addEventListener("click", onDisableSpoilers);
    lock.append(reveal);
    panel.append(lock);
    return;
  }

  const topline = node("div", "detail-topline");
  topline.append(node("span", "eyebrow", `${trophy.kind} · field note`));
  topline.append(node("span", "detail-id", `NO. ${String(trophy.id).padStart(2, "0")}`));
  panel.append(topline);
  panel.append(node("h2", "", trophy.name));
  panel.append(node("p", "detail-description", `“${trophy.description}”`));

  const facts = node("div", "detail-facts");
  facts.append(node("span", "", gradeName(trophy.grade)));
  facts.append(node("span", "", trophy.kind));
  if (trophy.chapter) facts.append(node("span", "", trophy.chapter));
  if (trophy.count) facts.append(node("span", "", `Count · ${trophy.count}`));
  panel.append(facts);

  const guideSection = node("section", "detail-section");
  guideSection.append(node("h3", "", "Field guide"));
  guideSection.append(node("p", "detail-guide", trophy.guide));
  panel.append(guideSection);

  const sources = node("section", "detail-section");
  sources.append(node("h3", "", "Sources"));
  const links = node("div", "source-list");
  for (const source of trophy.sources) {
    const link = node("a", "", source.label);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link);
  }
  sources.append(links);
  panel.append(sources);

  const stepSection = node("section", "detail-section");
  stepSection.append(node("h3", "", "In brief"));
  const steps = node("ol", "steps");
  for (const step of trophy.steps) steps.append(node("li", "", step));
  stepSection.append(steps);
  panel.append(stepSection);

  const missable = node("div", `detail-section missable-note${trophy.missable ? "" : " is-clear"}`);
  missable.textContent = trophy.missable
    ? `Missable · ${trophy.missableNote}`
    : "No missable lockout is established by the published trophy condition. This is unverified, not a guarantee that every activity is repeatable.";
  panel.append(missable);

  const earn = node("button", `earn-button${earned ? " is-earned" : ""}`, earned ? "Mark as not earned" : "Mark earned");
  earn.type = "button";
  earn.addEventListener("click", () => onEarn(trophy));
  panel.append(earn);
}

export { node, displayedName, gradeName };
