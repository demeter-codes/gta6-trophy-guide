import { readFile, writeFile } from "node:fs/promises";

const sourceFile = new URL("../app/data/trophies.json", import.meta.url);
const sourceUrl = "https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/";
const playstationUrl = "https://www.playstation.com/en-us/games/grand-theft-auto-vi/";
const hiddenIds = new Set([2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 20, 22, 23, 24, 25, 26, 27, 29, 33, 36, 37, 38, 39, 40, 41, 43, 48]);

const details = [
  ["story", 9, null, null, "The complete trophy register", "Finish the other listed trophy conditions, then confirm the platinum appears in the console record.", "Review the outstanding rows.", "Complete each remaining condition.", "Confirm the platinum notification."],
  ["story", 1, null, null, "Gone Fishing, the named opening mission", "Complete the mission exactly as the trophy condition states, then let its result settle before changing activities.", "Start Gone Fishing.", "Complete the mission.", "Check the trophy record."],
  ["story", 2, "Chapter 1", null, "The Chapter 1 story endpoint", "Advance the main story through the chapter's final objective and verify that the chapter-completion event registers.", "Continue the main story.", "Complete Chapter 1.", "Confirm the chapter marker."],
  ["story", 3, "Chapter 2", null, "The Chapter 2 story endpoint", "Advance the main story through the chapter's final objective and verify that the chapter-completion event registers.", "Continue the main story.", "Complete Chapter 2.", "Confirm the chapter marker."],
  ["story", 4, "Chapter 3", null, "The Chapter 3 story endpoint", "Advance the main story through the chapter's final objective and verify that the chapter-completion event registers.", "Continue the main story.", "Complete Chapter 3.", "Confirm the chapter marker."],
  ["story", 5, "Chapter 4", null, "The Chapter 4 story endpoint", "Advance the main story through the chapter's final objective and verify that the chapter-completion event registers.", "Continue the main story.", "Complete Chapter 4.", "Confirm the chapter marker."],
  ["story", 6, "Final mission", null, "The final mission named by the game", "When ready, complete the final mission; the trophy condition gives no alternate ending or medal requirement.", "Review other story rows.", "Complete the final mission.", "Verify the gold award."],
  ["story", 2, null, null, "Breakfast Run", "Complete the named mission and wait for its completion screen before treating this story entry as done.", "Locate Breakfast Run in the story flow.", "Complete the mission.", "Check the trophy record."],
  ["story", 3, null, null, "The Cartel Heist", "Complete the named heist; no approach, crew choice, or medal threshold is specified in the published condition.", "Start The Cartel Heist.", "Complete the heist.", "Confirm its result."],
  ["story", 4, null, null, "Child's Play", "Complete the named mission and confirm the story result registers; the trophy description does not state an optional objective.", "Find Child's Play in the story flow.", "Complete the mission.", "Check the trophy record."],
  ["story", 5, null, null, "Headliners", "Complete the mission identified in the condition. The all-caps trophy title is not an extra gameplay requirement.", "Start Headliners.", "Complete the mission.", "Confirm the award."],
  ["story", 5, null, null, "VCIA Takedown", "Complete the named mission. The title alone does not establish a stealth, time, or score requirement.", "Start VCIA Takedown.", "Complete the mission.", "Check the trophy record."],
  ["story", 6, null, null, "Operation Savage Glory", "Complete the named operation and let the mission-end state register before leaving the activity.", "Start Operation Savage Glory.", "Complete the operation.", "Confirm the award."],
  ["activities", 9, null, 100, "The in-game completion checklist", "Use the game's own completion tracker to identify remaining eligible tasks; the trophy condition gives no category-by-category checklist.", "Open the completion tracker.", "Finish every requirement it lists.", "Confirm the total reaches 100 percent."],
  ["activities", 8, null, 250, "Stunt opportunities across Leonida", "Complete stunts until the tracked total reaches 250; the trophy condition does not specify a route or stunt type.", "Use the in-game stunt opportunities.", "Complete 250 stunts.", "Check the counter before stopping."],
  ["activities", 8, null, 9, "The game's activity types", "Sample each distinct activity type once; use the activity menu or prompts to keep a personal list and avoid repeating one category.", "List each activity type as you find it.", "Try every type once.", "Compare the list with the counter."],
  ["activities", 8, null, 42, "Every Shooting Range challenge", "Earn gold in each range challenge. The supplied PS5 list tracks 42 challenges; retry any result below gold.", "Open the Shooting Range.", "Earn gold in all 42 challenges.", "Recheck the challenge board."],
  ["activities", 8, null, 14, "Top Fun Drone Race locations", "Win a race at every location rather than repeating one course; use the game's activity tracker to spot any location still missing.", "Find each Top Fun race.", "Win once at every location.", "Check the location record."],
  ["activities", 8, null, 20, "Twenty different races", "Choose distinct race events and win each one; repeating a race does not satisfy the word “different” in the condition.", "Keep a list of race events.", "Win 20 different races.", "Review the race record."],
  ["activities", 8, null, null, "Cal's fishing challenge", "Enter the challenge with Cal and finish ahead of him. The description names the opponent and activity but does not state a required fish or score.", "Find Cal's fishing challenge.", "Beat Cal in the challenge.", "Confirm the result."],
  ["activities", 8, null, null, "Any arcade game", "Complete one full arcade game. Starting a cabinet is not enough: finish its round and wait for the game's completion state.", "Choose an arcade game.", "Finish one game.", "Check the trophy record."],
  ["story", 7, null, null, "Andy’s final mission", "Advance Andy's strand to its final mission and complete it; the condition requires the strand endpoint, not merely meeting the character.", "Follow Andy's mission strand.", "Complete his final mission.", "Confirm the result."],
  ["story", 7, null, null, "Kenton’s final mission", "Advance Kenton's strand to its final mission and complete it; the description does not name a particular approach or optional objective.", "Follow Kenton's mission strand.", "Complete his final mission.", "Check the trophy record."],
  ["story", 7, null, null, "Billy’s final mission", "Advance Billy's strand to its final mission and complete it; meeting him or starting the strand is not the stated endpoint.", "Follow Billy's mission strand.", "Complete his final mission.", "Confirm the result."],
  ["story", 7, null, 8, "Stranger mission strands around Leonida", "Finish eight distinct strands, tracking strand completion rather than individual missions; the condition does not list a preferred set.", "Find stranger strands across Leonida.", "Complete eight different strands.", "Check the strand tracker."],
  ["story", 7, null, null, "Randy’s final mission", "Advance Randy's strand to its final mission and complete it; the description does not establish a chapter number or optional score.", "Follow Randy's mission strand.", "Complete his final mission.", "Confirm the result."],
  ["story", 7, null, null, "Tyrone’s final mission", "Advance Tyrone's strand to its final mission and complete it; the condition calls for the endpoint rather than any single encounter.", "Follow Tyrone's mission strand.", "Complete his final mission.", "Check the trophy record."],
  ["exploration", 8, null, 18, "Meditation spots across Leonida", "Visit and use every meditation spot. Keep a location checklist and check the activity counter after each visit; the list supplies no coordinates.", "Find a meditation spot.", "Meditate at all 18 spots.", "Review the spot counter."],
  ["activities", 8, null, null, "The unique animal for Bret", "Hunt the unique animal tied to Bret's request. The trophy list gives neither a species nor a location, so use the request's in-game clue.", "Take Bret's hunting request.", "Hunt the unique animal.", "Confirm the request is complete."],
  ["collectibles", 8, null, 3, "Three complete Collectible Card sets", "Gather every card required for three full sets, not just three individual cards; check set completion in the game's collection screen.", "Open the card-set tracker.", "Complete three sets.", "Verify all three are marked complete."],
  ["collectibles", 9, null, 100, "WAiNK It check-ins at 100 locations", "Use WAiNK It in one hundred distinct places. Keep moving to new locations and use the in-game counter to distinguish unique places from repeats.", "Open WAiNK It.", "Use it at 100 locations.", "Check the location total."],
  ["collectibles", 9, null, 50, "The game's Challenges list", "Complete fifty challenges and use the tracker to distinguish completed entries from progress-only counters.", "Open the Challenges list.", "Complete 50 challenges.", "Verify the total."],
  ["combat", 8, null, 4, "A four-star Wanted Level with your partner", "Build the wanted level to four stars while your partner is with you, then escape the search without losing the partner condition.", "Bring your partner along.", "Reach four stars and escape the heat.", "Confirm the trophy after evasion."],
  ["combat", 8, null, 3, "Three shops in sequence with your partner", "Rob three shops back-to-back while your partner is present; keep the wanted state active throughout the chain as the description requires.", "Start with your partner present.", "Rob three shops without losing the Wanted Level.", "Check the result after the third shop."],
  ["exploration", 9, null, 100, "One hundred discovered vehicles", "Discover vehicles until the tracked total reaches one hundred. The condition says “discover,” not buy or own, so use the game's discovery record.", "Encounter unfamiliar vehicles.", "Discover 100 vehicles.", "Check the vehicle counter."],
  ["combat", 8, null, 5, "Five enemies in one Combat Focus use", "Activate Combat Focus when five enemies can be reached in the same use, then take all five down before the effect ends.", "Build a safe group of enemies.", "Use Combat Focus and take down five.", "Confirm it registered in one use."],
  ["exploration", 9, null, null, "An unscheduled departure at VCIA", "The description names VCIA and an unscheduled departure but no trigger. Explore the airport's in-game prompts and use the first clearly improvised exit opportunity.", "Go to VCIA.", "Make an unscheduled departure.", "Check the trophy record."],
  ["combat", 8, null, null, "The Rhino challenge", "The published line is a clue rather than a full instruction. It supplies no location or success condition, so consult the in-game challenge prompt and complete its Rhino requirement.", "Find the Rhino-related challenge prompt.", "Complete the prompted requirement.", "Verify the trophy notification."],
  ["combat", 8, null, null, "A jewelry-store robbery without detection", "Enter a jewelry store and complete the robbery without triggering detection. The list does not name a store or prescribe equipment.", "Choose a jewelry store.", "Complete the robbery undetected.", "Confirm the escape and award."],
  ["combat", 9, null, 5, "Five Bank Vault robberies", "Rob five bank vaults and escape each time. Count only successful escapes, and use the game record to see whether it tracks completed robberies.", "Find a bank vault opportunity.", "Rob it and escape.", "Repeat until five are recorded."],
  ["combat", 9, null, null, "An Armored Truck robbery", "Rob an Armored Truck and escape. The condition does not specify an approach, vehicle, or wanted-level threshold.", "Locate an Armored Truck opportunity.", "Rob the truck.", "Escape and check the record."],
  ["exploration", 8, null, 52, "Every area of Leonida", "Explore until the map records all 52 areas. Compare the map's undiscovered shading or the game's area counter rather than relying on visual familiarity.", "Open the state map.", "Visit every area.", "Confirm all 52 are recorded."],
  ["combat", 9, null, 9, "Illegal Operations from each gang", "Rob one Illegal Operation for every gang. Maintain a gang checklist so a second robbery for one group does not hide an unvisited group.", "Identify the gangs in the game.", "Rob one operation per gang.", "Confirm all nine are represented."],
  ["exploration", 9, null, null, "A cocktail with a view on Ocean Beach", "On Ocean Beach, enjoy a cocktail where the view condition can register. The list supplies no venue name or time-of-day requirement.", "Go to Ocean Beach.", "Order and enjoy a cocktail with a view.", "Check the trophy notification."],
  ["combat", 9, null, null, "A vehicle showroom escape", "Use the classic smash-through approach to leave a vehicle showroom. The description does not name a specific showroom or vehicle.", "Find a vehicle showroom.", "Smash your way out.", "Confirm the award."],
  ["activities", 9, null, null, "Kolt & Associates' bowling alley", "Follow through at the named bowling alley; the description is intentionally cryptic, so use the alley's own interaction and finish the prompted sequence.", "Go to Kolt & Associates' alley.", "Complete the bowling interaction.", "Check the trophy record."],
  ["activities", 9, null, null, "The partnership with mass appeal", "The public condition is only a clue. The list does not explain what “mass appeal” means, so keep this entry open until an in-game prompt or trusted walkthrough confirms the trigger.", "Review available partnership activities.", "Complete the activity that matches the clue.", "Verify the trophy rather than guessing."],
  ["activities", 9, null, 500, "Choices made in the game", "The public condition is a clue, not an instruction. Track choices as they occur and use the game's own counter or prompt to confirm the threshold; do not assume one specific dialogue option is required.", "Make choices as the story presents them.", "Continue until the tracked choice total reaches 500.", "Confirm the trophy notification."],
  ["activities", 9, null, null, "A second-time success", "The description signals a retry: repeat the relevant attempt after a first failure and succeed on the next try. It does not identify the activity.", "Identify the activity tied to this clue.", "Fail once, then succeed on attempt two.", "Confirm the trophy notification."],
  ["exploration", 9, null, null, "An unexplained encounter", "The condition is deliberately vague. Keep this entry open until an unusual event occurs and the game confirms it; the trophy record provides no supported location or trigger.", "Explore normally and watch for an unusual event.", "Complete the event if it prompts an interaction.", "Check for the award before leaving."],
  ["combat", 9, null, null, "A melee drive-by", "Use a melee attack from a moving vehicle to bowl over a target. The line specifies the action, not a particular weapon or target.", "Find a safe moving-vehicle opportunity.", "Land a melee drive-by on a target.", "Confirm the knockdown registered."],
  ["activities", 9, null, 250000, "Marked Bills laundered through contacts", "Use contacts to launder marked bills until the recorded total reaches $250,000. The condition names the currency and channel; it does not identify which contact.", "Collect marked bills.", "Launder them through contacts.", "Check the total reaches $250,000."],
  ["activities", 9, null, 100000, "Spending across all shops", "Spend a cumulative $100,000 across shops. The condition says across all shops, so vary purchases and confirm the aggregate rather than spending at one counter only.", "Visit shops and make purchases.", "Reach $100,000 spent across shops.", "Check the spending counter."],
  ["activities", 9, null, 8, "Every garage property", "Purchase all eight garage properties. Use a property checklist so none is overlooked; the list does not supply names or prices.", "Review purchasable garage properties.", "Buy all eight.", "Confirm the property list is complete."],
  ["activities", 9, null, 10, "Vehicles registered in the Scooter Bros app", "Register ten vehicles through the Scooter Bros app. Registration is the stated action; discovering or owning a vehicle alone may not count.", "Open Scooter Bros.", "Register 10 vehicles.", "Check the app's registered list."],
];

