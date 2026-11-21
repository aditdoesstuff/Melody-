"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check, Eye, Heart, Pencil, Plus, RefreshCw, Share2, Undo2, X } from "lucide-react";
import type { Card, IdentityGuide, ShareSnapshot, Vote } from "@/lib/types";
import { useApp } from "@/lib/store";
import { INSPIRATION } from "@/lib/inspiration";
import { generateGuide } from "@/lib/identity";
import { inkOn, isHex, normHex } from "@/lib/palette";
import { prettyDate } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import CardVisual, { altFor } from "@/components/CardVisual";
import Logo from "@/components/Logo";
import ShareSheet from "@/components/ShareSheet";
import { toast } from "@/components/Toast";

const MIN_YES = 5;
const ROLES = ["Primary", "Secondary", "Accent", "Neutral", "Neutral", "Neutral"];
const votable = (c: Card) => c.type !== "file" && c.tagStatus === "done";

export default function Identity() {
  const s = useApp();
  const [tab, setTab] = useState<"sort" | "guide">(s.guide ? "guide" : "sort");
  const [usePool, setUsePool] = useState(false);
  const [history, setHistory] = useState<{ id: string; pool: boolean; prev?: Vote }[]>([]);

  const scoped = useMemo(() => s.cards.filter((c) => votable(c) && (s.view === "family" || c.addedBy !== "family")), [s.cards, s.view]);
  const thin = scoped.length < 24;
  const pool = useMemo(() => INSPIRATION.map((c) => ({ ...c, identityVote: s.poolVotes[c.id] })), [s.poolVotes]);
  const queue = useMemo(() => [...scoped.filter((c) => !c.identityVote), ...(thin || usePool ? pool.filter((c) => !c.identityVote) : [])], [scoped, pool, thin, usePool]);
  const voted = useMemo(() => [...s.cards.filter((c) => c.identityVote), ...pool.filter((c) => c.identityVote)], [s.cards, pool]);
  const count = (v: Vote) => voted.filter((c) => c.identityVote === v).length;
  const yes = count("yes");

  const decide = useCallback((card: Card, v: Vote) => {
    const isPool = card.id.startsWith("pool-");
    setHistory((h) => [...h.slice(-30), { id: card.id, pool: isPool, prev: card.identityVote }]);
    if (isPool) useApp.getState().setPoolVote(card.id, v); else useApp.getState().setVote(card.id, v);
  }, []);
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    if (last.pool) s.setPoolVote(last.id, last.prev); else s.setVote(last.id, last.prev);
    setHistory((h) => h.slice(0, -1));
  };
  const build = () => {
    const st = useApp.getState();
    const all = [...st.cards, ...INSPIRATION.map((c) => ({ ...c, identityVote: st.poolVotes[c.id] }))];
    st.setGuide(generateGuide(all, st.themes, Date.now()));
    setTab("guide");
    toast("Your identity guide is ready.");
  };

  return (
    <div>
      <PageHeader title="Your identity" lede="Say yes to what is you, no to what is not. We turn that into one page you can hand to anyone." />
      <div role="tablist" aria-label="Identity steps" className="inline-flex rounded-full border border-tan p-1 mb-6">
        {([["sort", "1 · Keep or not"], ["guide", "2 · Your guide"]] as const).map(([v, label]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`rounded-full px-4 md:px-6 py-2 min-h-11 transition-colors ${tab === v ? "bg-cream text-ink-black font-semibold" : "text-muted"}`}>{label}</button>
        ))}
      </div>

      {tab === "sort" && (
        <div className="grid lg:grid-cols-[minmax(0,460px)_1fr] gap-8 items-start">
          <div>
            {queue.length ? <Swipe key={queue[0].id} card={queue[0]} onDecide={(v) => decide(queue[0], v)} />
              : (
                <div className="card card-tan p-8 text-center">
                  <p className="h-serif text-3xl">That is the whole pile.</p>
                  <p className="text-muted mt-2">{voted.length} sorted. {!usePool && !thin ? "Want a few more prompts to sharpen the picture?" : "Build your guide when you are ready."}</p>
                  {!usePool && !thin && <button className="btn mt-5" onClick={() => setUsePool(true)}><Plus size={16} aria-hidden />Add 40 inspiration prompts</button>}
                </div>
              )}
            <div className="flex items-center justify-between gap-3 mt-4 text-sm text-muted">
              <button className="btn btn-sm" onClick={undo} disabled={!history.length}><Undo2 size={14} aria-hidden />Undo</button>
              <span>{queue.length} left</span>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {([["yes", "Yes", "text-green-text"], ["maybe", "Maybe", "text-cream"], ["no", "Not for us", "text-orange"]] as const).map(([v, label, tone]) => (
                <div key={v} className="card p-4 text-center"><p className={`h-serif text-4xl ${tone}`}>{count(v)}</p><p className="text-xs text-muted mt-1">{label}</p></div>
              ))}
            </div>
            <div className="card card-tan p-5">
              <p className="font-medium">{yes >= MIN_YES ? "You have enough for a guide." : `${yes} of ${MIN_YES} yeses. A guide needs at least five.`}</p>
              <p className="text-sm text-muted mt-1">The more you sort, the sharper it gets. Your no pile matters as much as your yes pile.</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button className="btn btn-primary" disabled={yes < MIN_YES} onClick={build}>{s.guide ? "Rebuild our guide" : "Build our guide"}<ArrowRight size={16} aria-hidden /></button>
                {!usePool && !thin && queue.length > 0 && <button className="btn" onClick={() => setUsePool(true)}><Plus size={16} aria-hidden />More prompts</button>}
              </div>
            </div>
            {voted.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Sorted so far · tap to change your mind</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {voted.slice(0, 24).map((c) => (
                    <button key={c.id} onClick={() => (c.id.startsWith("pool-") ? s.setPoolVote(c.id, undefined) : s.setVote(c.id, undefined))} className="relative rounded-xl overflow-hidden border border-line" aria-label={`Put back: ${altFor(c)} (currently ${c.identityVote})`}>
                      <CardVisual card={c} fixed="1/1" className={c.identityVote === "no" ? "opacity-40" : ""} />
                      <span className={`absolute bottom-1 right-1 size-5 rounded-full grid place-items-center text-[10px] ${c.identityVote === "yes" ? "bg-green text-green-text" : c.identityVote === "no" ? "bg-pending text-cream" : "bg-cream text-ink-black"}`}>{c.identityVote === "yes" ? <Check size={11} aria-hidden /> : c.identityVote === "no" ? <X size={11} aria-hidden /> : "?"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "guide" && (s.guide ? <Guide guide={s.guide} onRebuild={build} canRebuild={yes >= MIN_YES} /> : (
        <div className="card card-tan p-8 md:p-12 text-center max-w-2xl">
          <p className="h-serif text-3xl">No guide yet.</p>
          <p className="text-muted mt-2">{yes >= MIN_YES ? "You have sorted enough. Build it now." : `Sort a few cards first. You need ${MIN_YES} yeses and have ${yes}.`}</p>
          <div className="mt-6">{yes >= MIN_YES ? <button className="btn btn-primary" onClick={build}>Build our guide</button> : <button className="btn btn-cream" onClick={() => setTab("sort")}>Start sorting</button>}</div>
        </div>
      ))}
    </div>
  );
}

function Swipe({ card, onDecide }: { card: Card; onDecide: (v: Vote) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const yesO = useTransform(x, [20, 120], [0, 1]);
  const noO = useTransform(x, [-120, -20], [1, 0]);
  const done = useRef(false);
  const go = useCallback((v: Vote) => {
    if (done.current) return;
    done.current = true;
    if (v === "maybe") { onDecide(v); return; }
    void animate(x, v === "yes" ? 560 : -560, { duration: 0.2 }).then(() => onDecide(v));
  }, [onDecide, x]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") go("yes"); else if (e.key === "ArrowLeft") go("no"); else if (e.key === "ArrowDown") { e.preventDefault(); go("maybe"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  return (
    <div>
      <motion.div style={{ x, rotate, touchAction: "pan-y" }} drag="x" dragSnapToOrigin dragElastic={0.7} onDragEnd={(_, i) => { if (i.offset.x > 110) go("yes"); else if (i.offset.x < -110) go("no"); }}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative card card-tan overflow-hidden cursor-grab active:cursor-grabbing select-none">
        <CardVisual card={card} fixed="4/5" />
        <div className="p-4">
          <p className="text-lg font-medium">{card.title ?? (card.type === "text" ? "A thought" : altFor(card))}</p>
          {card.note && <p className="text-sm text-muted mt-1">{card.note}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">{[...card.tags.themes, ...card.tags.mood].slice(0, 5).map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
        <motion.span style={{ opacity: yesO }} className="absolute top-5 left-5 chip chip-green !text-base -rotate-6">YES</motion.span>
        <motion.span style={{ opacity: noO }} className="absolute top-5 right-5 chip chip-pending !text-base rotate-6">NOT FOR US</motion.span>
      </motion.div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <button className="btn min-h-14" onClick={() => go("no")}><X size={18} aria-hidden />Not for us</button>
        <button className="btn min-h-14" onClick={() => go("maybe")}>Maybe</button>
        <button className="btn btn-primary min-h-14" onClick={() => go("yes")}><Heart size={18} aria-hidden />Yes</button>
      </div>
      <p className="text-xs text-muted text-center mt-3 hidden md:block">Swipe, or use the arrow keys: right is yes, left is no, down is maybe.</p>
    </div>
  );
}

function Guide({ guide, onRebuild, canRebuild }: { guide: IdentityGuide; onRebuild: () => void; canRebuild: boolean }) {
  const s = useApp();
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const sheet = useRef<HTMLDivElement>(null);
  const patch = (p: Partial<IdentityGuide>) => s.setGuide({ ...guide, ...p });
  const find = (id: string) => s.cards.find((c) => c.id === id) ?? INSPIRATION.find((c) => c.id === id);
  const hero = guide.heroCardIds.map(find).filter((c): c is Card => !!c);
  const never = guide.neverCardIds.map(find).filter((c): c is Card => !!c);
  const themeNames = s.themes.length ? s.themes.map((t) => t.name) : guide.themeNames;
  const when = [prettyDate(s.date), s.location].filter(Boolean).join(" · ");
  const snapshot: ShareSnapshot = { k: "identity", n: s.names, s: guide.statement, p: guide.palette, t: guide.tones, dos: guide.dos, donts: guide.donts, th: themeNames };
  const section = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="btn btn-primary" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden />Share</button>
        <button className={`btn ${editing ? "btn-cream" : ""}`} aria-pressed={editing} onClick={() => setEditing((e) => !e)}><Pencil size={16} aria-hidden />{editing ? "Done editing" : "Edit"}</button>
        <button className="btn" disabled={!canRebuild} onClick={onRebuild} title="Rebuild from your latest yes and no piles. Replaces any edits."><RefreshCw size={16} aria-hidden />Rebuild</button>
        <Link href="/invites" className="btn">Next: invites<ArrowRight size={16} aria-hidden /></Link>
      </div>

      <div ref={sheet} className="rounded-[28px] border border-tan overflow-hidden bg-bg max-w-5xl">
        <motion.header {...section} className="bg-wine px-6 md:px-12 py-10 md:py-14">
          <div className="flex items-start justify-between gap-6">
            <div><p className="eyebrow !text-cream/80">Wedding identity guide</p><h2 className="h-display text-5xl md:text-7xl mt-3">{s.names[0]} &amp; {s.names[1]}</h2>{when && <p className="mt-3 text-cream">{when}</p>}</div>
            <Logo tagline={false} width={96} className="shrink-0 mt-1" />
          </div>
          {editing ? <><label className="sr-only" htmlFor="stmt">Identity statement</label><textarea id="stmt" className="field mt-8 !bg-black/25 font-serif !text-xl" value={guide.statement} onChange={(e) => patch({ statement: e.target.value })} /></>
            : <p className="font-serif text-peach text-2xl md:text-[2.1rem] leading-snug mt-8 max-w-3xl">“{guide.statement}”</p>}
        </motion.header>

        <div className="px-6 md:px-12 py-10 space-y-12">
          <motion.section {...section} transition={{ delay: 0.1 }} aria-labelledby="g-pal">
            <h3 id="g-pal" className="eyebrow mb-4">Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {guide.palette.map((sw, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-line">
                  <div className="h-28 p-3 flex items-end" style={{ background: sw.hex, color: inkOn(sw.hex) }}><span className="text-[11px] uppercase tracking-widest">{ROLES[i] ?? "Neutral"}</span></div>
                  <div className="p-3 bg-surface">
                    {editing ? (
                      <div className="space-y-1.5">
                        <label className="sr-only" htmlFor={`pn-${i}`}>Colour {i + 1} name</label>
                        <input id={`pn-${i}`} className="field field-sm" value={sw.name} onChange={(e) => patch({ palette: guide.palette.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                        <label className="sr-only" htmlFor={`ph-${i}`}>Colour {i + 1} hex</label>
                        <input id={`ph-${i}`} type="color" value={sw.hex} onChange={(e) => patch({ palette: guide.palette.map((x, k) => (k === i && isHex(e.target.value) ? { ...x, hex: normHex(e.target.value) } : x)) })} className="w-full h-9 rounded-full bg-transparent" />
                      </div>
                    ) : <><p className="font-medium">{sw.name}</p><p className="text-xs text-muted font-mono uppercase">{sw.hex}</p></>}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section {...section} transition={{ delay: 0.18 }} aria-labelledby="g-tone">
            <h3 id="g-tone" className="eyebrow mb-4">How it should feel</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {guide.tones.map((t, i) => (
                <div key={i} className="card p-5">
                  {editing ? (
                    <div className="space-y-2">
                      <label className="sr-only" htmlFor={`tw-${i}`}>Tone word {i + 1}</label>
                      <input id={`tw-${i}`} className="field field-sm font-serif" value={t.word} onChange={(e) => patch({ tones: guide.tones.map((x, k) => (k === i ? { ...x, word: e.target.value } : x)) })} />
                      <label className="sr-only" htmlFor={`tl-${i}`}>What {t.word} means</label>
                      <textarea id={`tl-${i}`} className="field !min-h-[80px] text-sm" value={t.line} onChange={(e) => patch({ tones: guide.tones.map((x, k) => (k === i ? { ...x, line: e.target.value } : x)) })} />
                    </div>
                  ) : <><p className="h-serif text-3xl capitalize">{t.word}</p><p className="text-muted mt-2 leading-relaxed">{t.line}</p></>}
                </div>
              ))}
            </div>
            {themeNames.length > 0 && <p className="mt-5 text-muted">Our themes: {themeNames.map((n, i) => <span key={n} className="text-peach font-serif text-lg">{i > 0 && <span className="text-muted"> · </span>}{n}</span>)}</p>}
          </motion.section>

          <motion.section {...section} transition={{ delay: 0.26 }} className="grid md:grid-cols-2 gap-6">
            <ListBlock title="Do" tone="green" items={guide.dos} editing={editing} onChange={(dos) => patch({ dos })} />
            <ListBlock title="Don't" tone="wine" items={guide.donts} editing={editing} onChange={(donts) => patch({ donts })} />
          </motion.section>

          {hero.length > 0 && (
            <motion.section {...section} transition={{ delay: 0.34 }} aria-labelledby="g-hero">
              <h3 id="g-hero" className="eyebrow mb-4">This is us</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {hero.slice(0, hero.length >= 9 ? 9 : hero.length).map((c, i) => <div key={c.id} className={`rounded-2xl overflow-hidden border border-line ${i === 0 ? "col-span-2 row-span-2" : ""}`}><CardVisual card={c} fixed="1/1" className="h-full" /></div>)}
              </div>
            </motion.section>
          )}

          {never.length > 0 && (
            <motion.section {...section} transition={{ delay: 0.4 }} aria-labelledby="g-never">
              <h3 id="g-never" className="eyebrow mb-1">The never board</h3>
              <p className="text-sm text-muted mb-4">Looked at it. Said no. Blurred to be kind; tap one to see it.</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {never.map((c) => {
                  const open = revealed.has(c.id);
                  return (
                    <button key={c.id} onClick={() => setRevealed((r) => { const n = new Set(r); if (open) n.delete(c.id); else n.add(c.id); return n; })} aria-pressed={open} aria-label={open ? `Hide ${c.title ?? "card"}` : "Reveal a card you said no to"} className="relative rounded-xl overflow-hidden border border-line">
                      <CardVisual card={c} fixed="1/1" className={`transition-[filter] duration-300 ${open ? "" : "blur-md saturate-50 scale-110"}`} />
                      {!open && <span className="absolute inset-0 grid place-items-center text-cream"><Eye size={16} aria-hidden /></span>}
                      {open && <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] p-1 truncate">{c.title}</span>}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}
          <p className="text-xs text-muted text-center pt-2">Made by {s.names[0]} &amp; {s.names[1]} on aaroh · Your love story, your way</p>
        </div>
      </div>

      {sharing && <ShareSheet title={`${s.names[0]} & ${s.names[1]}: our wedding identity`} snapshot={snapshot} target={sheet} fileName="aaroh-identity-guide" onClose={() => setSharing(false)} />}
    </div>
  );
}

function ListBlock({ title, tone, items, editing, onChange }: { title: string; tone: "green" | "wine"; items: string[]; editing: boolean; onChange: (x: string[]) => void }) {
  return (
    <div className="card p-5 md:p-6">
      <h3 className="h-serif text-3xl mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((d, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className={`size-6 rounded-full grid place-items-center shrink-0 mt-0.5 ${tone === "green" ? "bg-green text-green-text" : "bg-wine text-white"}`}>{tone === "green" ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}</span>
            {editing ? (
              <span className="flex-1 flex gap-1.5">
                <input aria-label={`${title} item ${i + 1}`} className="field field-sm" value={d} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
                <button className="btn btn-ghost btn-icon !w-10 !min-h-10" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remove: ${d}`}><X size={15} aria-hidden /></button>
              </span>
            ) : <span className="leading-relaxed">{d}</span>}
          </li>
        ))}
      </ul>
      {editing && items.length < 8 && <button className="btn btn-sm mt-4" onClick={() => onChange([...items, ""])}><Plus size={14} aria-hidden />Add a line</button>}
      {!items.length && !editing && <p className="text-sm text-muted">Nothing here yet. Sort a few more cards, or add your own with Edit.</p>}
    </div>
  );
}
