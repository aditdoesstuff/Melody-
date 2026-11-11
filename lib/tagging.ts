import { colourName } from "./palette";

// Demo-grade "AI" tagging: keyword matching over text / filename + colour-derived tags.
// Swap this one function for a vision-model call in production; the rest of the app only sees string[] tags.
const VOCAB: Record<string, string[]> = {
  boho: ["boho", "pampas", "macrame", "earthy", "bohemian"],
  minimal: ["minimal", "simple", "clean", "understated", "quiet"],
  garden: ["garden", "floral", "flowers", "greenery", "botanical", "outdoor"],
  rustic: ["rustic", "barn", "wood", "farm"],
  traditional: ["traditional", "mandap", "pheras", "ritual", "heritage"],
  candlelit: ["candle", "candlelit", "lantern", "fairy", "warm light"],
  beach: ["beach", "sea", "ocean", "coast", "sand"],
  vintage: ["vintage", "retro", "film", "antique"],
  modern: ["modern", "contemporary", "architectural", "gallery"],
  maximal: ["maximal", "bold", "grand", "glitter", "extravagant", "sangeet", "bollywood"],
  intimate: ["intimate", "small", "close", "cosy", "cozy"],
  brunch: ["brunch", "daytime", "lunch", "picnic"],
  music: ["music", "dj", "band", "live", "playlist"],
  food: ["food", "menu", "feast", "thali", "cake", "dessert"],
  destination: ["destination", "travel", "palace", "resort", "hills"],
};

export function suggestTags(text: string, palette: string[] = []): string[] {
  const hay = text.toLowerCase();
  const tags = new Set<string>();
  for (const [tag, words] of Object.entries(VOCAB)) if (words.some((w) => hay.includes(w))) tags.add(tag);
  palette.slice(0, 2).forEach((p) => tags.add(colourName(p)));
  if (tags.size === 0) tags.add("inspiration");
  return [...tags].slice(0, 6);
}
