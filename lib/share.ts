import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { ShareSnapshot } from "./types";

/** The whole shared view lives in the URL hash, compressed. No server, so the link works on any device. */
export const encodeSnapshot = (s: ShareSnapshot): string => compressToEncodedURIComponent(JSON.stringify(s));

export function decodeSnapshot(data: string): ShareSnapshot | null {
  try {
    const json = decompressFromEncodedURIComponent(data.replace(/^#/, ""));
    if (!json) return null;
    const s = JSON.parse(json) as ShareSnapshot;
    if (!s || typeof s !== "object" || !["themes", "identity", "budget"].includes(s.k) || !Array.isArray(s.n)) return null;
    return s;
  } catch {
    return null;
  }
}
export const sharePath = (s: ShareSnapshot) => `/share/${s.k}#${encodeSnapshot(s)}`;
