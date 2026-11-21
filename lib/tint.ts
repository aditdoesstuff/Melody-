import type { IdentityGuide } from "./types";
import { hexToHsl } from "./palette";
import { DEFAULT_TINT, type Tint } from "@/components/InviteCard";

/** Invitation colours: the couple's own palette once a guide exists, aaroh wine and cream until then. */
export function tintFrom(guide: IdentityGuide | null): Tint {
  const hexes = guide?.palette.map((p) => p.hex).filter((h) => /^#[0-9a-f]{6}$/i.test(h)) ?? [];
  if (hexes.length < 3) return DEFAULT_TINT;
  const byLight = [...hexes].sort((a, b) => hexToHsl(a)[2] - hexToHsl(b)[2]);
  const paper = byLight[byLight.length - 1];
  const dark = byLight.filter((h) => hexToHsl(h)[2] < 0.42);
  const main = (dark.sort((a, b) => hexToHsl(b)[1] - hexToHsl(a)[1])[0]) ?? byLight[0];
  const accent = byLight.find((h) => h !== main && h !== paper && hexToHsl(h)[1] > 0.25) ?? byLight[Math.floor(byLight.length / 2)];
  return hexToHsl(paper)[2] < 0.7 ? { ...DEFAULT_TINT, main, accent } : { main, paper, accent };
}
