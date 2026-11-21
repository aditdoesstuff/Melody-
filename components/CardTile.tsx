"use client";
import { Check, Pin } from "lucide-react";
import type { Card } from "@/lib/types";
import CardVisual, { altFor } from "./CardVisual";

const WHO_DOT = { A: "bg-peach", B: "bg-orange", family: "bg-sage" } as const;

/** One card in the masonry grid. Shows a shimmer while tags are being worked out. */
export default function CardTile({ card, whoLabel, onOpen, selecting, selected, onToggle }: { card: Card; whoLabel: string; onOpen: () => void; selecting?: boolean; selected?: boolean; onToggle?: () => void }) {
  const tags = [...new Set([...card.tags.objects.slice(0, 1), ...card.tags.themes, ...card.tags.mood])].slice(0, 3);
  return (
    <button onClick={selecting ? onToggle : onOpen} aria-pressed={selecting ? !!selected : undefined} aria-label={`${selecting ? "Select" : "Open"}: ${altFor(card)}`}
      className={`card overflow-hidden text-left w-full block relative transition-[border-color,transform] hover:border-tan ${selected ? "!border-cream ring-2 ring-cream" : ""}`}>
      <CardVisual card={card} />
      <div className="p-3 space-y-2">
        {(card.title || card.fileName) && <p className="text-sm font-medium leading-tight break-words">{card.title ?? card.fileName}</p>}
        {card.tagStatus === "pending" ? (
          <div className="flex gap-1.5 items-center" aria-label="Tagging"><span className="shimmer h-5 w-14" /><span className="shimmer h-5 w-10" /><span className="text-[11px] text-muted">tagging…</span></div>
        ) : (
          tags.length > 0 && <div className="flex flex-wrap gap-1">{tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        )}
        <div className="flex items-center gap-1.5">
          {card.tags.colors.slice(0, 4).map((s) => <span key={s.hex} title={s.name} className="size-3.5 rounded-full border border-white/15" style={{ background: s.hex }} />)}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted"><span className={`size-1.5 rounded-full ${WHO_DOT[card.addedBy]}`} />{whoLabel}</span>
        </div>
      </div>
      {card.pinned && <span className="absolute top-2 right-2 size-7 rounded-full bg-wine text-white grid place-items-center" title="Pinned to your identity guide"><Pin size={13} aria-hidden /></span>}
      {selecting && <span className={`absolute top-2 left-2 size-6 rounded-full border grid place-items-center ${selected ? "bg-cream border-cream text-ink-black" : "bg-black/50 border-cream"}`}>{selected && <Check size={14} aria-hidden />}</span>}
    </button>
  );
}
