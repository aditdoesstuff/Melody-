"use client";
import { useMemo } from "react";
import { ExternalLink, Pin, PinOff, Trash2 } from "lucide-react";
import type { Card, Category } from "@/lib/types";
import { useApp, whoName } from "@/lib/store";
import { cosine, vectorOf } from "@/lib/cluster";
import Modal from "./Modal";
import CardVisual, { altFor, domainOf } from "./CardVisual";
import TagEditor from "./TagEditor";
import { toast } from "./Toast";

const CATS: Category[] = ["decor", "outfit", "venue", "music", "food", "photography", "stationery", "beauty", "travel", "ritual", "other"];

export default function CardDrawer({ card, onClose, onOpen }: { card: Card; onClose: () => void; onOpen: (id: string) => void }) {
  const cards = useApp((s) => s.cards);
  const names = useApp((s) => s.names);
  const themes = useApp((s) => s.themes);
  const updateCard = useApp((s) => s.updateCard);
  const removeCards = useApp((s) => s.removeCards);
  const patchTags = (p: Partial<Card["tags"]>) => updateCard(card.id, { tags: { ...card.tags, ...p } });

  const similar = useMemo(() => {
    const v = vectorOf(card);
    return cards.filter((c) => c.id !== card.id).map((c) => ({ c, s: cosine(v, vectorOf(c)) })).filter((x) => x.s > 0.25).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.c);
  }, [card, cards]);
  const theme = themes.find((t) => t.cardIds.includes(card.id));

  return (
    <Modal onClose={onClose} wide title={card.title ?? card.fileName ?? (card.type === "text" ? "A thought" : "Card")}>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-line"><CardVisual card={card} /></div>
          <p className="text-xs text-muted">Added by {whoName(names, card.addedBy)} · {new Date(card.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{card.source ? ` · ${card.source}` : ""}{theme ? ` · in “${theme.name}”` : ""}</p>
          {card.url && <a href={card.url} target="_blank" rel="noreferrer noopener" className="btn btn-sm"><ExternalLink size={14} aria-hidden />Open on {domainOf(card.url)}</a>}
          {card.tags.colors.length > 0 && (
            <div><p className="eyebrow mb-1.5">Colours</p><div className="flex flex-wrap gap-2">{card.tags.colors.map((s) => <span key={s.hex} className="inline-flex items-center gap-1.5 text-xs"><span className="size-6 rounded-full border border-white/15" style={{ background: s.hex }} />{s.name}</span>)}</div></div>
          )}
        </div>

        <div className="space-y-4">
          {card.type !== "text" && card.type !== "file" && (
            <label className="block"><span className="eyebrow block mb-1.5">Title</span><input className="field field-sm" defaultValue={card.title ?? ""} key={card.id + "t"} onBlur={(e) => updateCard(card.id, { title: e.target.value.trim() || undefined })} placeholder={altFor(card)} /></label>
          )}
          {card.type === "text" && (
            <label className="block"><span className="eyebrow block mb-1.5">Your thought</span><textarea className="field" defaultValue={card.text ?? ""} key={card.id + "x"} onBlur={(e) => updateCard(card.id, { text: e.target.value })} /></label>
          )}
          {card.tagStatus === "pending" ? <p className="text-sm text-muted">Still working out the tags…</p> : (
            <>
              <TagEditor label="Themes" tags={card.tags.themes} onChange={(themes) => patchTags({ themes })} placeholder="theme" />
              <TagEditor label="Mood" tags={card.tags.mood} onChange={(mood) => patchTags({ mood })} placeholder="mood" />
              <TagEditor label="What is in it" tags={card.tags.objects} onChange={(objects) => patchTags({ objects })} placeholder="thing" />
              <label className="block"><span className="eyebrow block mb-1.5">Category</span>
                <select className="field field-sm capitalize" value={card.tags.category} onChange={(e) => patchTags({ category: e.target.value as Category })}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </label>
            </>
          )}
          {card.type !== "text" && (
            <label className="block"><span className="eyebrow block mb-1.5">Note</span><textarea className="field !min-h-[84px]" defaultValue={card.note ?? ""} key={card.id + "n"} onBlur={(e) => updateCard(card.id, { note: e.target.value.trim() || undefined })} placeholder="Why did you save this?" /></label>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button className={`btn btn-sm ${card.pinned ? "btn-cream" : ""}`} aria-pressed={!!card.pinned} onClick={() => { updateCard(card.id, { pinned: !card.pinned, identityVote: card.pinned ? card.identityVote : "yes" }); toast(card.pinned ? "Unpinned." : "Pinned to your identity guide."); }}>
              {card.pinned ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}{card.pinned ? "Unpin from guide" : "Pin to identity guide"}
            </button>
            <button className="btn btn-sm" onClick={() => { removeCards([card.id]); onClose(); toast("Card deleted."); }}><Trash2 size={14} aria-hidden />Delete</button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-7">
          <p className="eyebrow mb-2">Similar cards</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((c) => (
              <button key={c.id} onClick={() => onOpen(c.id)} className="card overflow-hidden text-left hover:border-tan" aria-label={`Open: ${altFor(c)}`}>
                <CardVisual card={c} fixed="4/3" />
                <p className="text-xs p-2 truncate">{c.title ?? c.text ?? c.fileName ?? c.tags.themes.join(", ")}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
