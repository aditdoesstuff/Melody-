import type { Item, Theme } from "./types";

const GENERIC = new Set(["inspiration"]);

// Group kept items into 3-5 themes by their most-shared tags. No manual sorting.
export function buildThemes(items: Item[], max = 5): Theme[] {
  const kept = items.filter((i) => i.status === "kept");
  const freq = new Map<string, number>();
  kept.forEach((i) => i.tags.forEach((t) => !GENERIC.has(t) && freq.set(t, (freq.get(t) ?? 0) + 1)));
  const tops = [...freq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  const themes: Theme[] = [];
  const used = new Set<string>();
  for (const [tag] of tops) {
    if (themes.length >= max) break;
    const members = kept.filter((i) => i.tags.includes(tag) && !used.has(i.id));
    if (members.length < 2) continue;
    members.forEach((m) => used.add(m.id));
    const co = new Map<string, number>();
    members.forEach((m) => m.tags.forEach((t) => t !== tag && !GENERIC.has(t) && co.set(t, (co.get(t) ?? 0) + 1)));
    const extra = [...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
    const palette = [...new Set(members.flatMap((m) => m.palette))].slice(0, 5);
    themes.push({ id: tag, name: [tag, ...extra.slice(0, 1)].map(cap).join(" + "), tags: [tag, ...extra], palette, items: members });
  }
  return themes;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function topPalette(items: Item[], n = 6): string[] {
  const count = new Map<string, number>();
  items.filter((i) => i.status === "kept").forEach((i) => i.palette.forEach((c) => count.set(c, (count.get(c) ?? 0) + 1)));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([c]) => c);
}
