import type { Currency } from "./types";

const LOCALE: Record<Currency, string> = { INR: "en-IN", USD: "en-US", GBP: "en-GB", EUR: "en-IE" };
export const SYMBOL: Record<Currency, string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€" };

/** Indian digit grouping for INR (12,50,000), western grouping otherwise. */
export function money(n: number, c: Currency): string {
  return SYMBOL[c] + Math.round(n).toLocaleString(LOCALE[c]);
}
/** Short form for tight spaces: ₹12.5L, ₹1.2Cr, $45k. */
export function moneyShort(n: number, c: Currency): string {
  const s = SYMBOL[c];
  const trim = (x: number) => (Math.round(x * 10) / 10).toString();
  if (c === "INR") {
    if (n >= 1e7) return `${s}${trim(n / 1e7)}Cr`;
    if (n >= 1e5) return `${s}${trim(n / 1e5)}L`;
    if (n >= 1e3) return `${s}${trim(n / 1e3)}k`;
    return s + Math.round(n);
  }
  if (n >= 1e6) return `${s}${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${s}${trim(n / 1e3)}k`;
  return s + Math.round(n);
}
export const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
/** Small deterministic string hash (FNV-1a), used for seeded "randomness". */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** "2026-11-19" -> "19 November 2026". Anything unparseable is returned as typed. */
export function prettyDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
