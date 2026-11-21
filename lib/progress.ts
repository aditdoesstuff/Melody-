import type { State } from "./store";

export interface Step { key: string; label: string; href: string; done: boolean; hint: string }

/** The path every couple walks: Dump -> Themes -> Priorities -> Identity -> Budget -> Invite. */
export function steps(s: Pick<State, "cards" | "themes" | "ranked" | "guide" | "budgetTouched" | "invites">): Step[] {
  const real = s.cards.filter((c) => !c.sample).length;
  return [
    { key: "dump", label: "Dump", href: "/space", done: real >= 12, hint: real >= 12 ? `${real} cards saved` : `${real} of 12 cards to unlock themes` },
    { key: "themes", label: "Themes", href: "/diagnostic", done: s.themes.length > 0, hint: "Find what your cards have in common" },
    { key: "priorities", label: "Priorities", href: "/priorities", done: s.ranked.A || s.ranked.B, hint: "Rank what matters before money moves" },
    { key: "identity", label: "Identity", href: "/identity", done: !!s.guide, hint: "Keep, drop, then get your guide" },
    { key: "budget", label: "Budget", href: "/budget", done: s.budgetTouched, hint: "See the split your ranking suggests" },
    { key: "invite", label: "Invite", href: "/invites", done: s.invites.some((i) => Object.keys(i.status).length > 0), hint: "Send the cards, group by group" },
  ];
}
export const nextStep = (list: Step[]): Step | null => list.find((x) => !x.done) ?? null;
