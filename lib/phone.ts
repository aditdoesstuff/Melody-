import type { Contact } from "./types";
import { hash } from "./format";

/** Normalise to E.164. Bare 10-digit numbers get the default country code (India, 91, unless changed in Settings). */
export function normalisePhone(raw: string, cc = "91"): { phone: string; valid: boolean } {
  let s = raw.trim().replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  let digits: string;
  if (s.startsWith("+")) digits = s.slice(1).replace(/\D/g, "");
  else {
    const d = s.replace(/\D/g, "").replace(/^0+/, "");
    digits = d.length > 10 && d.startsWith(cc) ? d : cc + d;
  }
  let valid = digits.length >= 8 && digits.length <= 15;
  if (valid && digits.startsWith("91")) valid = /^91[6-9]\d{9}$/.test(digits);
  if (valid && digits.startsWith("1")) valid = digits.length === 11;
  return { phone: "+" + digits, valid };
}

export type Draft = { name: string; phone: string; groups?: string[] };
const looksLikePhone = (s: string) => (s.match(/\d/g)?.length ?? 0) >= 7 && /^[\d\s()+.-]+$/.test(s.trim());

/** "Name, number" per line. Also accepts "number, name", tabs, or a bare number. */
export function parseLines(text: string): Draft[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
    const pi = parts.findIndex(looksLikePhone);
    if (pi === -1) {
      const m = line.match(/^(.*?)[\s:]+(\+?[\d][\d\s()-]{6,})$/);
      return m ? { name: m[1].trim(), phone: m[2] } : null;
    }
    const rest = parts.filter((_, i) => i !== pi);
    return { name: rest[0] ?? "", phone: parts[pi], groups: rest.slice(1) };
  }).filter((d): d is NonNullable<typeof d> => !!d);
}

function splitCsvRow(row: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { if (q && row[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
/** CSV with a header row (name, phone / number / mobile / whatsapp, group) or headerless "name,number". */
export function parseCsv(text: string): Draft[] {
  const rows = text.split(/\r?\n/).filter((r) => r.trim()).map(splitCsvRow);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.toLowerCase());
  const pi = head.findIndex((h) => /phone|number|mobile|whatsapp|tel/.test(h));
  if (pi === -1) return parseLines(text);
  const ni = head.findIndex((h) => /name/.test(h));
  const gi = head.findIndex((h) => /group|tag|side|function/.test(h));
  return rows.slice(1).filter((r) => r[pi]).map((r) => ({ name: ni >= 0 ? r[ni] : "", phone: r[pi], groups: gi >= 0 && r[gi] ? r[gi].split(/[|;/]/).map((g) => g.trim()).filter(Boolean) : [] }));
}
/** vCard (.vcf): one contact per TEL line. */
export function parseVcf(text: string): Draft[] {
  const out: Draft[] = [];
  for (const block of text.replace(/\r\n[ \t]/g, "").split(/BEGIN:VCARD/i).slice(1)) {
    const fn = block.match(/^FN[^:]*:(.*)$/im)?.[1]?.trim() ?? block.match(/^N[^:]*:(.*)$/im)?.[1]?.split(";").filter(Boolean).reverse().join(" ").trim() ?? "";
    for (const m of block.matchAll(/^(?:item\d+\.)?TEL[^:]*:(.*)$/gim)) out.push({ name: fn, phone: m[1].trim() });
  }
  return out;
}

/** Normalise, drop duplicates (by number) against what is already saved, and report what happened. */
export function toContacts(drafts: Draft[], existing: Contact[], cc = "91", defaultGroups: string[] = []): { added: Contact[]; duplicates: number; invalid: number } {
  const seen = new Set(existing.map((c) => c.phone));
  const added: Contact[] = []; let duplicates = 0, invalid = 0;
  for (const d of drafts) {
    const { phone, valid } = normalisePhone(d.phone, cc);
    if (seen.has(phone)) { duplicates++; continue; }
    seen.add(phone);
    if (!valid) invalid++;
    added.push({ id: "c-" + hash(phone + d.name).toString(36) + added.length.toString(36), name: d.name || phone, phone, valid, groups: d.groups?.length ? d.groups : defaultGroups });
  }
  return { added, duplicates, invalid };
}

export const prettyPhone = (p: string) => p.replace(/^(\+91)(\d{5})(\d{5})$/, "$1 $2 $3").replace(/^(\+44)(\d{4})(\d{6})$/, "$1 $2 $3");
export const CSV_TEMPLATE = "name,whatsapp number,group\nRiya Kapoor,+91 98765 43210,Friends\nNana ji,9876501234,Family\n";
