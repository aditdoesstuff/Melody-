"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Shapes, Tag, Trash2, Upload, X } from "lucide-react";
import type { Card, CardType, Category, Source } from "@/lib/types";
import { useApp, whoName } from "@/lib/store";
import { buildIndex } from "@/lib/search";
import { isUntagged } from "@/lib/tagging";
import { addSmart, retagPending } from "@/lib/capture";
import PageHeader from "@/components/PageHeader";
import QuickAdd, { handleFiles } from "@/components/QuickAdd";
import CardTile from "@/components/CardTile";
import CardDrawer from "@/components/CardDrawer";
import EmptyState from "@/components/EmptyState";
import { toast } from "@/components/Toast";

const PAGE = 60;
const TYPE_LABEL: Record<CardType, string> = { image: "Images", link: "Links", text: "Thoughts", file: "Files", color: "Colours" };
const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export default function Space() {
  const cards = useApp((s) => s.cards);
  const names = useApp((s) => s.names);
  const view = useApp((s) => s.view);
  const themes = useApp((s) => s.themes);
  const loadDemo = useApp((s) => s.loadDemo);
  const removeCards = useApp((s) => s.removeCards);
  const updateCards = useApp((s) => s.updateCards);
  const moveCardToTheme = useApp((s) => s.moveCardToTheme);

  const [q, setQ] = useState("");
  const [type, setType] = useState<CardType | "">("");
  const [source, setSource] = useState<Source | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [colour, setColour] = useState("");
  const [untagged, setUntagged] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [dragging, setDragging] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => { retagPending(); }, []);

  const scoped = useMemo(() => cards.filter((c) => view === "family" || c.addedBy !== "family"), [cards, view]);
  const who = useMemo(() => ({ A: names[0], B: names[1], family: "family" }), [names]);
  const index = useMemo(() => buildIndex(scoped, who), [scoped, who]);
  const byId = useMemo(() => new Map(scoped.map((c) => [c.id, c])), [scoped]);

  const shown = useMemo(() => {
    const ids = q.trim() ? index.search(q) : scoped.map((c) => c.id);
    return ids.map((id) => byId.get(id)).filter((c): c is Card => !!c).filter((c) =>
      (!type || c.type === type) && (!source || c.source === source) && (!category || c.tags.category === category) &&
      (!colour || c.tags.colors.some((s) => s.name === colour)) && (!untagged || (c.tagStatus === "done" && isUntagged(c.tags))));
  }, [q, index, scoped, byId, type, source, category, colour, untagged]);

  const filtering = !!(q.trim() || type || source || category || colour || untagged);
  const clear = () => { setQ(""); setType(""); setSource(""); setCategory(""); setColour(""); setUntagged(false); };
  /* eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging when the result set changes */
  useEffect(() => { setLimit(PAGE); }, [q, type, source, category, colour, untagged]);

  // Large boards render in pages as you scroll, so 500 cards stay as quick as 50.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((l) => l + PAGE); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown.length]);

  // Paste anywhere: images become cards, text becomes a link, swatch or thought.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length) { e.preventDefault(); void handleFiles(files); return; }
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const text = e.clipboardData?.getData("text") ?? "";
      const kind = addSmart(text);
      if (kind) toast(kind === "link" ? "Link pasted in." : kind === "color" ? "Colour pasted in." : "Thought pasted in.");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Drop anywhere on the page.
  useEffect(() => {
    let depth = 0;
    const has = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].some((t) => t === "Files" || t === "text/uri-list");
    const enter = (e: DragEvent) => { if (has(e)) { depth++; setDragging(true); } };
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    const over = (e: DragEvent) => { if (has(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!has(e)) return;
      e.preventDefault(); depth = 0; setDragging(false);
      const files = [...(e.dataTransfer?.files ?? [])];
      if (files.length) void handleFiles(files);
      else { const url = e.dataTransfer?.getData("text/uri-list") || e.dataTransfer?.getData("text") || ""; if (addSmart(url)) toast("Link saved."); }
    };
    window.addEventListener("dragenter", enter); window.addEventListener("dragleave", leave); window.addEventListener("dragover", over); window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragenter", enter); window.removeEventListener("dragleave", leave); window.removeEventListener("dragover", over); window.removeEventListener("drop", drop); };
  }, []);

  const toggle = useCallback((id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const endSelect = () => { setSelecting(false); setSelected(new Set()); setBulkTag(""); };
  const ids = [...selected];
  const applyTag = () => {
    const t = bulkTag.trim().toLowerCase();
    if (!t || !ids.length) return;
    updateCards(ids, (c) => ({ tags: { ...c.tags, themes: c.tags.themes.includes(t) ? c.tags.themes : [...c.tags.themes, t] } }));
    toast(`Tagged ${ids.length} card${ids.length > 1 ? "s" : ""} “${t}”.`);
    setBulkTag("");
  };

  const real = cards.filter((c) => !c.sample).length;
  const selectedCard = open ? cards.find((c) => c.id === open) : undefined;
  const opts = {
    types: uniq(scoped.map((c) => c.type)),
    sources: uniq(scoped.map((c) => c.source).filter((s): s is Source => !!s)),
    categories: uniq(scoped.map((c) => c.tags.category)).filter((c) => c !== "other"),
    colours: uniq(scoped.flatMap((c) => c.tags.colors.map((s) => s.name))).sort(),
  };

  return (
    <div>
      <PageHeader title="Your space" lede="Dump everything here. Screenshots, links, half-thoughts. We tag it, you find it." />
      <QuickAdd />

      <div className="sticky top-14 z-20 -mx-4 md:-mx-10 px-4 md:px-10 py-3 mt-4 bg-bg/90 backdrop-blur-md space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="space-search" className="sr-only">Search your space</label>
            <input id="space-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="field !pl-11" placeholder="Search anything: warm outdoor evening, lehenga, from instagram…" />
          </div>
          <button className={`btn shrink-0 ${selecting ? "btn-cream" : ""}`} aria-pressed={selecting} onClick={() => (selecting ? endSelect() : setSelecting(true))}>{selecting ? "Done" : "Select"}</button>
        </div>
        <div className="flex items-center gap-2 scroll-x pb-1">
          <Pick label="Type" value={type} onChange={(v) => setType(v as CardType | "")} options={opts.types.map((t) => [t, TYPE_LABEL[t]])} />
          <Pick label="Source" value={source} onChange={(v) => setSource(v as Source | "")} options={opts.sources.map((s) => [s, s])} />
          <Pick label="Category" value={category} onChange={(v) => setCategory(v as Category | "")} options={opts.categories.map((c) => [c, c])} />
          <Pick label="Colour" value={colour} onChange={setColour} options={opts.colours.map((c) => [c, c])} />
          <button className="chip" aria-pressed={untagged} onClick={() => setUntagged((u) => !u)}>Untagged</button>
          <span className="text-xs text-muted whitespace-nowrap ml-auto pl-2" aria-live="polite">{filtering ? `${shown.length} of ${scoped.length}` : `${scoped.length} card${scoped.length === 1 ? "" : "s"}`}</span>
          {filtering && <button className="chip chip-outline" onClick={clear}><X size={12} aria-hidden />Clear</button>}
        </div>
      </div>

      {selecting && (
        <div className="card card-tan p-3 mb-4 flex flex-wrap items-center gap-2" role="region" aria-label="Bulk actions">
          <span className="text-sm mr-1">{ids.length} selected</span>
          <button className="btn btn-sm" onClick={() => setSelected(new Set(shown.map((c) => c.id)))}>Select all {shown.length}</button>
          <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); applyTag(); }}>
            <label className="sr-only" htmlFor="bulk-tag">Tag to add</label>
            <input id="bulk-tag" className="field field-sm !w-36" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} placeholder="add a tag" />
            <button className="btn btn-sm" type="submit" disabled={!ids.length || !bulkTag.trim()}><Tag size={14} aria-hidden />Tag</button>
          </form>
          {themes.length > 0 && (
            <>
              <label className="sr-only" htmlFor="bulk-theme">Move to theme</label>
              <select id="bulk-theme" className="field field-sm !w-auto" value="" disabled={!ids.length}
                onChange={(e) => { const t = themes.find((x) => x.id === e.target.value); if (!t) return; ids.forEach((id) => moveCardToTheme(id, t.id)); toast(`Moved ${ids.length} to “${t.name}”.`); }}>
                <option value="">Move to theme…</option>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </>
          )}
          <button className="btn btn-sm" disabled={!ids.length} onClick={() => { removeCards(ids); toast(`${ids.length} deleted.`); endSelect(); }}><Trash2 size={14} aria-hidden />Delete</button>
        </div>
      )}

      {scoped.length === 0 ? (
        <EmptyState title="Nothing here yet." body="Drop a screenshot, paste a link, or type a thought. Or see how it all works with a ready-made couple.">
          <button className="btn btn-cream" onClick={() => { loadDemo(Date.now()); toast("Demo couple loaded: 60 cards."); }}>Load demo couple</button>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title="Nothing matches that." body="Try fewer words, or a colour, a mood, or where it came from."><button className="btn" onClick={clear}>Clear search</button></EmptyState>
      ) : (
        <div className="masonry">
          <AnimatePresence initial={false}>
            {shown.slice(0, limit).map((c) => (
              <motion.div key={c.id} layout="position" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                <CardTile card={c} whoLabel={whoName(names, c.addedBy)} onOpen={() => setOpen(c.id)} selecting={selecting} selected={selected.has(c.id)} onToggle={() => toggle(c.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <div ref={sentinel} aria-hidden className="h-1" />

      {scoped.length > 0 && (
        <div className="card card-tan mt-8 p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <p className="font-medium">{real >= 12 ? "Enough here to find your themes." : `${real} of 12 cards. Themes unlock at twelve.`}</p>
            <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={12} aria-valuenow={Math.min(real, 12)} aria-label="Cards towards themes"><div className="h-full bg-cream transition-all" style={{ width: `${Math.min(100, (real / 12) * 100)}%` }} /></div>
          </div>
          {real >= 12 ? <Link href="/diagnostic" className="btn btn-primary"><Shapes size={16} aria-hidden />Find our themes</Link>
            : <button className="btn" onClick={() => { loadDemo(Date.now()); toast("Demo couple loaded: 60 cards."); }}>Load demo couple</button>}
        </div>
      )}

      <AnimatePresence>
        {dragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-wine/80 grid place-items-center pointer-events-none">
            <div className="text-center"><Upload size={44} className="mx-auto text-peach" aria-hidden /><p className="h-serif text-4xl mt-3">Drop it in.</p></div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{selectedCard && <CardDrawer key="drawer" card={selectedCard} onClose={() => setOpen(null)} onOpen={setOpen} />}</AnimatePresence>
    </div>
  );
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  if (!options.length) return null;
  return (
    <label className="shrink-0">
      <span className="sr-only">Filter by {label.toLowerCase()}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`field field-sm !w-auto capitalize !min-h-[34px] !py-1 ${value ? "!border-cream" : ""}`}>
        <option value="">{label}</option>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}
