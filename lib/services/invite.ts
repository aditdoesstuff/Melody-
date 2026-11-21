import type { Channel, Invite } from "../types";

export const DEFAULT_MESSAGE: Record<Invite["lang"], string> = {
  en: "Hi {name}! We are getting married and it would not feel right without you there.\n\n{names}\n{date}\n{venue}\n\nRSVP: {rsvp}",
  hinglish: "Hi {name}! Shaadi pakki ho gayi hai, aur aapke bina toh baat hi nahi banegi.\n\n{names}\n{date}\n{venue}\n\nAana zaroor. RSVP: {rsvp}",
};

/** Fill {name}, {names}, {date}, {venue}, {rsvp}. Empty fields drop their whole line. */
export function fillMessage(template: string, name: string, f: Invite["fields"]): string {
  const map: Record<string, string> = { name: name.split(" ")[0] || "there", names: f.names, date: f.date, venue: f.venue, rsvp: f.rsvp };
  return template.split("\n")
    .map((line) => {
      const keys = [...line.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      if (keys.length && keys.every((k) => k !== "name" && k in map && !map[k])) return null;
      return line.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
    })
    .filter((l): l is string => l !== null).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const waLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
/** `?&body=` is the one form that works on both iOS and Android. */
export const smsLink = (phone: string, text: string) => `sms:${phone}?&body=${encodeURIComponent(text)}`;
export const linkFor = (channel: Channel, phone: string, text: string) => (channel === "whatsapp" ? waLink(phone, text) : smsLink(phone, text));

/** SMS length: 160 chars per part in plain GSM, 70 once any non-GSM character (emoji, Hindi) appears. */
export function smsParts(text: string): { chars: number; parts: number; unicode: boolean } {
  const unicode = /[^\x00-\x7F€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ¤¡ÄÖÑÜ§¿äöñüà]/.test(text);
  const [single, multi] = unicode ? [70, 67] : [160, 153];
  return { chars: text.length, parts: text.length <= single ? 1 : Math.ceil(text.length / multi), unicode };
}
