import type { Item, Owner } from "./types";

// Demo content. Palette-only cards render as gradient tiles, so the demo works offline with no image assets.
type S = [string, string, string[], string[], Owner, "kept" | "declined" | "pending"];
const rows: S[] = [
  ["Pampas & dried florals", "Soft boho arch with pampas grass", ["#e9dcc9", "#c9a98a", "#8c6f56"], ["boho", "garden", "peach"], "me", "pending"],
  ["Candlelit long table", "Warm candlelit dinner under open sky", ["#2b1d14", "#d9a05b", "#f3e2c0"], ["candlelit", "intimate", "food"], "me", "pending"],
  ["Sage & ivory arch", "Minimal arch, greenery only", ["#b7c4a8", "#f4efe4", "#6f7f63"], ["minimal", "garden", "sage"], "me", "pending"],
  ["Film-grain portraits", "Vintage film portraits, natural light", ["#c8b8a2", "#7a6a58", "#e8dccb"], ["vintage", "intimate"], "me", "pending"],
  ["Small brunch ceremony", "Daytime brunch for 40 close people", ["#f1e4d3", "#d6a48a", "#a3b18a"], ["brunch", "intimate", "minimal"], "me", "pending"],
  ["Live acoustic set", "Acoustic band during dinner", ["#3a2f2a", "#b5835a", "#e6d5b8"], ["music", "candlelit"], "me", "pending"],
  ["Neon mandap", "Loud, bright mandap with neon", ["#ff2e93", "#ffd400", "#00b8d9"], ["maximal", "modern"], "me", "pending"],
  ["Glossy stage décor", "Glitter stage, LED wall", ["#d4af37", "#111111", "#8b0000"], ["maximal", "traditional"], "me", "pending"],

  ["Terracotta table", "Terracotta ceramics, warm linen", ["#c46a4a", "#efe0cd", "#8a5a44"], ["boho", "rustic", "terracotta"], "partner", "pending"],
  ["Garden ceremony", "Ceremony among real trees and flowers", ["#9fb38a", "#f6efe0", "#d8b4a0"], ["garden", "sage", "intimate"], "partner", "pending"],
  ["Playlist: indie & ghazal", "Mixed playlist, no DJ battle", ["#2f2a3a", "#8d6e9b", "#e8d9f0"], ["music", "lavender"], "partner", "pending"],
  ["Thali feast", "Regional thali, family style", ["#d89a3c", "#7a3b1d", "#f2d9a6"], ["food", "traditional", "marigold"], "partner", "pending"],
  ["Gallery-white venue", "White-wall gallery, quiet and clean", ["#f5f5f2", "#cfcfc8", "#2a2a2a"], ["modern", "minimal"], "partner", "pending"],
  ["Pheras at sunrise", "Short, meaningful ritual at sunrise", ["#f2b27a", "#fbe3c4", "#a55a3a"], ["traditional", "intimate", "peach"], "partner", "pending"],
  ["Beach barefoot", "Barefoot beach vows", ["#bfe0e6", "#f1e6cf", "#5fa8b8"], ["beach", "minimal", "sky"], "partner", "pending"],
  ["Rustic barn", "Barn with string lights", ["#8a6a4a", "#d9c3a0", "#3f2f22"], ["rustic", "candlelit"], "partner", "pending"],

  ["Grand banquet hall", "500-guest banquet, chandeliers", ["#c9a227", "#5b0f1a", "#f6e7b4"], ["maximal", "traditional"], "family", "pending"],
  ["Bollywood sangeet", "Choreographed sangeet with stage", ["#e91e63", "#ffc107", "#4a148c"], ["maximal", "music"], "family", "pending"],
  ["Red & gold mandap", "Classic red-and-gold mandap", ["#b3122f", "#d4af37", "#f7e9c1"], ["traditional", "maximal"], "family", "pending"],
  ["Elaborate buffet", "20-counter buffet", ["#b5651d", "#f0d9a8", "#6b3e1e"], ["food", "maximal"], "family", "pending"],
  ["Garden lunch", "Daytime garden lunch for relatives", ["#a8c09a", "#f3ead2", "#c98f6a"], ["garden", "brunch", "traditional"], "family", "pending"],
  ["Palace destination", "Destination palace weekend", ["#e8c98f", "#8c4a2f", "#2f3a4a"], ["destination", "traditional"], "family", "pending"],
];

export function seedItems(): Item[] {
  const now = Date.now();
  return rows.map(([title, text, palette, tags, owner, status], i) => ({
    id: `seed-${i}`,
    type: "image",
    title,
    text,
    tags,
    palette,
    owner,
    status,
    createdAt: now - i * 60000,
  }));
}

export const PRIORITY_DEFAULTS = [
  "Venue & setting",
  "Food & menu",
  "Music & mood",
  "Photography",
  "Décor & florals",
  "Attire",
  "Guest list size",
  "Rituals & ceremony",
];
