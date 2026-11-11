"use client";
import { useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { useApp } from "@/lib/store";
import { extractPalette, colourName } from "@/lib/palette";
import { suggestTags } from "@/lib/tagging";
import type { Item } from "@/lib/types";
import ItemCard from "@/components/ItemCard";

type Draft = Omit<Item, "id" | "createdAt" | "status">;

export default function Library() {
  const { items, view, addItem, updateItem, removeItem, activeOwner, setActiveOwner, names, marriageType } = useApp();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);

  const scoped = items.filter((i) => (view === "family" ? true : i.owner !== "family"));
  const mini = useMemo(() => {
    const m = new MiniSearch<{ id: string; title: string; text: string; tags: string; notes: string; colours: string }>({
      fields: ["title", "text", "tags", "notes", "colours"], storeFields: ["id"], searchOptions: { prefix: true, fuzzy: 0.2, boost: { tags: 2, title: 2 } },
    });
    m.addAll(scoped.map((i) => ({ id: i.id, title: i.title ?? "", text: i.text ?? "", tags: i.tags.join(" "), notes: i.notes ?? "", colours: i.palette.map(colourName).join(" ") })));
    return m;
  }, [scoped]);
  const shown = q.trim() ? mini.search(q).map((r) => scoped.find((i) => i.id === r.id)!).filter(Boolean) : scoped;
  const selected = items.find((i) => i.id === open);

  const readFile = (f: File) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });

  const onImage = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    const src = await readFile(f);
    const palette = await extractPalette(src);
    setDraft({ type: "image", src, title: f.name.replace(/\.[^.]+$/, ""), tags: suggestTags(f.name, palette), palette, owner: activeOwner, notes: "" });
    setBusy(false);
  };
  const onFile = (f?: File | null) => {
    if (!f) return;
    setDraft({ type: "file", fileName: f.name, title: f.name, tags: suggestTags(f.name), palette: [], owner: activeOwner, notes: "" });
  };
  const onNote = () => {
    if (!note.trim()) return;
    setDraft({ type: "note", text: note.trim(), tags: suggestTags(note), palette: [], owner: activeOwner, notes: "" });
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Library</p>
        <h1 className="h-serif text-3xl">Save it. We&apos;ll file it.</h1>
        <p className="text-muted text-sm mt-1">No folders. Tags and colours are added automatically — search by anything, even a colour.</p>
      </div>

      <section className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="eyebrow">Adding to</span>
          {(marriageType === "court" ? (["me", "partner"] as const) : (["me", "partner", "family"] as const)).map((o) => (
            <button key={o} onClick={() => setActiveOwner(o)} aria-pressed={activeOwner === o}
              className={`chip ${activeOwner === o ? "!bg-ink !text-bg" : ""}`}>{o === "me" ? names[0] : o === "partner" ? names[1] : "Family"}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button className="btn" onClick={() => camera.current?.click()}>📷 Capture</button>
          <button className="btn" onClick={() => gallery.current?.click()}>🖼 Gallery</button>
          <button className="btn" onClick={() => file.current?.click()}>📄 File</button>
          <button className="btn" onClick={() => document.getElementById("note-input")?.focus()}>✎ Note</button>
        </div>
        <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={file} type="file" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="flex gap-2">
          <input id="note-input" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onNote()}
            placeholder="Jot a thought: “no DJ, only live music”…" className="flex-1 card px-3 py-2.5 bg-card text-sm" />
          <button className="btn btn-primary" onClick={onNote}>Add</button>
        </div>
        {busy && <p className="text-sm text-muted">Reading colours…</p>}
      </section>

      {draft && (
        <section className="card p-4 space-y-3 border-accent" aria-label="Review before saving">
          <p className="eyebrow">Auto-tagged · edit if you like</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {draft.src && <img src={draft.src} alt="" className="max-h-56 rounded-xl" />}
          {draft.text && <p className="h-serif text-lg">{draft.text}</p>}
          {draft.fileName && <p className="text-sm">{draft.fileName}</p>}
          <div className="flex gap-1">{draft.palette.map((p) => <span key={p} className="size-6 rounded-full border border-black/10" style={{ background: p }} title={p} />)}</div>
          <TagEditor tags={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} />
          <input value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Add a note (optional)" className="w-full card px-3 py-2 bg-card text-sm" />
          <div className="flex gap-2">
            <button className="btn btn-accent" onClick={() => { addItem(draft); setDraft(null); }}>Add to share</button>
            <button className="btn" onClick={() => setDraft(null)}>Discard</button>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tags, notes, or colours — try “sage” or “candlelit”" aria-label="Search" className="flex-1 card px-4 py-3 bg-card" />
        <span className="text-xs text-muted whitespace-nowrap">{shown.length} items</span>
      </div>

      <div className="columns-2 md:columns-3 gap-3">
        {shown.map((i) => <ItemCard key={i.id} item={i} onClick={() => setOpen(i.id)} />)}
      </div>
      {shown.length === 0 && <p className="text-center text-muted py-10">Nothing yet. Add something above.</p>}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end md:place-items-center" onClick={() => setOpen(null)}>
          <div className="card w-full md:max-w-md p-5 space-y-3 rounded-b-none md:rounded-b-[20px] max-h-[85dvh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <ItemCard item={selected} compact />
            <TagEditor tags={selected.tags} onChange={(tags) => updateItem(selected.id, { tags })} />
            <input defaultValue={selected.notes} onBlur={(e) => updateItem(selected.id, { notes: e.target.value })} placeholder="Notes" className="w-full card px-3 py-2 bg-card text-sm" />
            <div className="flex gap-2"><button className="btn flex-1" onClick={() => setOpen(null)}>Close</button><button className="btn" onClick={() => { removeItem(selected.id); setOpen(null); }}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim().toLowerCase(); if (t && !tags.includes(t)) onChange([...tags, t]); setV(""); };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((t) => <button key={t} className="chip" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>{t} ×</button>)}
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="+ tag" className="text-sm bg-transparent px-2 py-1 w-20 outline-none" />
    </div>
  );
}
