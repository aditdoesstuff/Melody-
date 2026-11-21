import type { Card, Theme } from "./types";
import { flatTags } from "./tagging";

type Vec = Map<string, number>;

/** Tag vector for one card. Themes carry the most weight, then mood, colour and category. */
export function vectorOf(card: Card): Vec {
  const v: Vec = new Map();
  const t = card.tags;
  t.themes.forEach((x) => v.set("t:" + x, 3));
  t.mood.forEach((x) => v.set("m:" + x, 1.5));
  t.colors.slice(0, 3).forEach((c) => v.set("c:" + c.name, 1));
  if (t.category !== "other") v.set("k:" + t.category, 0.6);
  return v;
}
const norm = (v: Vec) => Math.sqrt([...v.values()].reduce((a, x) => a + x * x, 0));
export function cosine(a: Vec, b: Vec): number {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  let dot = 0;
  a.forEach((x, k) => { const y = b.get(k); if (y) dot += x * y; });
  return dot / (na * nb);
}
function mean(vs: Vec[]): Vec {
  const m: Vec = new Map();
  vs.forEach((v) => v.forEach((x, k) => m.set(k, (m.get(k) ?? 0) + x / vs.length)));
  return m;
}

const ADJ: Record<string, string> = {
  warm: "Golden-hour", romantic: "Blush-toned", quiet: "Quiet", fresh: "Fresh-cut", moody: "After-dark", joyful: "Full-colour",
  earthy: "Sun-baked", grand: "Grand", playful: "Playful", elegant: "Polished", unfussy: "Easy-going",
};
const NOUN: Record<string, [string, string]> = {
  garden: ["garden", "Open sky, real flowers, nothing too arranged."],
  minimal: ["simplicity", "Fewer things, chosen well. Space to breathe."],
  boho: ["boho", "Dried grasses, clay tones, a little undone on purpose."],
  rustic: ["farmhouse", "Wood, string lights and room to wander."],
  traditional: ["heritage", "The rituals and colours you grew up with, kept on your terms."],
  candlelit: ["candlelight", "Low light, long tables, voices over volume."],
  beach: ["shoreline", "Salt air, bare feet, the horizon doing the decor."],
  vintage: ["nostalgia", "Film grain and old songs. Looks like a memory already."],
  modern: ["modern", "Clean lines, strong shapes, nothing fussy."],
  maximal: ["spectacle", "Big, bright and loud about it."],
  intimate: ["gathering", "Only the people who would notice if they were not there."],
  brunch: ["brunch", "Daylight, good coffee, home by evening."],
  destination: ["getaway", "Everyone you love, somewhere that is not home."],
  royal: ["palace", "Arches, velvet and a bit of old-world drama."],
  pastel: ["pastels", "Soft colour, light fabric, easy on the eye."],
  courtyard: ["courtyard", "Feels like home, scaled up just enough."],
  whimsical: ["whimsy", "A sense of humour, on purpose."],
};
const FALLBACK_ADJ = ["Quiet", "Golden-hour", "Easy-going", "Polished", "Playful", "Fresh-cut"];

