import type { CategoryId, Tier } from "./types";

export interface MergeRow { id: CategoryId; a: number; b: number; gap: number; avg: number }

/** Meet in the middle: average each category's rank across partners. Ties go to partner A's order. */
export function mergeRankings(a: CategoryId[], b: CategoryId[]): { order: CategoryId[]; rows: MergeRow[] } {
  const ids = [...a, ...b.filter((id) => !a.includes(id))];
  const pos = (list: CategoryId[], id: CategoryId) => (list.indexOf(id) === -1 ? list.length : list.indexOf(id)) + 1;
  const rows = ids.map((id) => {
    const ra = pos(a, id), rb = pos(b, id);
    return { id, a: ra, b: rb, gap: Math.abs(ra - rb), avg: (ra + rb) / 2 };
  });
  const order = [...rows].sort((x, y) => x.avg - y.avg || x.a - y.a).map((r) => r.id);
  return { order, rows };
}

/** A gap of 4+ places is worth a conversation. */
export const isDisagreement = (r: MergeRow) => r.gap >= 4;

export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

/** Combined tiers: "skip" only if you both skip it; "nice" if either of you is lukewarm. */
export function mergeTiers(a: Record<CategoryId, Tier>, b: Record<CategoryId, Tier>, ids: CategoryId[]): Record<CategoryId, Tier> {
  const out: Record<CategoryId, Tier> = {};
  for (const id of ids) {
    const x = a[id] ?? "must", y = b[id] ?? "must";
    out[id] = x === "skip" && y === "skip" ? "skip" : x === "must" && y === "must" ? "must" : "nice";
  }
  return out;
}
