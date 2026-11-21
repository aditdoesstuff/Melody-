import type { Category, Source, Tags } from "./types";
import { CATEGORY_WORDS, COLOUR_MOOD, COLOUR_THEME, MOOD_WORDS, THEME_WORDS } from "./dictionary";
import { swatch } from "./palette";

const has = (hay: string, word: string) => new RegExp(`(^|[^a-z])${word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`).test(hay);
const clean = (text: string) => text.toLowerCase().replace(/[_\-+.,/]+/g, " ").replace(/\s+/g, " ");

export function sourceFromUrl(url: string): Source {
  const u = url.toLowerCase();
  if (/instagram\.com|instagr\.am/.test(u)) return "instagram";
  if (/pinterest\.|pin\.it/.test(u)) return "pinterest";
  if (/spotify\.com|spoti\.fi/.test(u)) return "spotify";
  if (/whatsapp\.com|wa\.me/.test(u)) return "whatsapp";
  return "web";
}

/**
 * Deterministic, believable tags from whatever words and colours we have.
 * This is the heuristic behind MockTaggingService; a vision model would replace it behind the same interface.
 */
export function tagFrom(text: string, hexes: string[] = [], source?: Source): Tags {
  const hay = clean(text);
  const colors = hexes.slice(0, 5).map(swatch);
  const themes: string[] = [];
  const mood: string[] = [];
  const objects: string[] = [];

  for (const [t, words] of Object.entries(THEME_WORDS)) if (words.some((w) => has(hay, w))) themes.push(t);
  for (const [m, words] of Object.entries(MOOD_WORDS)) if (words.some((w) => has(hay, w))) mood.push(m);

  const score: Partial<Record<Category, number>> = {};
  for (const [cat, words] of Object.entries(CATEGORY_WORDS) as [Category, string[]][]) {
    for (const w of words) if (has(hay, w)) { score[cat] = (score[cat] ?? 0) + 1; if (!objects.includes(w)) objects.push(w); }
  }
  let category = (Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] as Category | undefined) ?? "other";
  if (source === "spotify") { category = "music"; if (!objects.includes("playlist")) objects.unshift("playlist"); }

  // Colour fills the gaps when the words say little.
  for (const c of colors.slice(0, 2)) {
    const m = COLOUR_MOOD[c.name];
    if (m && mood.length < 2 && !mood.includes(m)) mood.push(m);
    const t = COLOUR_THEME[c.name];
    if (t && themes.length < 2 && !themes.includes(t)) themes.push(t);
  }
  return { themes: themes.slice(0, 4), mood: mood.slice(0, 3), colors, category, objects: objects.slice(0, 5), source };
}

export const EMPTY_TAGS: Tags = { themes: [], mood: [], colors: [], category: "other", objects: [] };
/** Every searchable word on a tag set, flattened. */
export const flatTags = (t: Tags): string[] => [...t.themes, ...t.mood, ...t.objects, ...t.colors.map((c) => c.name), ...(t.category !== "other" ? [t.category] : [])];
export const isUntagged = (t: Tags) => t.themes.length + t.mood.length + t.objects.length === 0 && t.category === "other";
