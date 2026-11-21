import type { Card, CardType, Category, Contact, Source, Vote, Who } from "./types";
import { swatch } from "./palette";

// Demo content. Cards without an image render as gradient tiles built from their colours,
// so the whole demo works offline and uses no copyrighted photos.
type Row = [title: string, text: string, hexes: string[], themes: string[], mood: string[], category: Category, objects: string[], who: Who, vote: Vote | "", type?: CardType, url?: string, source?: Source];

const rows: Row[] = [
  // Partner A
  ["Pampas arch at dusk", "Soft boho arch with pampas grass, just before the light goes", ["#e9dcc9", "#c9a98a", "#8c6f56"], ["boho", "garden"], ["warm", "earthy"], "decor", ["arch", "pampas"], "A", "yes"],
  ["Candle-lit long table", "One long table, candles the whole length, open sky", ["#2b1d14", "#d9a05b", "#f3e2c0"], ["candlelit", "intimate"], ["warm"], "decor", ["candles", "tablescape"], "A", "yes"],
  ["Sage and ivory mandap", "Greenery only, no gold, lots of air", ["#b7c4a8", "#f4efe4", "#6f7f63"], ["minimal", "garden"], ["quiet", "fresh"], "decor", ["mandap", "greenery"], "A", "yes"],
  ["Film-grain portraits", "Natural light, a little blur, nobody posing", ["#c8b8a2", "#7a6a58", "#e8dccb"], ["vintage", "intimate"], ["romantic"], "photography", ["portraits", "film"], "A", "yes"],
  ["Brunch for forty", "Daytime, forty people, home by evening", ["#f1e4d3", "#d6a48a", "#a3b18a"], ["brunch", "intimate"], ["fresh", "unfussy"], "food", ["brunch"], "A", "yes"],
  ["Acoustic set during dinner", "Two guitars and a voice, low enough to talk over", ["#3a2f2a", "#b5835a", "#e6d5b8"], ["candlelit"], ["warm", "quiet"], "music", ["acoustic", "live band"], "A", "yes"],
  ["Neon mandap", "Bright neon mandap someone sent on the family group", ["#ff2e93", "#ffd400", "#00b8d9"], ["maximal", "modern"], ["joyful"], "decor", ["mandap", "neon sign"], "A", "no"],
  ["LED wall stage", "Stage with an LED wall and smoke machines", ["#141414", "#3b2bd6", "#d4af37"], ["maximal"], ["grand"], "decor", ["stage"], "A", "no"],
  ["Jasmine ceiling", "Strings of mogra overhead, smells like every family wedding", ["#f6f1e1", "#9fb38a", "#d9cfae"], ["garden", "traditional"], ["romantic", "fresh"], "decor", ["jasmine", "ceiling"], "A", "yes"],
  ["Pastel lehenga, light border", "Blush with a thin border, light enough to dance in", ["#f0c9c4", "#f7e9df", "#c98f8a"], ["pastel", "minimal"], ["romantic", "quiet"], "outfit", ["lehenga"], "A", "yes"],
  ["", "No DJ battle. Only songs we actually listen to.", [], ["intimate"], ["unfussy"], "music", ["dj", "playlist"], "A", "yes", "text"],
  ["Garden mandap ideas", "", ["#bd081c", "#9fb38a", "#f4efe4"], ["garden"], ["fresh"], "decor", ["mandap", "flowers"], "A", "", "link", "https://www.pinterest.com/pin/garden-mandap-ideas", "pinterest"],
  ["Entry under fairy lights", "", ["#2a1f2e", "#f2c57c", "#c13584"], ["candlelit"], ["warm", "romantic"], "decor", ["fairy lights"], "A", "", "link", "https://www.instagram.com/reel/entry-under-fairy-lights", "instagram"],
  ["Sage", "", ["#b7c4a8"], ["garden"], ["fresh"], "other", [], "A", "", "color"],
  ["Handwritten vows", "Short, in our own words, read from paper", ["#efe6d6", "#b9a48a", "#5c4a3a"], ["intimate", "minimal"], ["quiet", "romantic"], "ritual", ["vows"], "A", "yes"],
  ["Courtyard haldi", "Haldi at home, marigolds, cousins with water guns", ["#f2b632", "#f7e3a1", "#c7622b"], ["courtyard", "traditional"], ["joyful", "warm"], "ritual", ["haldi", "marigold"], "A", "yes"],
  ["Ivory linen sherwani", "Linen, ivory, no embroidery to speak of", ["#f1ebdd", "#cfc5b0", "#8a8172"], ["minimal"], ["quiet", "elegant"], "outfit", ["sherwani", "linen"], "A", "maybe"],
  ["Polaroid guest book", "Guests leave a photo and a line", ["#f4f0e6", "#d9534f", "#3a3a3a"], ["vintage", "whimsical"], ["playful"], "photography", ["polaroid"], "A", "maybe"],
  ["Terrace sundowner", "Drinks on the terrace as the sun drops", ["#e8a15a", "#f6d7a8", "#5a3a4a"], ["courtyard", "candlelit"], ["warm", "unfussy"], "venue", ["terrace", "cocktails"], "A", ""],
  ["Dewy makeup, real skin", "Looks like me on a very good day", ["#f3d9c9", "#e7b9a5", "#b9806b"], ["minimal", "pastel"], ["fresh"], "beauty", ["makeup", "dewy"], "A", ""],
  ["Letterpress on cotton paper", "Off-white card, one colour, pressed deep", ["#f2ede2", "#6b7a5e", "#c9bfa9"], ["minimal", "vintage"], ["elegant", "quiet"], "stationery", ["letterpress", "invitation"], "A", ""],
  ["venue-shortlist.pdf", "", [], [], [], "venue", ["venue"], "A", "", "file"],
  // Partner B
  ["Terracotta table", "Clay plates, warm linen, nothing matching exactly", ["#c46a4a", "#efe0cd", "#8a5a44"], ["boho", "rustic"], ["earthy", "warm"], "decor", ["ceramics", "linen"], "B", "yes"],
  ["Ceremony among real trees", "An orchard, real shade, real birds", ["#9fb38a", "#f6efe0", "#d8b4a0"], ["garden", "intimate"], ["fresh", "quiet"], "venue", ["orchard"], "B", "yes"],
  ["Indie and ghazal playlist", "", ["#1db954", "#2f2a3a", "#8d6e9b"], ["vintage"], ["romantic"], "music", ["playlist", "ghazal", "indie"], "B", "yes", "link", "https://open.spotify.com/playlist/indie-and-ghazal", "spotify"],
  ["Thali, family style", "Regional thali passed down the table", ["#d89a3c", "#7a3b1d", "#f2d9a6"], ["traditional"], ["warm", "joyful"], "food", ["thali", "family style"], "B", "yes"],
  ["White-wall gallery", "A gallery space, bare walls, our people as the colour", ["#f5f5f2", "#cfcfc8", "#2a2a2a"], ["modern", "minimal"], ["quiet"], "venue", ["gallery"], "B", "maybe"],
  ["Pheras at sunrise", "Short, meaningful, done before the heat", ["#f2b27a", "#fbe3c4", "#a55a3a"], ["traditional", "brunch", "intimate"], ["warm"], "ritual", ["pheras"], "B", "yes"],
  ["Barefoot beach vows", "Sand, sea, no shoes", ["#bfe0e6", "#f1e6cf", "#5fa8b8"], ["beach", "minimal"], ["unfussy", "fresh"], "venue", ["beach", "vows"], "B", "maybe"],
  ["Barn with string lights", "Old barn, a thousand bulbs", ["#8a6a4a", "#d9c3a0", "#3f2f22"], ["rustic", "candlelit"], ["warm"], "venue", ["barn", "string lights"], "B", "yes"],
  ["Marigold stairway", "Genda garlands down every step", ["#f29f05", "#f7c948", "#7a3b1d"], ["traditional", "garden"], ["joyful", "warm"], "decor", ["marigold", "garland"], "B", "yes"],
  ["Nani's Banarasi dupatta", "Wear hers, restore the border", ["#8c1c2b", "#d4af37", "#f2e2b8"], ["traditional", "vintage"], ["elegant"], "outfit", ["banarasi", "dupatta"], "B", "yes"],
  ["Dhol only for the baraat", "Ten minutes of chaos, then calm", ["#d94f2b", "#f2c14e", "#3a1f1a"], ["traditional"], ["joyful", "playful"], "music", ["dhol", "baraat"], "B", "yes"],
  ["Live chaat counter", "Pani puri made in front of you", ["#e3a857", "#7fa35b", "#f4ead5"], ["traditional", "whimsical"], ["playful"], "food", ["chaat", "live counter"], "B", "yes"],
  ["Sufi night under lanterns", "Floor seating, lanterns, one voice", ["#2a1a22", "#c9843c", "#f0d9a8"], ["candlelit", "traditional"], ["warm", "moody"], "music", ["sufi", "lanterns"], "B", "yes"],
  ["", "Small enough that we get to talk to everyone.", [], ["intimate"], ["quiet"], "other", [], "B", "yes", "text"],
  ["Lake haveli in Udaipur", "A weekend away with everyone", ["#e8c98f", "#8c4a2f", "#2f3a4a"], ["destination", "royal", "traditional"], ["grand"], "venue", ["haveli", "udaipur"], "B", "maybe"],
  ["Black-and-white documentary", "No posing lists, just what happened", ["#1e1e1e", "#8a8a8a", "#efefef"], ["modern", "vintage"], ["moody"], "photography", ["documentary", "black and white"], "B", ""],
  ["Mehendi with tiny drawings", "Our dog, the mountains, a cup of chai", ["#7a3b1d", "#e7c9a5", "#5a6b3a"], ["whimsical", "traditional"], ["playful"], "beauty", ["mehendi", "illustration"], "B", ""],
  ["Mogra in her hair", "", ["#f7f3e6", "#3a2a26", "#c13584"], ["garden", "traditional"], ["romantic"], "beauty", ["gajra", "hair flowers"], "B", "", "link", "https://www.instagram.com/p/mogra-hair-flowers", "instagram"],
  ["Terracotta", "", ["#c46a4a"], ["boho"], ["earthy"], "other", [], "B", "", "color"],
  ["Wax-seal invite", "Deep red seal, cream envelope", ["#7a1f2b", "#f1e7d3", "#b99b6b"], ["vintage", "traditional"], ["elegant"], "stationery", ["wax seal", "invitation"], "B", ""],
  ["Bottle-green bandhgala", "Deep green, sharp cut", ["#1f3d2f", "#c9b27a", "#0f1f18"], ["modern", "traditional"], ["elegant", "moody"], "outfit", ["bandhgala"], "B", ""],
  ["Kulfi cart at midnight", "For whoever is still dancing", ["#f4e3c1", "#e59a7a", "#6b8a6f"], ["whimsical"], ["playful"], "food", ["kulfi"], "B", ""],
  // Family
  ["Grand banquet hall", "Five hundred guests, chandeliers", ["#c9a227", "#5b0f1a", "#f6e7b4"], ["maximal", "royal"], ["grand"], "venue", ["banquet", "chandelier"], "family", "no"],
  ["Choreographed sangeet", "Every cousin on stage, three costume changes", ["#e91e63", "#ffc107", "#4a148c"], ["maximal"], ["joyful", "grand"], "music", ["sangeet", "choreography", "bollywood"], "family", "maybe"],
  ["Red and gold mandap", "The classic, the one in every album", ["#b3122f", "#d4af37", "#f7e9c1"], ["traditional", "maximal"], ["grand", "joyful"], "decor", ["mandap"], "family", "no"],
  ["Twenty-counter buffet", "Something for everyone, twice", ["#b5651d", "#f0d9a8", "#6b3e1e"], ["maximal"], ["grand"], "food", ["buffet"], "family", "no"],
  ["Garden lunch for relatives", "A daytime lunch for the extended family", ["#a8c09a", "#f3ead2", "#c98f6a"], ["garden", "brunch", "traditional"], ["fresh"], "food", ["brunch", "feast"], "family", "yes"],
  ["Palace weekend", "Three days in a palace hotel", ["#e8c98f", "#7a2f2f", "#2f3a4a"], ["destination", "royal"], ["grand"], "venue", ["palace"], "family", "no"],
  ["Heavy zardozi lehenga", "Twelve kilos of handwork", ["#8b0a1a", "#d4af37", "#3a0a10"], ["traditional", "maximal", "royal"], ["grand"], "outfit", ["lehenga", "zardozi"], "family", "no"],
  ["Five-tier cake", "With sparklers", ["#f7f1e3", "#d4af37", "#e8b4c0"], ["maximal"], ["grand"], "food", ["cake"], "family", "no"],
  ["Shehnai at the entrance", "The sound of a wedding starting", ["#c98f3c", "#f2e2b8", "#6b2f1a"], ["traditional"], ["elegant", "warm"], "music", ["shehnai"], "family", "yes"],
  ["Family portrait wall", "Three generations of wedding photos, framed", ["#b99b6b", "#f1e7d3", "#4a3a2a"], ["traditional", "vintage"], ["warm"], "photography", ["portraits", "frames"], "family", "yes"],
  ["Gold-foil invitation box", "A box, with dry fruits, per family", ["#d4af37", "#5b0f1a", "#f6e7b4"], ["royal", "maximal"], ["grand"], "stationery", ["invitation"], "family", ""],
  ["Drone show", "Our names in the sky", ["#0b1026", "#4f7cff", "#f2f2f2"], ["maximal", "modern"], ["grand"], "other", ["drone"], "family", ""],
  ["Temple ceremony back home", "A quiet pooja in the family temple first", ["#e0a458", "#f6ead2", "#8a3b1d"], ["traditional", "intimate"], ["quiet"], "ritual", ["temple", "pooja"], "family", ""],
  ["Mithai for every guest", "A box to take home", ["#f2c14e", "#e59a7a", "#f7ecd2"], ["traditional"], ["warm"], "food", ["mithai"], "family", ""],
  ["Stage with thrones", "Velvet chairs, a queue for photos", ["#7a1f2b", "#d4af37", "#2a0a10"], ["maximal", "royal"], ["grand"], "decor", ["stage"], "family", ""],
  ["Revolving varmala platform", "It spins. There may be fog.", ["#c2185b", "#ffd54f", "#311b92"], ["maximal"], ["grand", "playful"], "ritual", ["varmala"], "family", ""],
];

