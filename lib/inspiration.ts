import type { Card, Category } from "./types";
import { swatch } from "./palette";

// A bundled pool of 40 inspiration tiles for the Keep / Not-for-us flow when the Space is thin.
// Colour tiles and words only: no third-party images.
type Row = [title: string, hexes: string[], themes: string[], mood: string[], category: Category];
const rows: Row[] = [
  ["Marigold everything", ["#f29f05", "#f7c948", "#7a3b1d"], ["traditional"], ["joyful"], "decor"],
  ["All-white florals", ["#f6f3ea", "#dfe6d5", "#b9c2a8"], ["minimal", "garden"], ["quiet"], "decor"],
  ["Fairy-light canopy", ["#1f1a2b", "#f2c57c", "#6b5a8a"], ["candlelit"], ["romantic", "warm"], "decor"],
  ["Disco ball dance floor", ["#3a3a4a", "#c0c0d0", "#e91e63"], ["maximal", "whimsical"], ["playful"], "music"],
  ["Mountain-view pheras", ["#9db6c4", "#e9eef0", "#4a5a4a"], ["destination", "intimate"], ["quiet", "fresh"], "venue"],
  ["Rooftop in the city", ["#2a2f3a", "#e8a15a", "#8a8f9a"], ["courtyard", "modern"], ["moody"], "venue"],
  ["Grandparents' home", ["#d9c3a0", "#8a6a4a", "#f1e7d3"], ["courtyard", "traditional"], ["warm"], "venue"],
  ["Beach at low tide", ["#bfe0e6", "#f1e6cf", "#5fa8b8"], ["beach"], ["unfussy", "fresh"], "venue"],
  ["Palace courtyard", ["#e8c98f", "#8c4a2f", "#f6ead2"], ["royal", "destination"], ["grand"], "venue"],
  ["Registry office, then lunch", ["#f1ede4", "#6b7a8a", "#c9bfa9"], ["minimal", "intimate"], ["unfussy"], "ritual"],
  ["Red lehenga, the classic", ["#a3122a", "#d4af37", "#3a0a10"], ["traditional"], ["grand"], "outfit"],
  ["Ivory saree, gold border", ["#f4ecd8", "#c9a227", "#8a7a5a"], ["traditional", "minimal"], ["elegant"], "outfit"],
  ["Sneakers under the lehenga", ["#f0c9c4", "#ffffff", "#3a3a3a"], ["whimsical", "modern"], ["playful"], "outfit"],
  ["Tuxedo, black tie", ["#111111", "#f2f2f2", "#5a5a5a"], ["modern"], ["elegant", "moody"], "outfit"],
  ["Matching pastels", ["#f0c9c4", "#cfe0d0", "#f7ecd2"], ["pastel"], ["romantic"], "outfit"],
  ["Live band, old Hindi songs", ["#5a2f2a", "#d9a05b", "#f3e2c0"], ["vintage"], ["warm", "romantic"], "music"],
  ["DJ till 3am", ["#12002b", "#7c4dff", "#ff4081"], ["maximal"], ["playful", "joyful"], "music"],
  ["Qawwali night", ["#3a1a12", "#c9843c", "#f0d9a8"], ["traditional", "candlelit"], ["moody", "warm"], "music"],
  ["First dance, just us", ["#2a1f2e", "#e8b4c0", "#f7ecd2"], ["intimate"], ["romantic"], "music"],
  ["Silent disco", ["#0b1026", "#4f7cff", "#7cffb2"], ["whimsical", "modern"], ["playful"], "music"],
  ["Sit-down dinner", ["#2b1d14", "#d9a05b", "#f3e2c0"], ["candlelit", "intimate"], ["elegant"], "food"],
  ["Street-food stalls", ["#e3a857", "#d94f2b", "#7fa35b"], ["whimsical", "traditional"], ["joyful"], "food"],
  ["Banana-leaf sadhya", ["#5a8a3a", "#f2d9a6", "#c46a4a"], ["traditional"], ["earthy"], "food"],
  ["Cocktail hour, good ice", ["#2f3a3a", "#e8a15a", "#cfd8d0"], ["modern"], ["elegant"], "food"],
  ["Chai and jalebi at dawn", ["#c98f3c", "#f6ead2", "#8a3b1d"], ["brunch", "traditional"], ["warm"], "food"],
  ["Drone and cinematic film", ["#0f1a26", "#6b8aa3", "#e9eef0"], ["maximal", "modern"], ["grand"], "photography"],
  ["One photographer, no posing", ["#c8b8a2", "#7a6a58", "#e8dccb"], ["intimate", "vintage"], ["unfussy"], "photography"],
  ["Disposable cameras on tables", ["#f4f0e6", "#f2c14e", "#3a3a3a"], ["vintage", "whimsical"], ["playful"], "photography"],
  ["Pre-wedding shoot abroad", ["#9db6c4", "#f1e6cf", "#c98f8a"], ["destination", "maximal"], ["grand"], "photography"],
  ["Hand-illustrated invite", ["#f2ede2", "#c46a4a", "#6b7a5e"], ["whimsical"], ["playful"], "stationery"],
  ["WhatsApp invite only", ["#25d366", "#f1ede4", "#075e54"], ["minimal", "modern"], ["unfussy"], "stationery"],
  ["Boxed invite with sweets", ["#d4af37", "#5b0f1a", "#f6e7b4"], ["royal", "traditional"], ["grand"], "stationery"],
  ["Bold bridal glam", ["#8b0a1a", "#d4af37", "#2a0a10"], ["maximal", "traditional"], ["grand"], "beauty"],
  ["Loose hair, fresh flowers", ["#f7f3e6", "#9fb38a", "#e7b9a5"], ["garden", "boho"], ["romantic", "fresh"], "beauty"],
  ["Minimal mehendi", ["#7a3b1d", "#f1e7d3", "#c9a98a"], ["minimal"], ["quiet"], "beauty"],
  ["Three days, five functions", ["#e91e63", "#ffc107", "#4a148c"], ["maximal", "traditional"], ["joyful", "grand"], "ritual"],
  ["One day, one function", ["#f1ede4", "#b7c4a8", "#8a8172"], ["minimal", "intimate"], ["quiet", "unfussy"], "ritual"],
  ["Vows we wrote ourselves", ["#efe6d6", "#b9a48a", "#5c4a3a"], ["intimate"], ["romantic"], "ritual"],
  ["Baraat on a vintage scooter", ["#d94f2b", "#f2c14e", "#4a6b7a"], ["whimsical", "vintage"], ["playful", "joyful"], "ritual"],
  ["Plant a tree instead of favours", ["#5a8a3a", "#c9b27a", "#f1ede4"], ["garden", "minimal"], ["earthy"], "other"],
];

export const INSPIRATION: Card[] = rows.map(([title, hexes, themes, mood, category], i) => ({
  id: `pool-${i}`, type: "image", createdAt: 0, addedBy: "A", title, source: "manual",
  tags: { themes, mood, colors: hexes.map(swatch), category, objects: [] }, tagStatus: "done",
}));
