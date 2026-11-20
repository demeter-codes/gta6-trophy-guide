// roadmap.js — the ordered plan to the platinum. Nine stages, each saying when it
// happens, what to do, which trophies it clears, and which of those can be lost.

import { el } from './ui.js';
import { GRADE_LABEL } from './data.js';

function trophyChip(ctx, trophy) {
  const earned = ctx.state.isEarned(trophy.id);
  const concealed = Boolean(ctx.state.spoilers) && Boolean(trophy.hidden) && !earned;
  return el('button', {
    type: 'button',
    class: `stage-trophy${earned ? ' is-earned' : ''}`,
    title: concealed ? 'Hidden until earned' : trophy.description,
    text: concealed ? `Hidden ${GRADE_LABEL[trophy.grade]} trophy` : trophy.name,
    onclick: () => ctx.actions.select(trophy.id, { switchToChecklist: true }),
  });
}

function nextUpCard(ctx) {
  const ordered = ctx.guide.stages
    .slice()
    .sort((a, b) => a.num - b.num)
    .flatMap((stage) => stage.trophies.slice().sort((a, b) => a.id - b.id));
  const next = ordered.find((trophy) => !ctx.state.isEarned(trophy.id));

  if (!next) {
    return el('div', { class: 'nextup', id: 'next-up' }, [
      el('span', { class: 'labelcaps', text: 'Next up' }),
      el('h2', { text: 'Nothing left. Leonida Legend.' }),
      el('p', { text: 'All 55 trophies are ticked, which leaves only the platinum itself on your profile.' }),
    ]);
  }

  const stage = ctx.guide.stages.find((s) => s.num === next.roadmapStage);
  const concealed = Boolean(ctx.state.spoilers) && Boolean(next.hidden);
  const earnedCount = ctx.guide.trophies.filter((t) => ctx.state.isEarned(t.id)).length;

  return el('div', { class: 'nextup', id: 'next-up' }, [
    el('span', { class: 'labelcaps', text: 'Next up' }),
    el('h2', { text: concealed ? 'A hidden trophy' : next.name }),
    el('p', { text: concealed ? 'Its guide stays hidden while the spoiler switch is on.' : next.description }),
    el('p', { text: stage ? `Stage ${stage.num} · ${stage.title}` : '' }),
    el('div', { class: 'nextup-meta' }, [
      el('div', { text: `${earnedCount} of ${ctx.guide.trophies.length} earned` }),
      el('div', { text: next.missable ? 'Missable — read the note before you pass it' : 'Not missable' }),
    ]),
    el('div', { class: 'detail-actions', style: 'padding:10px 0 0;border:0;background:none' }, [
      el('button', {
        type: 'button',
        class: 'btn btn-primary',
        text: 'Open the guide',
        onclick: () => ctx.actions.select(next.id, { switchToChecklist: true }),
      }),
    ]),
  ]);
}

export function renderRoadmap(ctx) {
  const root = ctx.dom.roadmap;
  root.replaceChildren();

  const plan = el('div', { class: 'roadmap-plan' });

  for (const stage of ctx.guide.stages) {
    const trophies = stage.trophies.slice().sort((a, b) => a.id - b.id);
    const done = trophies.filter((trophy) => ctx.state.isEarned(trophy.id)).length;
    const missables = trophies.filter((trophy) => trophy.missable);

    const block = el('div', { class: `stage${done === trophies.length && trophies.length > 0 ? ' is-cleared' : ''}` }, [
      el('div', { class: 'stage-num', text: String(stage.num).padStart(2, '0') }),
      el('div', {}, [
        el('h2', { text: stage.title }),
        el('p', { class: 'stage-when', text: `${stage.when} · ${done}/${trophies.length} earned` }),
        el('p', { class: 'stage-do', text: stage.detail }),
        trophies.length > 0
          ? el('div', { class: 'stage-trophies' }, trophies.map((trophy) => trophyChip(ctx, trophy)))
          : null,
        missables.length > 0
          ? el('div', { class: 'stage-missable' }, [
              el('b', { text: 'Missable at this stage' }),
              missables.map((trophy) => trophy.missableNote || `${trophy.name} can be lost here.`).join(' '),
            ])
          : null,
      ]),
    ]);

    plan.append(block);
  }

  root.append(plan, nextUpCard(ctx));
}
