import { STAGES } from "./data.js";
import { displayedName, node } from "./ui.js";

export function renderRoadmap({ trophies, progress, openStage, onOpenTrophy, onOpenStage }) {
  const root = document.getElementById("roadmap-view");
  root.replaceChildren();
  const heading = node("div", "view-heading");
  const title = node("div");
  title.append(node("span", "eyebrow", "A route through the register"));
  title.append(node("h2", "", "Roadmap to the platinum"));
  heading.append(title);
  heading.append(node("p", "", "Story markers first, then the state-wide work, then a deliberate cleanup. The descriptions do not establish any one-time lockout, so no trophy is falsely labeled missable."));
  root.append(heading);

  const grid = node("div", "stage-grid");
  for (const stage of STAGES) {
    const stageTrophies = trophies.filter((trophy) => trophy.roadmapStage === stage.id);
    const earned = stageTrophies.filter((trophy) => progress.earned[trophy.id]).length;
    const card = node("article", `stage-card${openStage === stage.id ? " is-open" : ""}`);
    const stageHead = node("div", "stage-head");
    stageHead.append(node("span", "stage-number", `STAGE ${String(stage.id).padStart(2, "0")}`));
    stageHead.append(node("span", "stage-count", `${earned}/${stageTrophies.length} earned`));
    card.append(stageHead);
    const title = node("button", "", stage.title);
    title.type = "button";
    title.style.cssText = "border:0;padding:0;background:none;color:inherit;cursor:pointer;text-align:left";
    title.addEventListener("click", () => onOpenStage(stage.id));
    card.append(title);
    card.lastChild.className = "stage-title";
    card.append(node("p", "", stage.brief));

    const stageMissables = stageTrophies.filter((trophy) => trophy.missable);
    if (stageMissables.length) {
      for (const trophy of stageMissables) {
        card.append(node("div", "stage-missable", `Missable here · ${trophy.name}: ${trophy.missableNote}`));
      }
    } else {
      card.append(node("div", "stage-missable is-clear", "No confirmed missable in this stage"));
    }

    if (openStage === stage.id) {
      const list = node("ul", "stage-trophies");
      for (const trophy of stageTrophies) {
        const row = node("li");
        const name = node("span", "", displayedName(trophy, progress));
        row.append(name);
        const open = node("button", "", progress.earned[trophy.id] ? "OPEN" : "VIEW");
        open.type = "button";
        open.addEventListener("click", () => onOpenTrophy(trophy));
        row.append(open);
        list.append(row);
      }
      card.append(list);
    }
    grid.append(card);
  }
  root.append(grid);
}