const text = await readFile(sourceFile, "utf8");
const data = JSON.parse(text);
if (data.trophies.length !== details.length) throw new Error("Metadata must cover all 55 trophies.");

for (const [index, trophy] of data.trophies.entries()) {
  const [kind, roadmapStage, chapter, count, where, how, ...steps] = details[index];
  const hidden = hiddenIds.has(trophy.id);
  const missableNote = null;
  const place = where[0].toLowerCase() + where.slice(1);
  const missableContext = missableNote
    ? `Missable check: ${missableNote}`
    : "Timing and missability: the published trophy condition does not state a one-time window or an action that closes access. Treat missability as unverified, not as proof that every activity is repeatable; keep a manual save before irreversible choices.";
  const countContext = count === null
    ? ""
    : ` The listed counter to watch is ${count}${Number.isFinite(count) ? "" : ""}.`;
  const guide = [
    `Condition: ${trophy.description} Treat that exact requirement as the confirmed target.${countContext}`,
    `Where: ${place}. The list gives no coordinates; use only the named target as your destination.`,
    `How: ${how} Check the game's result, then mark it earned only after the condition registers.`,
    missableContext,
    "Sources: Exophase lists the PS5 trophy condition and grade; PlayStation confirms the PS5 game, but neither page gives a route.",
  ].join(" ");
  const wordCount = guide.trim().split(/\s+/).length;
  if (wordCount < 100 || wordCount > 150) throw new Error(`${trophy.name} guide has ${wordCount} words.`);
  Object.assign(trophy, {
    hidden,
    kind,
    missable: false,
    missableNote,
    count,
    chapter,
    roadmapStage,
    guide,
    steps: steps.filter(Boolean),
    sources: [
      { label: "Exophase · PS5 trophy list", url: sourceUrl },
      { label: "PlayStation · GTA VI", url: playstationUrl },
    ],
  });
}

await writeFile(sourceFile, `${JSON.stringify(data, null, 2)}\n`);
