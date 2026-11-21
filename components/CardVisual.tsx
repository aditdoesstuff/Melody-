"use client";
/* eslint-disable @next/next/no-img-element */
import { FileText, Link2, Music } from "lucide-react";
import type { Card } from "@/lib/types";
import { useBlobUrl } from "@/lib/blobs";
import { gradientFor, inkOn } from "@/lib/palette";
import { hash } from "@/lib/format";

const RATIOS = ["3/4", "1/1", "4/3", "4/5"];
/** Alt text built from tags, so screen readers get more than "image". */
export function altFor(c: Card): string {
  const bits = [c.title, c.tags.objects.slice(0, 2).join(", "), c.tags.themes.slice(0, 2).join(", ")].filter(Boolean);
  return bits.join(". ") || c.text || c.fileName || "Saved card";
}

/** The picture part of a card: photo, gradient tile, note, link, file or colour swatch. */
export default function CardVisual({ card, fixed, className = "" }: { card: Card; fixed?: string; className?: string }) {
  const url = useBlobUrl(card.thumbKey ?? card.blobKey);
  const ratio = fixed ?? RATIOS[hash(card.id) % RATIOS.length];
  const hexes = card.thumbColors?.length ? card.thumbColors : card.tags.colors.map((s) => s.hex);

  if (card.type === "text") return <div className={`p-4 ${className}`} style={fixed ? { aspectRatio: fixed, overflow: "hidden" } : undefined}><p className="font-serif text-peach text-lg leading-snug">“{card.text}”</p></div>;
  if (card.type === "color" && card.hex) return <div role="img" aria-label={`Colour ${card.title ?? card.hex}`} className={`grid place-items-end p-3 ${className}`} style={{ aspectRatio: fixed ?? "1/1", background: card.hex, color: inkOn(card.hex) }}><span className="text-xs font-mono uppercase">{card.hex}</span></div>;
  if (card.type === "file") return <div className={`grid place-items-center gap-2 bg-surface-2 ${className}`} style={{ aspectRatio: fixed ?? "4/3" }}><FileText size={34} className="text-peach" aria-hidden /></div>;
  if (card.type === "image" && (card.thumbKey || card.blobKey)) {
    return url ? <img src={url} alt={altFor(card)} loading="lazy" className={`w-full object-cover ${className}`} style={fixed ? { aspectRatio: fixed } : undefined} /> : <div className={`skeleton !rounded-none ${className}`} style={{ aspectRatio: ratio }} />;
  }
  return (
    <div role="img" aria-label={altFor(card)} className={`relative ${className}`} style={{ aspectRatio: card.type === "link" ? fixed ?? "4/3" : ratio, background: gradientFor(hexes) }}>
      {card.type === "link" && <span className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 text-white text-[11px] px-2 py-1">{card.source === "spotify" ? <Music size={12} aria-hidden /> : <Link2 size={12} aria-hidden />}{domainOf(card.url)}</span>}
    </div>
  );
}
export function domainOf(url?: string): string {
  if (!url) return "link";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "link"; }
}
