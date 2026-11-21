import type { Source, Tags } from "../types";
import { hash } from "../format";
import { extractPalette } from "../palette";
import { sourceFromUrl, tagFrom } from "../tagging";

export interface TaggingService {
  tagImage(file: Blob, hint?: string): Promise<Tags>;
  tagText(text: string): Promise<Tags>;
  tagLink(url: string, hint?: string): Promise<Tags>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Seeded 600 to 1500ms: the same input always "thinks" for the same time. */
const latency = (seed: string) => 600 + (hash(seed) % 900);

/** Default adapter. Runs fully in the browser: real colour extraction plus the bundled wedding dictionary. */
export class MockTaggingService implements TaggingService {
  async tagImage(file: Blob, hint = ""): Promise<Tags> {
    const name = hint || (file instanceof File ? file.name : "");
    const url = URL.createObjectURL(file);
    try {
      const [hexes] = await Promise.all([extractPalette(url, 5), wait(latency(name + file.size))]);
      return tagFrom(name.replace(/\.[a-z0-9]+$/i, ""), hexes, "upload");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async tagText(text: string): Promise<Tags> {
    await wait(latency(text));
    return tagFrom(text, [], "manual");
  }
  async tagLink(url: string, hint = ""): Promise<Tags> {
    await wait(latency(url));
    const source: Source = sourceFromUrl(url);
    let words = hint;
    try { const u = new URL(url); words += " " + decodeURIComponent(u.pathname + " " + u.search); } catch { words += " " + url; }
    return tagFrom(words, [], source);
  }
}

/**
 * Optional real adapter, enabled with NEXT_PUBLIC_TAGGING=claude.
 * It posts to a thin proxy you host (NEXT_PUBLIC_TAGGING_ENDPOINT) which holds the API key and calls a vision model.
 * No key ever ships in client code. Falls back to the mock on any failure.
 */
export class ClaudeVisionTaggingService implements TaggingService {
  private mock = new MockTaggingService();
  constructor(private endpoint: string) {}
  private async call(body: FormData | string, fallback: () => Promise<Tags>): Promise<Tags> {
    try {
      const res = await fetch(this.endpoint, { method: "POST", body, headers: typeof body === "string" ? { "content-type": "application/json" } : undefined });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Tags;
    } catch {
      return fallback();
    }
  }
  tagImage(file: Blob, hint?: string) { const f = new FormData(); f.append("image", file); if (hint) f.append("hint", hint); return this.call(f, () => this.mock.tagImage(file, hint)); }
  tagText(text: string) { return this.call(JSON.stringify({ text }), () => this.mock.tagText(text)); }
  tagLink(url: string, hint?: string) { return this.call(JSON.stringify({ url, hint }), () => this.mock.tagLink(url, hint)); }
}

const endpoint = process.env.NEXT_PUBLIC_TAGGING_ENDPOINT;
export const tagging: TaggingService =
  process.env.NEXT_PUBLIC_TAGGING === "claude" && endpoint ? new ClaudeVisionTaggingService(endpoint) : new MockTaggingService();
