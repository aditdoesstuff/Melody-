import type { Category } from "./types";

/** Bundled wedding vocabulary (about 300 terms) used by the mock tagger. Term -> the category it signals. */
export const CATEGORY_WORDS: Record<Exclude<Category, "other">, string[]> = {
  decor: ["mandap", "floral", "florals", "flowers", "arch", "centerpiece", "centrepiece", "drapes", "draping", "lantern", "lanterns", "candle", "candles", "fairy lights", "string lights", "chandelier", "backdrop", "tablescape", "table setting", "garland", "marigold", "genda", "pampas", "rangoli", "diya", "diyas", "canopy", "aisle", "stage", "neon sign", "signage", "linen", "ceramics", "toran", "jasmine", "mogra", "roses", "peonies", "orchids", "foliage", "greenery", "jhoola", "swing", "installation", "ceiling", "lounge", "seating", "cushions", "decor", "bouquet", "petals"],
  outfit: ["lehenga", "saree", "sari", "sherwani", "kurta", "anarkali", "gown", "suit", "tux", "tuxedo", "dupatta", "veil", "bandhgala", "jewellery", "jewelry", "necklace", "maang tikka", "kaleere", "chooda", "juttis", "heels", "safa", "turban", "pagdi", "blouse", "embroidery", "zardozi", "chikankari", "banarasi", "kanjeevaram", "dress", "sneakers", "nath", "bangles", "earrings", "indo-western", "sharara", "gharara", "outfit", "attire", "trousseau"],
  venue: ["venue", "palace", "haveli", "fort", "resort", "farmhouse", "lawn", "banquet", "hall", "courtyard", "terrace", "rooftop", "beach", "vineyard", "villa", "garden venue", "heritage hotel", "temple", "gurudwara", "church", "courthouse", "registry", "backyard", "homestay", "riverside", "lakeside", "hilltop", "barn", "gallery", "cafe", "orchard", "estate", "ballroom", "poolside"],
  music: ["music", "playlist", "dj", "band", "live band", "acoustic", "sangeet", "dhol", "shehnai", "sufi", "ghazal", "qawwali", "bollywood", "indie", "jazz", "choreography", "dance", "first dance", "baraat", "entry song", "singer", "sitar", "tabla", "karaoke", "setlist", "spotify", "soundtrack", "performance", "emcee"],
  food: ["food", "menu", "catering", "thali", "buffet", "feast", "cake", "dessert", "mithai", "chaat", "biryani", "live counter", "cocktail", "cocktails", "mocktail", "bar", "chai", "coffee", "brunch", "dinner", "sit-down", "family style", "grazing table", "paan", "kulfi", "jalebi", "tasting", "canapes", "street food", "sadhya", "wazwan", "barbecue", "wine"],
  photography: ["photo", "photos", "photography", "photographer", "portrait", "portraits", "candid", "film", "film grain", "polaroid", "video", "videographer", "reel", "teaser", "pre-wedding", "couple shoot", "drone", "album", "golden hour", "black and white", "documentary", "editorial", "photobooth", "frames", "shot list"],
  stationery: ["invite", "invites", "invitation", "card", "save the date", "stationery", "letterpress", "monogram", "wax seal", "envelope", "e-invite", "rsvp", "itinerary", "welcome note", "place card", "menu card", "hashtag", "wedding website", "calligraphy", "illustration", "crest", "logo"],
  beauty: ["makeup", "hair", "hairstyle", "bun", "braid", "mehendi", "mehndi", "henna", "nails", "skincare", "glam", "dewy", "bridal makeup", "groom styling", "beard", "gajra", "hair flowers", "lipstick", "kohl", "facial", "stylist", "draping artist"],
  travel: ["travel", "flight", "flights", "stay", "hotel", "rooms", "shuttle", "transport", "itinerary", "destination", "honeymoon", "road trip", "train", "airport", "welcome hamper", "visa", "homestay", "island", "hills", "goa", "udaipur", "jaipur", "kerala", "bali", "italy"],
  ritual: ["pheras", "vows", "haldi", "sangeet night", "roka", "engagement", "nikah", "anand karaj", "varmala", "jaimala", "kanyadaan", "vidaai", "bidaai", "baraat", "reception", "cocktail night", "ceremony", "pooja", "puja", "ring exchange", "court marriage", "registrar", "sagai", "chooda ceremony", "mehendi night", "griha pravesh"],
};

