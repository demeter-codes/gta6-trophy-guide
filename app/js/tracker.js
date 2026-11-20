import { GRADES } from "./data.js";
import { gradeName, node } from "./ui.js";

export function renderTracker({ trophies, progress, onExport, onImport, onReset, onSpoilers }) {
  const root = document.getElementById("tracker-view");
  root.replaceChildren();
  const heading = node("div", "view-heading");
  const title = node("div");
  title.append(node("span", "eyebrow", "A clear-eyed tally"));
  title.append(node("h2", "", "Your trophy ledger"));
  heading.append(title);
  heading.append(node("p", "", "A local-only record of the work ahead. The hour figure is a planning allowance, not a published completion-time claim."));
  root.append(heading);

  const earnedCount = trophies.filter((trophy) => progress.earned[trophy.id]).length;
  const remaining = trophies.length - earnedCount;
  const hoursLeft = remaining * 2;
  const missablesLeft = trophies.filter((trophy) => trophy.missable && !progress.earned[trophy.id]).length;
  const summary = node("div", "tracker-summary");
  const progressMetric = node("div", "metric");
  progressMetric.append(node("span", "", "Overall progress"));
  progressMetric.append(node("strong", "", `${earnedCount}/${trophies.length}`));
  progressMetric.append(node("small", "", `${Math.round(earnedCount / trophies.length * 100)} percent recorded`));
  const hoursMetric = node("div", "metric");
  hoursMetric.append(node("span", "", "Planning hours left"));
  hoursMetric.append(node("strong", "", `~${hoursLeft}`));
  hoursMetric.append(node("small", "", "2 hours per remaining entry"));
  const missableMetric = node("div", "metric");
  missableMetric.append(node("span", "", "Missables remaining"));
  missableMetric.append(node("strong", "", String(missablesLeft)));
  missableMetric.append(node("small", "", "Only confirmed lockouts count"));
  summary.append(progressMetric, hoursMetric, missableMetric);
  root.append(summary);

  const layout = node("div", "tracker-layout");
  const breakdown = node("section", "tracker-block");
  breakdown.append(node("h3", "", "By grade"));
  const lines = node("div", "grade-breakdown");
  for (const grade of GRADES) {
    const subset = trophies.filter((trophy) => trophy.grade === grade);
    const count = subset.filter((trophy) => progress.earned[trophy.id]).length;
    const line = node("div", "grade-line");
    line.append(node("span", "", gradeName(grade)));
    const track = node("div", "progress-track");
    const fill = node("span");
    fill.style.width = `${subset.length ? count / subset.length * 100 : 0}%`;
    track.append(fill);
    line.append(track);
    line.append(node("span", "", `${count} / ${subset.length}`));
    lines.append(line);
  }
  breakdown.append(lines);

  const actions = node("section", "tracker-block");
  actions.append(node("h3", "", "Save file"));
  const actionRow = node("div", "tracker-actions");
  const exportButton = node("button", "action-button", "Export progress");
  exportButton.type = "button";
  exportButton.addEventListener("click", onExport);
  const importButton = node("button", "action-button secondary", "Import progress");
  importButton.type = "button";
  importButton.addEventListener("click", () => document.getElementById("import-progress").click());
  const resetButton = node("button", "action-button danger", "Reset");
  resetButton.type = "button";
  resetButton.addEventListener("click", onReset);
  actionRow.append(exportButton, importButton, resetButton);
  actions.append(actionRow);

  const settings = node("section", "settings-block");
  settings.append(node("h3", "", "Spoiler setting"));
  settings.append(node("p", "", "Story names and guide text stay covered until earned while spoiler protection is on. The switch is also available on the checklist."));
  const settingLabel = node("label", "check-filter");
  settingLabel.style.cssText = "margin:14px 0 0;color:var(--ink)";
  const settingToggle = node("input");
  settingToggle.type = "checkbox";
  settingToggle.checked = progress.spoilers;
  settingToggle.addEventListener("change", () => onSpoilers(settingToggle.checked));
  settingLabel.append(settingToggle, document.createTextNode("Hide unearned story trophies"));
  settings.append(settingLabel);
  actions.append(settings);
  layout.append(breakdown, actions);
  root.append(layout);

  const note = node("div", "missable-summary");
  note.append(node("strong", "", `${missablesLeft} confirmed missables remain`));
  note.append(node("p", "", "The published trophy conditions do not identify a one-time failure point. This guide leaves unverified lockouts unmarked rather than treating absence of evidence as a guarantee."));
  root.append(note);

  const fileInput = node("input", "import-input");
  fileInput.id = "import-progress";
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.addEventListener("change", onImport);
  root.append(fileInput);
}
