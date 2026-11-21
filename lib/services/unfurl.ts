import type { Source } from "../types";
import { cap, hash } from "../format";
import { sourceFromUrl } from "../tagging";

export interface Unfurl { url: string; title: string; domain: string; source: Source; colors: string[] }
export interface UnfurlService { unfurl(url: string): Promise<Unfurl> }

const SOURCE_COLOURS: Partial<Record<Source, string[]>> = {
  instagram: ["#c13584", "#f77737", "#5851db"],
  pinterest: ["#bd081c", "#e8a0a8", "#3a0a10"],
  spotify: ["#1db954", "#0b3d1f", "#121212"],
  whatsapp: ["#25d366", "#075e54", "#dcf8c6"],
};
const LABEL: Record<Source, string> = { instagram: "Instagram", pinterest: "Pinterest", spotify: "Spotify", whatsapp: "WhatsApp", web: "Link", upload: "Upload", manual: "Note" };

export function normaliseUrl(input: string): string | null {
  const s = input.trim();
  if (!s || /\s/.test(s)) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+(\/|$|\?)/.test(s) ? "https://" + s : null;
  if (!withProto) return null;
  try { return new URL(withProto).toString(); } catch { return null; }
}

/** No network: the title comes from the URL slug and the thumbnail is a generated gradient. Works offline. */
export class MockUnfurlService implements UnfurlService {
  async unfurl(url: string): Promise<Unfurl> {
    const u = new URL(url);
    const domain = u.hostname.replace(/^www\./, "");
    const source = sourceFromUrl(url);
    const slug = decodeURIComponent(u.pathname).split("/").filter((p) => p && !/^[\w-]{0,3}$/.test(p) && !(/^[A-Za-z0-9]{8,}$/.test(p) && /\d/.test(p))).pop() ?? "";
    const words = slug.replace(/\.[a-z]+$/i, "").replace(/[-_+]+/g, " ").trim();
    const kind = source === "spotify" ? (u.pathname.includes("playlist") ? "playlist" : u.pathname.includes("album") ? "album" : "track") : source === "instagram" ? (u.pathname.includes("/reel") ? "reel" : "post") : source === "pinterest" ? "pin" : "";
    const title = words && words.length > 2 ? cap(words) : kind ? `${LABEL[source]} ${kind}` : domain;
    const h = hash(url);
    const colors = SOURCE_COLOURS[source] ?? [`hsl(${h % 360} 45% 42%)`, `hsl(${(h >> 8) % 360} 50% 62%)`, `hsl(${(h >> 16) % 360} 35% 22%)`];
    return { url, title, domain, source, colors };
  }
}
export const unfurler: UnfurlService = new MockUnfurlService();