function topCounts(list: string[]): [string, number][] {
  const m = new Map<string, number>();
  list.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function describe(cards: Card[], total: number, used: Set<string>): Omit<Theme, "locked"> {
  const themes = topCounts(cards.flatMap((c) => c.tags.themes)).map(([t]) => t);
  const moods = topCounts(cards.flatMap((c) => c.tags.mood)).map(([m]) => m);
  let name = "", desc = "", key = "";
  outer: for (const t of themes.length ? themes : ["mix"]) {
    const [noun, d] = NOUN[t] ?? ["mix", "A little of everything you saved."];
    for (const adj of [...moods.map((m) => ADJ[m]).filter(Boolean), ...FALLBACK_ADJ]) {
      const candidate = `${adj} ${noun}`;
      if (!used.has(candidate)) { name = candidate; desc = d; key = t; break outer; }
    }
  }
  if (!name) { name = `Theme ${used.size + 1}`; desc = "A little of everything you saved."; key = "mix" + used.size; }
  used.add(name);
  const palette = topCounts(cards.flatMap((c) => c.tags.colors.slice(0, 2).map((s) => s.hex))).slice(0, 5).map(([h]) => h);
  const topTags = topCounts(cards.flatMap((c) => flatTags(c.tags).filter((x) => !c.tags.colors.some((s) => s.name === x)))).slice(0, 5).map(([t]) => t);
  return { id: "th-" + key, name, description: desc, cardIds: cards.map((c) => c.id), palette, topTags, pct: total ? Math.round((cards.length / total) * 100) : 0 };
}

/** Pick seed theme-tags: frequent, and not just a relabelling of a seed we already have. */
function pickSeeds(cards: Card[], max: number): string[] {
  const freq = topCounts(cards.flatMap((c) => c.tags.themes)).filter(([, n]) => n >= 2);
  const sets = new Map(freq.map(([t]) => [t, new Set(cards.filter((c) => c.tags.themes.includes(t)).map((c) => c.id))]));
  const seeds: string[] = [];
  for (const [t] of freq) {
    const s = sets.get(t)!;
    const dup = seeds.some((o) => { const so = sets.get(o)!; const inter = [...s].filter((x) => so.has(x)).length; return inter / (s.size + so.size - inter) > 0.6; });
    if (!dup) seeds.push(t);
    if (seeds.length >= max) break;
  }
  return seeds;
}

function kmeans(cards: Card[], vecs: Vec[], seeds: string[]): { groups: number[][]; score: number } {
  let centroids = seeds.map((t) => mean(vecs.filter((_, i) => cards[i].tags.themes.includes(t))));
  let assign: number[] = [];
  for (let iter = 0; iter < 8; iter++) {
    const next = vecs.map((v) => { let best = 0, bs = -1; centroids.forEach((c, k) => { const s = cosine(v, c); if (s > bs + 1e-9) { bs = s; best = k; } }); return best; });
    if (iter && next.every((x, i) => x === assign[i])) break;
    assign = next;
    centroids = centroids.map((c, k) => { const mine = vecs.filter((_, i) => assign[i] === k); return mine.length ? mean(mine) : c; });
  }
  const groups = centroids.map((_, k) => assign.map((a, i) => (a === k ? i : -1)).filter((i) => i >= 0));
  const fit = vecs.reduce((a, v, i) => a + cosine(v, centroids[assign[i]]), 0) / (vecs.length || 1);
  const small = groups.filter((g) => g.length < 3).length;
  return { groups, score: fit - 0.15 * small - 0.02 * seeds.length };
}

/**
 * Turn a pile of tagged cards into 3 to 5 themes. Deterministic: same cards in, same themes out.
 * Locked themes keep their cards and name; everything else is re-clustered around them.
 */
export function clusterCards(all: Card[], locked: Theme[] = []): Theme[] {
  const cards = all.filter((c) => c.tagStatus === "done");
  const ids = new Set(cards.map((c) => c.id));
  const keep = locked.map((t) => ({ ...t, cardIds: t.cardIds.filter((id) => ids.has(id)) })).filter((t) => t.cardIds.length);
  const taken = new Set(keep.flatMap((t) => t.cardIds));
  const free = cards.filter((c) => !taken.has(c.id) && vectorOf(c).size > 0);
  const used = new Set(keep.map((t) => t.name));
  const room = Math.max(5 - keep.length, 0);
  const out: Theme[] = keep.map((t) => ({ ...t, pct: Math.round((t.cardIds.length / cards.length) * 100) }));
  if (!free.length || !room) return out;

  const vecs = free.map(vectorOf);
  const seeds = pickSeeds(free, room);
  if (seeds.length < 2) { out.push(describe(free, cards.length, used)); return dedupeIds(out); }
  const minK = Math.min(Math.max(3 - keep.length, 2), seeds.length);
  let best: { groups: number[][]; score: number } | null = null;
  for (let k = minK; k <= seeds.length; k++) {
    const r = kmeans(free, vecs, seeds.slice(0, k));
    if (!best || r.score > best.score + 1e-9) best = r;
  }
  best!.groups.filter((g) => g.length).sort((a, b) => b.length - a.length).forEach((g) => out.push(describe(g.map((i) => free[i]), cards.length, used)));
  return dedupeIds(out);
}
function dedupeIds(themes: Theme[]): Theme[] {
  const seen = new Set<string>();
  return themes.map((t) => { let id = t.id, n = 2; while (seen.has(id)) id = `${t.id}-${n++}`; seen.add(id); return { ...t, id }; });
}

/** Most-used colours across a set of cards. */
export function topPalette(cards: Card[], n = 6): string[] {
  return topCounts(cards.flatMap((c) => c.tags.colors.slice(0, 3).map((s) => s.hex))).slice(0, n).map(([h]) => h);
}
