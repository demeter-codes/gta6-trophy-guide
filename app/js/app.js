import { loadTrophies, readProgress, writeProgress, STAGES, STORAGE_KEY } from "./data.js";
import { renderChecklist, renderDetail, updateProgressHeader } from "./ui.js";
import { renderRoadmap } from "./roadmap.js";
import { renderTracker } from "./tracker.js";

const byId = (id) => document.getElementById(id);
let trophies;
let progress;
let noticeTimer;

function route() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get("view") || "checklist";
  return {
    params,
    view: view === "settings" ? "tracker" : ["checklist", "roadmap", "tracker"].includes(view) ? view : "checklist",
    selectedId: Number(params.get("trophy")) || null,
    stage: params.has("stage") ? Number(params.get("stage")) || 1 : null,
  };
}

function notify(message) {
  const notice = byId("notice");
  notice.textContent = message;
  notice.classList.add("is-visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.remove("is-visible"), 3600);
}

function currentFilters() {
  return {
    query: byId("search").value,
    kind: byId("kind-filter").value,
    grade: byId("grade-filter").value,
    group: byId("group-filter").value,
    remaining: byId("remaining-filter").checked,
  };
}

function writeRoute(updates, replace = false) {
  const params = new URLSearchParams(location.hash.slice(1));
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "" || value === false) params.delete(key);
    else params.set(key, String(value));
  }
  const hash = `#${params.toString()}`;
  if (replace) history.replaceState(null, "", hash);
  else location.hash = hash;
}

function persist() {
  writeProgress(progress);
  updateProgressHeader(trophies, progress);
}

function toggleEarned(trophy) {
  if (progress.earned[trophy.id]) delete progress.earned[trophy.id];
  else progress.earned[trophy.id] = Math.floor(Date.now() / 1000);
  persist();
  render();
}

function goToTrophy(trophy) {
  writeRoute({ view: "checklist", trophy: trophy.id });
}

function syncFiltersFromRoute(params) {
  byId("search").value = params.get("q") || "";
  byId("kind-filter").value = params.get("kind") || "all";
  byId("grade-filter").value = params.get("grade") || "all";
  byId("group-filter").value = params.get("group") || "stage";
  byId("remaining-filter").checked = params.get("remaining") === "1";
  byId("spoiler-toggle").checked = progress.spoilers;
}

function syncFilterRoute() {
  const filters = currentFilters();
  writeRoute({
    q: filters.query,
    kind: filters.kind === "all" ? null : filters.kind,
    grade: filters.grade === "all" ? null : filters.grade,
    group: filters.group === "stage" ? null : filters.group,
    remaining: filters.remaining ? "1" : null,
    spoilers: progress.spoilers ? "on" : "off",
  }, true);
  renderChecklistOnly();
}

function renderChecklistOnly() {
  const current = route();
  const filters = currentFilters();
  const stageNames = STAGES.map((stage) => stage.title);
  renderChecklist({
    trophies,
    progress,
    filters,
    selectedId: current.selectedId,
    stageNames,
    onSelect: goToTrophy,
    onEarn: toggleEarned,
  });
  renderDetail({
    trophy: trophies.find((trophy) => trophy.id === current.selectedId),
    progress,
    onEarn: toggleEarned,
    onDisableSpoilers: () => changeSpoilers(false),
  });
}

function render() {
  const current = route();
  const spoilerRoute = current.params.get("spoilers");
  if ((spoilerRoute === "on" || spoilerRoute === "off") &&
      progress.spoilers !== (spoilerRoute === "on")) {
    progress.spoilers = spoilerRoute === "on";
    writeProgress(progress);
  }
  document.querySelectorAll(".view").forEach((view) => { view.hidden = true; });
  byId(`${current.view}-view`).hidden = false;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === current.view));
  syncFiltersFromRoute(current.params);
  updateProgressHeader(trophies, progress);

  if (current.view === "checklist") {
    renderChecklistOnly();
  } else if (current.view === "roadmap") {
    renderRoadmap({
      trophies,
      progress,
      openStage: current.stage === null ? null : Math.min(9, Math.max(1, current.stage)),
      onOpenTrophy: goToTrophy,
      onOpenStage: (stage) => {
        writeRoute({ stage: stage === current.stage ? null : stage }, true);
        render();
      },
    });
  } else {
    renderTracker({
      trophies,
      progress,
      onExport: exportProgress,
      onImport: importProgress,
      onReset: resetProgress,
      onSpoilers: changeSpoilers,
    });
  }
}

function changeSpoilers(enabled) {
  progress.spoilers = enabled;
  persist();
  writeRoute({ spoilers: enabled ? "on" : "off" }, true);
  render();
}

function exportProgress() {
  const blob = new Blob([`${JSON.stringify(progress, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-field-guide-progress.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Progress exported as a JSON file.");
}

async function importProgress(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (imported?.v !== 1 || typeof imported.earned !== "object" || imported.earned === null || Array.isArray(imported.earned) ||
        typeof imported.spoilers !== "boolean") {
      throw new Error("This file is not a Leonida Field Guide save.");
    }
    const knownIds = new Set(trophies.map((trophy) => trophy.id));
    const earned = {};
    for (const [id, timestamp] of Object.entries(imported.earned)) {
      const numericId = Number(id);
      if (!knownIds.has(numericId) || !Number.isFinite(timestamp)) {
        throw new Error("The save contains an unknown trophy or invalid timestamp.");
      }
      earned[numericId] = timestamp;
    }
    progress = { v: 1, earned, spoilers: imported.spoilers };
    persist();
    render();
    notify(`Imported ${Object.keys(earned).length} earned trophies.`);
  } catch (error) {
    notify(error instanceof Error ? error.message : "The progress file could not be read.");
  } finally {
    input.value = "";
  }
}

function resetProgress() {
  if (!confirm("Reset all earned trophies and spoiler preferences on this device?")) return;
  progress = { v: 1, earned: {}, spoilers: true };
  localStorage.removeItem(STORAGE_KEY);
  render();
  notify("Progress reset on this device.");
}

try {
  trophies = await loadTrophies();
  try {
    progress = readProgress();
  } catch (error) {
    progress = { v: 1, earned: {}, spoilers: true };
    notify(error instanceof Error ? error.message : "Saved progress could not be read.");
  }
  const validIds = new Set(trophies.map((trophy) => trophy.id));
  progress.earned = Object.fromEntries(
    Object.entries(progress.earned).filter(([id]) => validIds.has(Number(id))),
  );
  const controls = ["search", "kind-filter", "grade-filter", "group-filter", "remaining-filter"];
  for (const id of controls) byId(id).addEventListener(id === "search" ? "input" : "change", syncFilterRoute);
  byId("spoiler-toggle").addEventListener("change", (event) => changeSpoilers(event.currentTarget.checked));
  window.addEventListener("hashchange", render);

  if (!location.hash) history.replaceState(null, "", "#view=checklist");
  render();
} catch (error) {
  notify(error instanceof Error ? error.message : "The guide could not start.");
  document.getElementById("checklist-view").innerHTML = "<p class=\"empty-state\">The guide could not load its local trophy data. Check app/data/trophies.json and reload.</p>";
}
