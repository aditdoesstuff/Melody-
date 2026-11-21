import type { CategoryId, Tier } from "./types";

/** Split `total` units across weights so the parts are integers that sum to exactly `total` (largest remainder). */
export function largestRemainder(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (w / sum) * total);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => ({ i, r: e - Math.floor(e) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k].i]++;
  return out;
}

/** Rank -> integer percentages summing to 100. Earlier = bigger. "nice" is damped, "skip" gets nothing. */
export function rankToWeights(order: CategoryId[], tiers: Record<CategoryId, Tier> = {}): Record<CategoryId, number> {
  const n = order.length;
  const raw = order.map((id, i) => {
    const t = tiers[id] ?? "must";
    if (t === "skip") return 0;
    return Math.pow(n - i, 1.35) * (t === "nice" ? 0.6 : 1);
  });
  const pct = raw.some((r) => r > 0) ? largestRemainder(raw, 100) : order.map(() => 0);
  return Object.fromEntries(order.map((id, i) => [id, pct[i]]));
}

/** Set one category's percentage; locked categories keep theirs; the rest absorb the difference proportionally. Always sums to 100. */
export function setWeight(weights: Record<CategoryId, number>, id: CategoryId, value: number, locked: CategoryId[] = []): Record<CategoryId, number> {
  if (locked.includes(id)) return weights;
  const ids = Object.keys(weights);
  const lockedSum = ids.filter((k) => locked.includes(k)).reduce((a, k) => a + weights[k], 0);
  const free = ids.filter((k) => k !== id && !locked.includes(k));
  const max = free.length ? 100 - lockedSum : weights[id];
  const v = Math.max(0, Math.min(Math.round(value), max));
  const rest = 100 - lockedSum - v;
  const base = free.map((k) => weights[k]);
  const parts = largestRemainder(base.some((b) => b > 0) ? base : free.map(() => 1), rest);
  const out = { ...weights, [id]: v };
  free.forEach((k, i) => (out[k] = parts[i]));
  return out;
}

/** Rounding step so amounts look clean at any budget size. */
export function stepFor(total: number): number {
  if (total >= 1_000_000) return 1000;
  if (total >= 100_000) return 500;
  if (total >= 10_000) return 100;
  if (total >= 1_000) return 10;
  return 1;
}

export interface Allocation { rows: { id: CategoryId; amount: number; pct: number; weight: number }[]; contingency: number; spendable: number; step: number }

/** Contingency comes off the top; the rest is split by weight. rows + contingency === total, always. */
export function allocate(total: number, weights: Record<CategoryId, number>, contingencyPct: number, order?: CategoryId[]): Allocation {
  const ids = order ? order.filter((id) => id in weights) : Object.keys(weights);
  const step = stepFor(total);
  const cp = Math.max(0, Math.min(contingencyPct, 50));
  const hasWeights = ids.some((id) => weights[id] > 0);
  let contingency = hasWeights ? Math.round((total * cp) / 100 / step) * step : total;
  const spendable = total - contingency;
  const units = Math.floor(spendable / step);
  const parts = largestRemainder(ids.map((id) => weights[id]), units);
  contingency += spendable - units * step; // loose change joins the buffer
  const rows = ids.map((id, i) => ({ id, amount: parts[i] * step, pct: total ? (parts[i] * step * 100) / total : 0, weight: weights[id] }));
  return { rows, contingency, spendable: total - contingency, step };
}

/** Two or three short, rule-based observations. `rank` is 1-based position in the couple's ranking. */
export function insights(a: Allocation, total: number, rankOf: (id: CategoryId) => number, nameOf: (id: CategoryId) => string, guests?: number): string[] {
  const out: string[] = [];
  const pct = (id: string) => a.rows.find((r) => r.id === id)?.pct ?? 0;
  const vc = pct("venue") + pct("catering");
  if (vc >= 50) out.push(`Venue + catering take ${Math.round(vc)}%. That is normal for a guest-heavy wedding, and the first place to look if the total feels tight.`);
  else if (vc > 0 && vc < 30) out.push(`Venue + catering are only ${Math.round(vc)}%. Lovely if it is a small gathering, optimistic if it is not.`);
  const top = a.rows.filter((r) => rankOf(r.id) <= 3 && r.pct < 8 && r.weight > 0).sort((x, y) => rankOf(x.id) - rankOf(y.id))[0];
  if (top) out.push(`You ranked ${nameOf(top.id)} #${rankOf(top.id)} but gave it ${Math.round(top.pct)}%. Want to nudge it up?`);
  const low = a.rows.filter((r) => rankOf(r.id) >= Math.max(a.rows.length - 2, 4) && r.pct >= 15).sort((x, y) => y.pct - x.pct)[0];
  if (low) out.push(`${nameOf(low.id)} sits near the bottom of your ranking but has ${Math.round(low.pct)}% of the money.`);
  if (guests && guests > 0) {
    const food = a.rows.find((r) => r.id === "catering")?.amount ?? 0;
    if (food > 0) out.push(`Catering works out to about ${Math.round(food / guests).toLocaleString("en-IN")} per guest. Every 10 guests fewer frees up roughly ${Math.round((food / guests) * 10).toLocaleString("en-IN")}.`);
  }
  if (a.contingency === 0 && total > 0) out.push("No contingency set. Something always costs more than quoted, so 5 to 10% is a kind thing to do for future you.");
  if (!out.length) out.push("Nothing looks out of line. The split follows your ranking closely.");
  return out.slice(0, 3);
}
