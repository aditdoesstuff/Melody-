import type { Card, Theme } from "./types";
import { cap } from "./format";

export interface MergeResult {
  score: number; // 0-100 shared taste
  shared: string[];
  onlyA: string[];
  onlyB: string[];
  sharedColours: string[];
  headline: string;
  compromise: { name: string; line: string } | null;
}

const vocab = (cards: Card[]) => {
  const m = new Map<string, number>();
  const add = (k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  cards.forEach((c) => { c.tags.themes.forEach((t) => add("t:" + t)); c.tags.mood.forEach((t) => add("t:" + t)); c.tags.colors.slice(0, 2).forEach((s) => add("c:" + s.name)); });
  return m;
};

/** Weighted Jaccard overlap between the two partners' tag and colour vocabularies. */
export function mergeDiagnostic(cards: Card[]): MergeResult {
  const live = cards.filter((c) => c.identityVote !== "no" && c.tagStatus === "done");
  const A = vocab(live.filter((c) => c.addedBy === "A"));
  const B = vocab(live.filter((c) => c.addedBy === "B"));
  const keys = new Set([...A.keys(), ...B.keys()]);
  let inter = 0, union = 0;
  const shared: [string, number][] = [];
  keys.forEach((k) => {
    const a = A.get(k) ?? 0, b = B.get(k) ?? 0;
    inter += Math.min(a, b);
    union += Math.max(a, b);
    if (a && b) shared.push([k, Math.min(a, b)]);
  });
  const score = union ? Math.round((inter / union) * 100) : 0;
  const sorted = shared.sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).map(([k]) => k);
  const only = (m: Map<string, number>, other: Map<string, number>) =>
    [...m.entries()].filter(([k]) => k.startsWith("t:") && !other.has(k)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k.slice(2)).slice(0, 4);
  const sharedTags = sorted.filter((k) => k.startsWith("t:")).map((k) => k.slice(2)).slice(0, 6);
  const onlyA = only(A, B), onlyB = only(B, A);
  const headline = !A.size || !B.size ? "One of you has not added anything yet." : score >= 60 ? "You two are closer than you think." : score >= 35 ? "A shared core, with room for both of you." : "Different instincts, and a few places to meet.";
  const compromise = onlyA.length && onlyB.length
    ? { name: `${cap(onlyA[0])} meets ${onlyB[0]}`, line: `${sharedTags[0] ? `Keep ${sharedTags[0]} as the base. ` : ""}Then give each of you one thing that is fully yours: ${onlyA[0]} for one, ${onlyB[0]} for the other.` }
    : null;
  return { score, shared: sharedTags, onlyA, onlyB, sharedColours: sorted.filter((k) => k.startsWith("c:")).map((k) => k.slice(2)).slice(0, 4), headline, compromise };
}

/** How much of a theme came from each of you. */
export function themeSplit(theme: Theme, cards: Card[]) {
  const mine = cards.filter((c) => theme.cardIds.includes(c.id));
  const a = mine.filter((c) => c.addedBy === "A").length, b = mine.filter((c) => c.addedBy === "B").length, family = mine.filter((c) => c.addedBy === "family").length;
  const couple = a + b;
  const kind: "both" | "A" | "B" | "family" = family > couple ? "family" : a / couple >= 0.25 && b / couple >= 0.25 ? "both" : a > b ? "A" : "B";
  return { a, b, family, kind };
}

/** Where family picks line up with what the couple saved, and where they do not. */
export function familyConflicts(cards: Card[]) {
  const couple = cards.filter((c) => c.addedBy !== "family" && c.identityVote !== "no");
  const fam = cards.filter((c) => c.addedBy === "family");
  const coupleTags = new Set(couple.flatMap((c) => c.tags.themes));
  // Aligned = most of what the idea is about already shows up in what the couple saved.
  const aligned = fam.filter((c) => c.tags.themes.length > 0 && c.tags.themes.filter((t) => coupleTags.has(t)).length / c.tags.themes.length > 0.5);
  return { aligned, diverging: fam.filter((c) => !aligned.includes(c)) };
}
