import type { Item } from "./types";
import { colourName } from "./palette";

export interface MergeResult {
  score: number; // 0-100 shared identity
  shared: string[];
  onlyMe: string[];
  onlyPartner: string[];
  sharedColours: string[];
  headline: string;
}

const vocab = (items: Item[]) => {
  const m = new Map<string, number>();
  items.forEach((i) => {
    i.tags.forEach((t) => t !== "inspiration" && m.set(t, (m.get(t) ?? 0) + 1));
    i.palette.slice(0, 2).forEach((p) => m.set(colourName(p), (m.get(colourName(p)) ?? 0) + 1));
  });
  return m;
};

// Weighted Jaccard overlap between the two partners' tag + colour vocabularies.
export function mergeDiagnostic(items: Item[]): MergeResult {
  const A = vocab(items.filter((i) => i.owner === "me" && i.status !== "declined"));
  const B = vocab(items.filter((i) => i.owner === "partner" && i.status !== "declined"));
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
  const sorted = shared.sort((x, y) => y[1] - x[1]).map(([k]) => k);
  const colours = new Set(["ivory","black","cream","charcoal","blush","red","peach","terracotta","butter","marigold","sage","green","teal","sky","navy","lavender","rose"]);
  const sharedTags = sorted.filter((k) => !colours.has(k));
  const sharedColours = sorted.filter((k) => colours.has(k));
  const top = (m: Map<string, number>) => [...m.entries()].filter(([k]) => !B.has(k) || !A.has(k)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const onlyMe = top(A).filter((k) => !B.has(k)).slice(0, 4);
  const onlyPartner = top(B).filter((k) => !A.has(k)).slice(0, 4);
  const headline =
    score >= 60 ? "You're closer than you think." : score >= 35 ? "A shared core, with room for both of you." : "Different instincts — and a few places to meet.";
  return { score, shared: sharedTags.slice(0, 6), onlyMe, onlyPartner, sharedColours: sharedColours.slice(0, 4), headline };
}

// Where family picks diverge from what the couple actually kept.
export function familyConflicts(items: Item[]) {
  const couple = items.filter((i) => i.owner !== "family" && i.status === "kept");
  const fam = items.filter((i) => i.owner === "family");
  const coupleTags = new Set(couple.flatMap((i) => i.tags));
  const aligned = fam.filter((i) => i.tags.some((t) => coupleTags.has(t) && t !== "inspiration"));
  const diverging = fam.filter((i) => !aligned.includes(i));
  return { aligned, diverging };
}
