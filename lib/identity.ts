import type { Card, IdentityGuide, Swatch, Theme, Tone } from "./types";
import { colourName, prettyName } from "./palette";

const TONE_LINE: Record<string, string> = {
  warm: "Low light, close seating, nobody checking the time.",
  romantic: "Soft where it can be. Sentimental without the speech.",
  quiet: "Room to hear each other. Volume is a choice, not a default.",
  playful: "If it makes you two laugh, it stays.",
  grand: "A sense of occasion, in the places that deserve it.",
  earthy: "Natural materials, real textures, nothing shrink-wrapped.",
  fresh: "Daylight, greenery, air moving through.",
  moody: "Deep colour and shadow. Evening over afternoon.",
  joyful: "Colour and noise in the right moments.",
  elegant: "Considered, pressed, never stiff.",
  unfussy: "Easy to be at. No one needs instructions.",
};
const DO: Record<string, string> = {
  garden: "Real flowers and open sky over built sets", minimal: "Fewer elements, each one chosen on purpose", candlelit: "Candles and warm bulbs; lights low after sunset",
  intimate: "A guest list short enough to greet everyone", traditional: "Keep the rituals that mean something to you two", vintage: "Film-style photos and songs older than you are",
  boho: "Clay, linen and dried grasses over anything shiny", rustic: "Wood, string lights, room to wander", brunch: "Daytime hours and food worth sitting down for",
  courtyard: "Somewhere that feels like home, scaled up", pastel: "Soft colour, light fabric, easy on the eye", whimsical: "One or two jokes only your people will get",
  beach: "Bare feet and the horizon as backdrop", modern: "Clean lines and strong shapes", destination: "A place worth the journey for everyone", royal: "Old-world arches and a little drama",
  maximal: "Go big where it counts", warm: "Golden-hour timings wherever possible", quiet: "Music low enough to talk over at dinner", unfussy: "Comfortable shoes and no rigid run-sheet",
  romantic: "Handwritten notes over printed scripts", fresh: "Greenery and daylight in every room", playful: "Games, dancing and a late snack", elegant: "Pressed linen and one metal, used sparingly",
  earthy: "Handmade over mass-made", joyful: "Colour at the haldi, loudly", moody: "Deep tones and candle shadow for the evening",
};
const DONT: Record<string, string> = {
  maximal: "No LED walls, fog machines or revolving anything", royal: "No thrones, no gold-on-gold", grand: "Nothing sized to impress people we barely know",
  modern: "No cold, showroom-style spaces", traditional: "No rituals kept only because it is expected", destination: "No making guests fly for it",
  garden: "No open-air plans without shade", minimal: "No bare, under-dressed rooms", candlelit: "No dim rooms where elders cannot see their plates",
  intimate: "No tiny list that leaves out people who matter", vintage: "No sepia filters on everything", boho: "No pampas-and-macrame set pieces",
  rustic: "No hay bales", brunch: "No early-morning call times", beach: "No sand in the formalwear", pastel: "No washed-out colour",
  whimsical: "No gimmicks", courtyard: "No squeezing everyone into a home space", joyful: "No neon colour clashes", playful: "No forced games",
  moody: "No dark, heavy rooms", elegant: "No stiff formality", warm: "No orange-tinted everything", quiet: "No silent, awkward dinners", unfussy: "No under-planning",
  romantic: "No syrupy speeches", fresh: "No cold daylight halls", earthy: "No beige-on-beige",
};
const FEELS: Record<string, string> = {
  garden: "a long afternoon outdoors with everyone we love", candlelit: "our living room, scaled up", minimal: "a deep breath", intimate: "a dinner where we know every face",
  traditional: "the weddings we grew up at, edited down to the best parts", vintage: "a memory we are already fond of", boho: "a slow weekend away", rustic: "a house party in the country",
  brunch: "the best Sunday we have ever had", courtyard: "home, with better lighting", pastel: "the first warm day of spring", whimsical: "an inside joke everyone is in on",
  beach: "the last evening of a good holiday", modern: "a gallery opening for two", destination: "a trip our friends still talk about", royal: "an old story told our way", maximal: "the party of the decade",
};
const ARTICLE = (w: string) => (/^[aeiou]/i.test(w) ? "An" : "A");

function tally(cards: Card[], pick: (c: Card) => string[]): Map<string, number> {
  const m = new Map<string, number>();
  cards.forEach((c) => pick(c).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
  return m;
}
const ranked = (pos: Map<string, number>, neg: Map<string, number>) =>
  [...pos.entries()].map(([k, n]) => [k, n - (neg.get(k) ?? 0), n] as const).filter(([, d]) => d > 0).sort((a, b) => b[1] - a[1] || b[2] - a[2] || a[0].localeCompare(b[0])).map(([k]) => k);

/** Build the guide from what was kept and what was turned down. `voted` should already include any inspiration-pool tiles. */
export function generateGuide(voted: Card[], themes: Theme[], now: number): IdentityGuide {
  const yes = voted.filter((c) => c.identityVote === "yes");
  const no = voted.filter((c) => c.identityVote === "no");
  const both = (c: Card) => [...c.tags.themes, ...c.tags.mood];

  // Palette: most-kept colours, one per colour family so it reads as a palette rather than five beiges.
  const hexCount = [...tally(yes, (c) => c.tags.colors.slice(0, 3).map((s) => s.hex)).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const palette: Swatch[] = [];
  const families = new Set<string>();
  for (const [hex] of hexCount) {
    const fam = colourName(hex);
    if (families.has(fam)) continue;
    families.add(fam);
    palette.push({ hex, name: prettyName(hex) });
    if (palette.length >= 6) break;
  }

  const moods = ranked(tally(yes, (c) => c.tags.mood), tally(no, (c) => c.tags.mood));
  const tones: Tone[] = moods.slice(0, 3).map((word) => ({ word, line: TONE_LINE[word] ?? "" }));
  const yesTags = tally(yes, both), noTags = tally(no, both);
  const likes = ranked(yesTags, noTags), dislikes = ranked(noTags, yesTags);
  const uniq = (xs: string[]) => [...new Set(xs)];
  const dos = uniq(likes.map((t) => DO[t]).filter(Boolean)).slice(0, 7);
  const donts = uniq(dislikes.map((t) => DONT[t]).filter(Boolean)).slice(0, 7);

  const topTheme = ranked(tally(yes, (c) => c.tags.themes), tally(no, (c) => c.tags.themes))[0];
  const words = tones.slice(0, 2).map((t) => t.word);
  const statement = yes.length
    ? `${ARTICLE(words[0] ?? "celebration")} ${words.length ? words.join(", ") + " " : ""}celebration that feels like ${FEELS[topTheme] ?? "the two of us, and nobody else's idea of a wedding"}.`
    : "Keep a few cards and your identity statement will write itself here.";

  const heroRank = (c: Card) => (c.pinned ? 0 : 2) + (c.type === "image" ? 0 : 1);
  const heroCardIds = [...yes].filter((c) => c.type === "image" || c.type === "link" || c.pinned).sort((a, b) => heroRank(a) - heroRank(b)).slice(0, 12).map((c) => c.id);
  const neverCardIds = no.filter((c) => c.type === "image" || c.type === "link").slice(0, 8).map((c) => c.id);
  return { palette, tones, dos, donts, statement, heroCardIds, neverCardIds, themeNames: themes.map((t) => t.name), generatedAt: now };
}