/** Theme tags and the words that trigger them. */
export const THEME_WORDS: Record<string, string[]> = {
  boho: ["boho", "bohemian", "pampas", "macrame", "dried flowers", "rattan", "terracotta"],
  minimal: ["minimal", "minimalist", "simple", "clean", "understated", "pared", "no fuss", "white on white"],
  garden: ["garden", "floral", "flowers", "greenery", "botanical", "outdoor", "lawn", "open sky", "orchard", "trees"],
  rustic: ["rustic", "barn", "wood", "farm", "farmhouse", "string lights"],
  traditional: ["traditional", "mandap", "pheras", "ritual", "heritage", "classic", "banarasi", "marigold", "genda", "haveli", "temple"],
  candlelit: ["candle", "candles", "candlelit", "lantern", "lanterns", "fairy lights", "warm light", "evening", "dusk", "diya", "diyas", "night"],
  beach: ["beach", "sea", "ocean", "coast", "sand", "goa", "barefoot", "island"],
  vintage: ["vintage", "retro", "film", "antique", "polaroid", "old-school", "nostalgia"],
  modern: ["modern", "contemporary", "architectural", "gallery", "monochrome", "geometric", "editorial"],
  maximal: ["maximal", "bold", "grand", "glitter", "extravagant", "bollywood", "led wall", "neon", "over the top", "500 guests"],
  intimate: ["intimate", "small", "close", "cosy", "cozy", "40 people", "just family", "tiny", "micro"],
  brunch: ["brunch", "daytime", "lunch", "picnic", "morning", "sunrise"],
  destination: ["destination", "getaway", "weekend away", "resort", "hills", "udaipur", "jaipur", "kerala", "italy", "bali"],
  royal: ["royal", "palace", "regal", "fort", "chandelier", "velvet", "gold"],
  pastel: ["pastel", "blush", "powder", "soft pink", "mint", "lilac", "peach"],
  courtyard: ["courtyard", "terrace", "rooftop", "backyard", "home", "living room", "verandah"],
  whimsical: ["whimsical", "playful", "quirky", "illustrated", "colourful", "confetti", "fun"],
};

/** Mood words and their triggers. */
export const MOOD_WORDS: Record<string, string[]> = {
  warm: ["warm", "golden", "glow", "cosy", "cozy", "candle", "amber", "sunset", "golden hour"],
  romantic: ["romantic", "soft", "dreamy", "love", "tender", "blush"],
  quiet: ["quiet", "calm", "slow", "still", "simple", "understated", "minimal"],
  playful: ["playful", "fun", "silly", "dance", "quirky", "laugh", "party"],
  grand: ["grand", "lavish", "opulent", "royal", "regal", "big", "extravagant"],
  earthy: ["earthy", "natural", "raw", "handmade", "terracotta", "khadi", "rustic"],
  fresh: ["fresh", "airy", "light", "breezy", "green", "morning"],
  moody: ["moody", "dark", "dramatic", "smoky", "night", "after dark"],
  joyful: ["joyful", "bright", "colourful", "colorful", "festive", "loud", "celebration"],
  elegant: ["elegant", "classic", "timeless", "polished", "refined"],
  unfussy: ["unfussy", "relaxed", "easy", "casual", "barefoot", "no dress code"],
};

/** When there are no words to go on (IMG_2041.jpg), colour still says something. */
export const COLOUR_MOOD: Record<string, string> = {
  ivory: "quiet", cream: "quiet", blush: "romantic", peach: "romantic", terracotta: "earthy", marigold: "joyful", butter: "warm",
  sage: "fresh", green: "fresh", teal: "fresh", sky: "fresh", navy: "moody", charcoal: "moody", black: "moody", lavender: "romantic", red: "joyful", rose: "romantic",
};
export const COLOUR_THEME: Record<string, string> = {
  ivory: "minimal", cream: "minimal", blush: "pastel", peach: "pastel", lavender: "pastel", sky: "pastel", butter: "pastel",
  terracotta: "boho", marigold: "traditional", red: "traditional", sage: "garden", green: "garden", teal: "beach",
  navy: "modern", charcoal: "modern", black: "modern", rose: "maximal",
};
/** Colour families that count as "pastel" / "dark" / "warm" for search. */
export const COLOUR_FAMILY: Record<string, string[]> = {
  pastel: ["blush", "peach", "lavender", "sky", "butter", "sage", "ivory"],
  dark: ["navy", "charcoal", "black"],
  warm: ["terracotta", "marigold", "butter", "peach", "red"],
  neutral: ["ivory", "cream", "charcoal"],
};
