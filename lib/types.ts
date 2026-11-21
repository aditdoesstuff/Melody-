export type Who = "A" | "B" | "family";
export type Persona = "A" | "B";
export type WeddingType = "love" | "arranged" | "court";
export type Role = "bride" | "groom" | "both" | "family";
export type ViewMode = "couple" | "family";

export type CardType = "image" | "link" | "text" | "file" | "color";
export type Source = "instagram" | "pinterest" | "whatsapp" | "spotify" | "upload" | "web" | "manual";
export type Category = "decor" | "outfit" | "venue" | "music" | "food" | "photography" | "stationery" | "beauty" | "travel" | "ritual" | "other";
export type Vote = "yes" | "no" | "maybe";

export interface Swatch { hex: string; name: string }
export interface Tags {
  themes: string[];
  mood: string[];
  colors: Swatch[];
  category: Category;
  objects: string[];
  source?: Source;
}

export interface Card {
  id: string;
  type: CardType;
  createdAt: number;
  addedBy: Who;
  title?: string;
  note?: string;
  url?: string;
  source?: Source;
  blobKey?: string;
  thumbKey?: string;
  text?: string;
  fileName?: string;
  hex?: string;
  /** Gradient colours for a link thumbnail. Kept apart from tags so brand colours do not pollute palettes. */
  thumbColors?: string[];
  tags: Tags;
  tagStatus: "pending" | "done" | "error";
  themeId?: string;
  identityVote?: Vote;
  pinned?: boolean;
  sample?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  cardIds: string[];
  palette: string[];
  topTags: string[];
  pct: number;
  locked?: boolean;
}

export type CategoryId = string;
export type Tier = "must" | "nice" | "skip";
export interface BudgetCategory { id: CategoryId; name: string; desc: string; icon: string; custom?: boolean }
export interface Ranking { order: CategoryId[]; tiers: Record<CategoryId, Tier> }

export type Currency = "INR" | "USD" | "GBP" | "EUR";
export interface Budget {
  total: number;
  currency: Currency;
  guests?: number;
  /** Percentages of the spendable budget (after contingency). null = derived from the ranking. */
  weights: Record<CategoryId, number> | null;
  locked: CategoryId[];
  contingencyPct: number;
}

export interface Tone { word: string; line: string }
export interface IdentityGuide {
  palette: Swatch[];
  tones: Tone[];
  dos: string[];
  donts: string[];
  statement: string;
  heroCardIds: string[];
  neverCardIds: string[];
  themeNames: string[];
  generatedAt: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 when valid
  valid: boolean;
  groups: string[];
}
export type SendStatus = "opened" | "skipped";
export type Channel = "whatsapp" | "sms";
export interface Invite {
  id: string;
  title: string;
  templateId: string;
  groups: string[]; // which guest groups receive it
  message: string;
  lang: "en" | "hinglish";
  fields: { names: string; date: string; venue: string; rsvp: string };
  status: Record<string, SendStatus>; // by contact id
}
export interface LogEntry { at: number; text: string }

/** Compact, URL-safe snapshot rendered by /share. No image blobs. */
export type ShareSnapshot =
  | { k: "themes"; n: [string, string]; t: { name: string; d: string; p: string[]; g: string[]; pct: number }[] }
  | { k: "identity"; n: [string, string]; s: string; p: Swatch[]; t: Tone[]; dos: string[]; donts: string[]; th: string[] }
  | { k: "budget"; n: [string, string]; c: Currency; total: number; g?: number; cp: number; rows: { name: string; amt: number; pct: number }[] };
