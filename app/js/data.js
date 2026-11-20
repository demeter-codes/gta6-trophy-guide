export const STORAGE_KEY = "gta6.fieldguide.v1";
export const GRADES = ["platinum", "gold", "silver", "bronze"];

export const STAGES = [
  { id: 1, title: "First light", brief: "Start with the opening job and establish your story save." },
  { id: 2, title: "Chapter 1", brief: "Close out the first chapter before moving into the wider state." },
  { id: 3, title: "Chapter 2", brief: "Keep the main story moving; record chapter progress as it lands." },
  { id: 4, title: "Chapter 3", brief: "Continue the story and leave open-world counters for a dedicated sweep." },
  { id: 5, title: "Chapter 4", brief: "Finish the next listed chapter, then review what the story unlocked." },
  { id: 6, title: "Endgame", brief: "Complete the final mission after checking the remaining story entries." },
  { id: 7, title: "People of Leonida", brief: "Work through named character strands and stranger missions." },
  { id: 8, title: "Statewide pursuits", brief: "Mix activities, exploration, combat, and collectible progress." },
  { id: 9, title: "Platinum sweep", brief: "Use the counters and filters to close every remaining requirement." },
];

export async function loadTrophies() {
  const response = await fetch("./data/trophies.json");
  if (!response.ok) throw new Error(`Trophy data could not be loaded (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
    throw new Error("Trophy data must contain exactly 55 entries.");
  }
  const invalid = data.trophies.find((t) =>
    !t.name?.trim() || !t.description?.trim() || !GRADES.includes(t.grade) ||
    !t.guide?.trim() || !Array.isArray(t.sources) || !t.sources.length
  );
  if (invalid) throw new Error(`Trophy data is incomplete: ${invalid.name || "unnamed entry"}.`);
  return data.trophies;
}

export function readProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { v: 1, earned: {}, spoilers: true };
  const save = JSON.parse(raw);
  if (save?.v !== 1 || typeof save.earned !== "object" || save.earned === null || Array.isArray(save.earned) ||
      typeof save.spoilers !== "boolean") {
    throw new Error("Saved progress has an unrecognized format.");
  }
  return {
    v: 1,
    earned: Object.fromEntries(Object.entries(save.earned).filter(([, value]) => Number.isFinite(value))),
    spoilers: save.spoilers,
  };
}

export function writeProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
