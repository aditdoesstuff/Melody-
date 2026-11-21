import type { BudgetCategory } from "./types";

/** Budget / priority categories. `icon` is a lucide-react icon name resolved in components/CatIcon.tsx. */
export const CATEGORIES: BudgetCategory[] = [
  { id: "venue", name: "Venue", desc: "Where it all happens", icon: "MapPin" },
  { id: "catering", name: "Catering", desc: "Food, drinks, the midnight chai", icon: "UtensilsCrossed" },
  { id: "decor", name: "Decor & Florals", desc: "Flowers, lights, the feel of the room", icon: "Flower2" },
  { id: "photo", name: "Photography & Video", desc: "What you keep afterwards", icon: "Camera" },
  { id: "outfits", name: "Outfits", desc: "What you two wear, every function", icon: "Shirt" },
  { id: "music", name: "Music & Entertainment", desc: "Band, DJ, sangeet, the dance floor", icon: "Music" },
  { id: "beauty", name: "Makeup & Styling", desc: "Hair, makeup, mehendi artists", icon: "Sparkles" },
  { id: "stationery", name: "Invitations & Stationery", desc: "Cards, signage, the save-the-date", icon: "Mail" },
  { id: "travel", name: "Travel & Stay", desc: "Getting people there and housed", icon: "Plane" },
  { id: "honeymoon", name: "Honeymoon", desc: "The bit that is only for you two", icon: "Palmtree" },
  { id: "gifts", name: "Gifts & Favours", desc: "Thank-yous for family and guests", icon: "Gift" },
  { id: "planner", name: "Planner / Coordination", desc: "Someone else holding the clipboard", icon: "ClipboardList" },
];
export const DEFAULT_ORDER = CATEGORIES.map((c) => c.id);
