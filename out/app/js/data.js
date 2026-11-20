// data.js — the guide's data layer. Loads app/data/trophies.json once and answers
// pure questions about it: what a stage is, what a grade is called, what a numeric
// count should read like, and which trophies match a search. No DOM in here.

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABEL = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABEL = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  combat: 'Combat',
  exploration: 'Exploration',
  online: 'Online',
};

// The roadmap is the spine of the guide. Each stage says when it happens, what the
// player does, and (from the trophy data) which trophies it clears.
export const STAGES = [
  {
    num: 1,
    title: 'The opening',
    when: 'Opening mission',
    brief: 'Gone Fishing, then the first hours in Leonida.',
    detail:
      'Play Gone Fishing through to the end. Before you leave the opening, switch on progress and collectible notifications in the settings, because everything you pass from now on feeds a long count, and make a manual save in one of the 15 slots. There are no difficulty settings and no mission replay, so saves are the only way back.',
  },
  {
    num: 2,
    title: 'Chapter 1',
    when: 'Chapter 1',
    brief: 'The chapter with the list’s only known missable in it.',
    detail:
      'After Down to Earth, find Lucia at Jason’s house in the morning, follow her to the balcony and accept the meditation before you leave the chapter. That one spot is what both GTA Base and KeenGamer flag as potentially missable. Finish the chapter’s story missions to bank the chapter trophy, and take every optional marker the chapter offers while it is offering it.',
  },
  {
    num: 3,
    title: 'Chapter 2',
    when: 'Chapter 2',
    brief: 'Story missions plus the first character strands.',
    detail:
      'The Cartel Heist and Child’s Play are the two named mission trophies here. Keep taking optional missions and character strands as they appear; GTA Base notes several are only offered for a stretch of the game. Story heists are not the five bank vaults that Maximum Withdrawal wants, so do not count them.',
  },
  {
    num: 4,
    title: 'Chapter 3',
    when: 'Chapter 3',
    brief: 'Headliners, and the halfway check on the long counts.',
    detail:
      'Play Headliners, then open Progress, Stats and the 100% Completion list once and compare your activity counts against the targets. Chapter 3 is roughly the middle of the campaign, which makes it the cheapest place to notice that a count is far behind.',
  },
  {
    num: 5,
    title: 'Chapter 4',
    when: 'Chapter 4',
    brief: 'VCIA Takedown and Operation Savage Glory.',
    detail:
      'Two mission trophies, both unmissable. The airport these are set around is also where Catch Me If You Can happens, so note the location for later. This is the last comfortable point to catch up on activity counts before the final mission, because the post-story checklist is the longest stretch of the platinum.',
  },
  {
    num: 6,
    title: 'The final mission',
    when: 'Final mission',
    brief: 'One gold for finishing the story, then free roam opens properly.',
    detail:
      'Finish the story with no cheat active, since a cheat turns off trophies and saving until you reload. Watch the credits through, then take a fresh manual save in free roam. From here every remaining activity, robbery, collectible and challenge is on the map at once, which is what makes the rest of the list possible.',
  },
  {
    num: 7,
    title: 'Character strands',
    when: 'Story, before it ends',
    brief: 'Andy, Kenton, Billy, Randy, Tyrone and Bret, plus the other stranger strands.',
    detail:
      'These are the quest lines GTA Base names: Andy, Kenton, Billy, Randy, Tyrone and Bret. Run each one while it is being offered rather than banking it for free roam. Six of them also count as six of the eight strands Strangers & Freaks needs, which leaves two more to find. Bret’s Target Decks feed 100% as well.',
  },
  {
    num: 8,
    title: 'Activities and collectibles',
    when: 'Free roam, after the credits',
    brief: 'The long counts: stunts, ranges, drone races, cards, WAiNK, robberies.',
    detail:
      'This is the bulk of the work. Work one count at a time rather than roaming for whatever you spot first, keep written totals for the ones the game does not show cleanly, and save between robberies so a failed escape costs one attempt rather than a session. Several of these counts overlap with the 100% checklist, so nothing here is wasted.',
  },
  {
    num: 9,
    title: '100% and the platinum',
    when: 'Free roam, last',
    brief: 'A Long Road, the exploration counts, then the platinum.',
    detail:
      'Work the 100% Completion list category by category: every robbery, bank vault and gang operation, the underwater discoveries, shooting ranges, drone races, Bret’s Target Decks and 70 of the 80 challenges, plus 200 WAiNK scans and 100 animals studied. A Long Road unlocks at 100%, and the platinum follows once the other 54 are on the profile.',
  },
];

export const STAGE_BY_NUM = new Map(STAGES.map((stage) => [stage.num, stage]));

const COUNT_WORDS = { 100: 'completion', 250: 'stunts' };

// A short, honest label for a tracked count, used in the badge row.
export function countLabel(trophy) {
  if (!trophy.count) return '';
  if (trophy.count === 100) return '100% target';
  if (trophy.id === 52) return '$250,000';
  if (trophy.id === 53) return '$100,000';
  if (trophy.id === 48) return '500 tracked';
  return COUNT_WORDS[trophy.count] ? `${trophy.count} ${COUNT_WORDS[trophy.count]}` : `${trophy.count} to reach`;
}

export function gradeRank(grade) {
  const index = GRADES.indexOf(grade);
  return index === -1 ? GRADES.length : index;
}

export function searchable(trophy) {
  return `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.chapter}`.toLowerCase();
}

// The whole guide in one call. The app fetches this once and never again.
export async function loadGuide(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`could not read ${url} (${response.status})`);
  const payload = await response.json();
  const trophies = Array.isArray(payload) ? payload : payload.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) throw new Error('the guide file holds no trophies');
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  const stages = STAGES.map((stage) => ({
    ...stage,
    trophies: trophies.filter((trophy) => trophy.roadmapStage === stage.num),
  }));
  return { trophies, byId, stages, meta: { game: payload.game, platform: payload.platform } };
}

// 200 hours is the figure both GTA Base and KeenGamer give for the platinum; the
// estimate here is that figure scaled by what is left, which is rough but honest.
export function estimateHoursLeft(earnedCount, total) {
  const remaining = Math.max(0, total - earnedCount);
  return Math.round((remaining / total) * 200);
}