function build(rows: Row[], prefix: string, now: number, sample = false): Card[] {
  return rows.map(([title, text, hexes, themes, mood, category, objects, who, vote, type = "image", url, source], i) => ({
    id: `${prefix}-${i}`,
    type,
    createdAt: now - i * 3_600_000,
    addedBy: who,
    title: type === "file" ? undefined : title || undefined,
    fileName: type === "file" ? title : undefined,
    text: type === "text" ? text : undefined,
    note: type !== "text" && text ? text : undefined,
    url,
    hex: type === "color" ? hexes[0] : undefined,
    source: source ?? (type === "image" ? "upload" : type === "link" ? "web" : "manual"),
    thumbColors: type === "link" ? hexes : undefined,
    tags: { themes, mood, colors: type === "link" ? [] : hexes.map(swatch), category, objects, source },
    tagStatus: "done" as const,
    identityVote: vote || undefined,
    sample: sample || undefined,
  }));
}

/** 60 realistic cards across both partners and family. Pass the current time from an event handler. */
export const demoCards = (now: number): Card[] => build(rows, "demo", now);

/** Three starter cards that teach the three ways in. Deletable. */
export const sampleCards = (now: number): Card[] =>
  build([
    ["", "Type a thought, like: no DJ, only live music. Delete me whenever.", [], ["intimate"], ["unfussy"], "music", ["live band"], "A", "", "text"],
    ["Paste any link", "Instagram, Pinterest, Spotify, anything. This one is a sample.", ["#bd081c", "#e8a0a8", "#3a0a10"], ["garden"], ["fresh"], "decor", ["flowers"], "A", "", "link", "https://www.pinterest.com/pin/garden-wedding-table", "pinterest"],
    ["Wine", "", ["#650020"], ["traditional"], ["moody"], "other", [], "A", "", "color"],
  ], "sample", now, true);

/**
 * Twelve made-up guests. The numbers are from the UK range Ofcom reserves for TV and film (07700 900xxx),
 * so they can never belong to a real person.
 */
export const DEMO_CONTACTS: Contact[] = [
  ["Riya Kapoor", "Friends"], ["Kabir Mehta", "Friends"], ["Ananya Rao", "Friends"], ["Dev Malhotra", "Work"],
  ["Meera Aunty", "Family"], ["Nana ji", "Elders"], ["Dadi", "Elders"], ["Chacha ji and family", "Family"],
  ["Ishaan Verma", "Work"], ["Tara D'Souza", "Friends"], ["Bua ji", "Family"], ["Zoya Khan", "Friends"],
].map(([name, group], i) => ({ id: `demo-c-${i}`, name, phone: `+4477009001${String(i + 10).padStart(2, "0")}`, valid: true, groups: [group] }));

export const DEFAULT_GROUPS = ["Family", "Friends", "Work", "Elders"];
