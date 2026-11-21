import MiniSearch from "minisearch";
import type { Card } from "./types";
import { COLOUR_FAMILY } from "./dictionary";

const STOP = new Set(["a", "an", "the", "and", "or", "of", "in", "on", "for", "to", "with", "from", "our", "my", "things", "thing", "stuff", "ideas", "idea", "some", "all", "show", "me", "that", "we", "saved", "like"]);
/** Plain-language synonyms so "evening" finds candle-lit cards and "playlist" finds Spotify links. */
const SYN: Record<string, string[]> = {
  evening: ["candlelit", "dusk", "night", "moody"], night: ["candlelit", "moody"], outdoor: ["garden", "lawn", "beach", "courtyard"], outside: ["garden", "beach"],
  green: ["sage", "garden"], pink: ["blush", "rose"], yellow: ["butter", "marigold"], blue: ["sky", "navy", "teal"], purple: ["lavender"], orange: ["terracotta", "peach", "marigold"],
  white: ["ivory", "cream"], gold: ["marigold", "royal"], dark: ["moody", "charcoal", "navy"],
  playlist: ["music", "spotify"], songs: ["music", "playlist"], song: ["music", "playlist"], clothes: ["outfit"], attire: ["outfit"], dress: ["outfit", "gown"],
  flowers: ["floral", "florals", "garden"], lights: ["candlelit", "fairy"], small: ["intimate"], cosy: ["intimate", "warm"], cozy: ["intimate", "warm"],
  simple: ["minimal"], classic: ["traditional", "elegant"], desi: ["traditional"], fancy: ["grand", "royal", "maximal"], insta: ["instagram"], pins: ["pinterest"], pin: ["pinterest"],
  notes: ["text", "note"], note: ["text"], links: ["link"], photos: ["image", "photography"], pictures: ["image"], colours: ["color"], colors: ["color"], swatches: ["color"],
  invite: ["stationery", "invitation"], invites: ["stationery", "invitation"], makeup: ["beauty"], food: ["catering", "menu"],
};

interface Doc { id: string; title: string; body: string; tags: string; colours: string; meta: string }

export function toDoc(c: Card, who?: Record<string, string>): Doc {
  const names = c.tags.colors.map((s) => s.name);
  const families = Object.entries(COLOUR_FAMILY).filter(([, list]) => names.some((n) => list.includes(n))).map(([f]) => f);
  let domain = "";
  if (c.url) { try { domain = new URL(c.url).hostname.replace(/^www\./, ""); } catch { /* not a url */ } }
  return {
    id: c.id,
    title: [c.title, c.fileName].filter(Boolean).join(" "),
    body: [c.text, c.note].filter(Boolean).join(" "),
    tags: [...c.tags.themes, ...c.tags.mood, ...c.tags.objects, c.tags.category].join(" "),
    colours: [...names, ...families, c.hex ?? ""].join(" "),
    meta: [c.type, c.source ?? c.tags.source ?? "", domain, who?.[c.addedBy] ?? ""].join(" "),
  };
}

export interface Index { search(q: string): string[]; size: number }

/** Build once per card list; each search is a handful of map lookups (well under 100ms for thousands of cards). */
export function buildIndex(cards: Card[], who?: Record<string, string>): Index {
  const mini = new MiniSearch<Doc>({ fields: ["title", "body", "tags", "colours", "meta"], storeFields: ["id"] });
  mini.addAll(cards.map((c) => toDoc(c, who)));
  const order = new Map(cards.map((c, i) => [c.id, i]));
  return {
    size: cards.length,
    search(q: string): string[] {
      const terms = q.toLowerCase().replace(/[^\p{L}\p{N}#\s-]/gu, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
      if (!terms.length) return cards.map((c) => c.id);
      const hits = new Map<string, { groups: number; score: number }>();
      for (const term of terms) {
        const seen = new Map<string, number>();
        const run = (word: string, weight: number) =>
          mini.search(word, { prefix: word.length > 2, fuzzy: word.length > 4 ? 0.2 : false, boost: { tags: 2.5, title: 2, colours: 1.5 } })
            .forEach((r) => seen.set(r.id as string, Math.max(seen.get(r.id as string) ?? 0, r.score * weight)));
        run(term, 1);
        (SYN[term] ?? []).forEach((s) => run(s, 0.6));
        seen.forEach((score, id) => { const h = hits.get(id) ?? { groups: 0, score: 0 }; h.groups++; h.score += score; hits.set(id, h); });
      }
      const need = Math.max(1, Math.ceil(terms.length / 2));
      return [...hits.entries()].filter(([, h]) => h.groups >= need)
        .sort((a, b) => b[1].groups - a[1].groups || b[1].score - a[1].score || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0)).map(([id]) => id);
    },
  };
}
