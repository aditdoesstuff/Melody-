"use client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, Lock, LockOpen, Pencil, RefreshCw, Share2, SlidersHorizontal } from "lucide-react";
import type { ShareSnapshot, Theme } from "@/lib/types";
import { useApp, whoName } from "@/lib/store";
import { clusterCards } from "@/lib/cluster";
import { familyConflicts, mergeDiagnostic, themeSplit } from "@/lib/merge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import CardVisual, { altFor } from "@/components/CardVisual";
import Analysing from "@/components/Analysing";
import ShareSheet from "@/components/ShareSheet";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";

const MIN = 12;

export default function Diagnostic() {
  const s = useApp();
  const { cards, themes, names } = s;
  const [running, setRunning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const board = useRef<HTMLDivElement>(null);

  const real = cards.filter((c) => !c.sample);
  const merge = useMemo(() => mergeDiagnostic(cards), [cards]);
  const family = useMemo(() => familyConflicts(cards), [cards]);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const fresh = s.themesStamp ? cards.length - s.themesStamp.count : 0;

  const finish = useCallback(() => {
    const st = useApp.getState();
    const next = clusterCards(st.cards, st.themes.filter((t) => t.locked));
    st.setThemes(next, Date.now());
    setRunning(false);
    toast(next.length ? `Found ${next.length} theme${next.length > 1 ? "s" : ""}.` : "Not enough tagged cards to group yet.", next.length ? "ok" : "warn");
  }, []);

  const snapshot: ShareSnapshot = { k: "themes", n: names, t: themes.map((t) => ({ name: t.name, d: t.description, p: t.palette, g: t.topTags, pct: t.pct })) };
  const editTheme = themes.find((t) => t.id === editing);

  if (real.length < MIN && !themes.length) {
    return (
      <div>
        <PageHeader title="Your themes" lede="Once there is enough in your space, we show you what keeps repeating." />
        <EmptyState title={`${real.length} of ${MIN} cards.`} body="Themes need a little material to work with. Add a few more, or load the demo couple from Settings.">
          <Link href="/space" className="btn btn-cream">Add to your space</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Your themes" lede={themes.length ? `${cards.length} saved ideas. ${themes.length} thing${themes.length > 1 ? "s" : ""} you two keep coming back to.` : "Everything you saved, grouped by what it has in common."}>
        <button className={`btn ${themes.length ? "" : "btn-primary"}`} onClick={() => setRunning(true)}><RefreshCw size={16} aria-hidden />{themes.length ? "Re-run" : "Find our themes"}</button>
        {themes.length > 0 && <button className="btn" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden />Share</button>}
        {themes.length > 0 && <Link href="/priorities" className="btn btn-primary">Next: rank what matters<ArrowRight size={16} aria-hidden /></Link>}
      </PageHeader>

      {themes.length > 0 && fresh >= 8 && (
        <div className="card card-tan p-4 mb-6 flex flex-wrap items-center gap-3" role="status">
          <p className="flex-1">{fresh} new cards since these themes were made. Refresh them?</p>
          <button className="btn btn-sm btn-cream" onClick={() => setRunning(true)}>Refresh themes</button>
        </div>
      )}

      {!themes.length ? (
        <EmptyState title="Ready when you are." body={`${real.length} cards are tagged and waiting. This takes a few seconds and you can re-run it any time.`}>
          <button className="btn btn-primary" onClick={() => setRunning(true)}>Find our themes</button>
        </EmptyState>
      ) : (
        <>
          <div ref={board} className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {themes.map((t) => <ThemeCard key={t.id} theme={t} onEdit={() => setEditing(t.id)} />)}
          </div>

          {/* The "merge" in Merge Diagnostic */}
          <section className="mt-12" aria-labelledby="merge-h">
            <p className="eyebrow mb-2">Where you two meet</p>
            <h2 id="merge-h" className="h-serif text-3xl md:text-4xl">{merge.headline}</h2>
            <div className="grid lg:grid-cols-[300px_1fr] gap-4 mt-5">
              <div className="card card-tan p-6 grid place-items-center">
                <div className="relative" style={{ width: 240, height: 150 }} role="img" aria-label={`${merge.score}% shared taste between ${names[0]} and ${names[1]}`}>
                  <div className="absolute rounded-full border border-peach bg-peach/15" style={{ width: 140, height: 140, left: 10, top: 5 }} />
                  <div className="absolute rounded-full border border-orange bg-orange/20" style={{ width: 140, height: 140, right: 10, top: 5 }} />
                  <p className="absolute inset-0 grid place-items-center h-serif text-4xl">{merge.score}%</p>
                </div>
                <div className="flex justify-between w-full text-sm mt-2 px-2"><span>{names[0]}</span><span>{names[1]}</span></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Block title="You both love" tone="chip-green" items={merge.shared} empty="Add more from both of you to compare." />
                <Block title="Shared colours" tone="" items={merge.sharedColours} empty="No colours in common yet." />
                <Block title={`Only ${names[0]}`} tone="" items={merge.onlyA} empty="Nothing that is only yours." />
                <Block title={`Only ${names[1]}`} tone="chip-orange" items={merge.onlyB} empty="Nothing that is only theirs." />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {(["both", "A", "B", "family"] as const).filter((k) => k !== "family" || themes.some((t) => themeSplit(t, cards).kind === "family")).map((kind) => {
                const list = themes.filter((t) => themeSplit(t, cards).kind === kind);
                const label = kind === "both" ? "Themes you share" : kind === "family" ? "Mostly family" : `Mostly ${whoName(names, kind)}`;
                return (
                  <div key={kind} className="card p-4">
                    <p className="eyebrow mb-2">{label}</p>
                    {list.length ? <ul className="space-y-1">{list.map((t) => <li key={t.id} className="font-serif text-peach text-lg">{t.name}</li>)}</ul> : <p className="text-sm text-muted">None right now.</p>}
                  </div>
                );
              })}
            </div>
            {merge.compromise && (
              <div className="card card-tan p-5 mt-4">
                <p className="eyebrow mb-1">A way to meet in the middle</p>
                <p className="h-serif text-2xl">{merge.compromise.name}</p>
                <p className="text-muted mt-1">{merge.compromise.line}</p>
              </div>
            )}
            <p className="text-xs text-muted mt-3">Both sides come from this device. Use Settings → Switch to partner view to add cards as {names[1]}.</p>
          </section>

          {s.weddingType !== "court" && (family.aligned.length + family.diverging.length > 0) && (
            <section className="mt-12" aria-labelledby="fam-h">
              <p className="eyebrow mb-2">Family lens</p>
              <h2 id="fam-h" className="h-serif text-3xl">Where family&apos;s ideas meet yours</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-5">
                {([["Already aligned", family.aligned, "text-green-text"], ["Worth a conversation", family.diverging, "text-peach"]] as const).map(([label, list, tone]) => (
                  <div key={label} className="card p-4">
                    <p className={`font-medium mb-3 ${tone}`}>{label} ({list.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {list.slice(0, 6).map((c) => <div key={c.id} className="rounded-xl overflow-hidden border border-line"><CardVisual card={c} fixed="1/1" /><p className="text-[11px] p-1.5 truncate">{c.title}</p></div>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {running && <Analysing cards={cards} onDone={finish} />}
      {sharing && <ShareSheet title={`${names[0]} & ${names[1]}: our wedding themes`} snapshot={snapshot} target={board} fileName="aaroh-themes" onClose={() => setSharing(false)} />}
      {editTheme && (
        <Modal title={editTheme.name} onClose={() => setEditing(null)} wide>
          <p className="text-sm text-muted -mt-2 mb-4">Move a card if it landed in the wrong place. Lock the theme to keep it exactly like this on the next re-run.</p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {editTheme.cardIds.map((id) => byId.get(id)).filter((c) => !!c).map((c) => (
              <li key={c.id} className="card p-2 flex items-center gap-3">
                <div className="w-16 shrink-0 rounded-lg overflow-hidden"><CardVisual card={c} fixed="1/1" /></div>
                <p className="flex-1 text-sm min-w-0 truncate">{c.title ?? c.text ?? c.fileName ?? altFor(c)}</p>
                <label className="sr-only" htmlFor={`mv-${c.id}`}>Move {altFor(c)}</label>
                <select id={`mv-${c.id}`} className="field field-sm !w-36" value={editTheme.id} onChange={(e) => { s.moveCardToTheme(c.id, e.target.value || null); toast("Moved."); }}>
                  {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  <option value="">No theme</option>
                </select>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}

function Block({ title, items, tone, empty }: { title: string; items: string[]; tone: string; empty: string }) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-2">{title}</p>
      {items.length ? <div className="flex flex-wrap gap-1.5">{items.map((t) => <span key={t} className={`chip ${tone}`}>{t}</span>)}</div> : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}

function ThemeCard({ theme, onEdit }: { theme: Theme; onEdit: () => void }) {
  const cards = useApp((s) => s.cards);
  const names = useApp((s) => s.names);
  const updateTheme = useApp((s) => s.updateTheme);
  const [renaming, setRenaming] = useState(false);
  const mine = theme.cardIds.map((id) => cards.find((c) => c.id === id)).filter((c) => !!c);
  const boardCards = [...mine].sort((a, b) => Number(b.type === "image") - Number(a.type === "image")).slice(0, 6);
  const split = themeSplit(theme, cards);
  const total = split.a + split.b + split.family || 1;

  return (
    <article className={`card p-5 flex flex-col gap-4 ${theme.locked ? "card-tan" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("name")?.toString().trim(); if (v) updateTheme(theme.id, { name: v }); setRenaming(false); }}>
              <label className="sr-only" htmlFor={`rn-${theme.id}`}>Theme name</label>
              <input id={`rn-${theme.id}`} name="name" autoFocus defaultValue={theme.name} onBlur={(e) => { const v = e.target.value.trim(); if (v) updateTheme(theme.id, { name: v }); setRenaming(false); }} className="field field-sm font-serif !text-xl" />
            </form>
          ) : <h3 className="h-serif text-[1.7rem]">{theme.name}</h3>}
          <p className="text-sm text-muted mt-1.5">{theme.description}</p>
        </div>
        <span className="h-serif text-3xl shrink-0" title={`${theme.pct}% of what you saved`}>{theme.pct}%</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
        {boardCards.map((c) => <div key={c.id} className="bg-surface-2 overflow-hidden"><CardVisual card={c} fixed="1/1" /></div>)}
      </div>

      <div className="flex gap-1.5" aria-label="Palette">{theme.palette.map((p) => <span key={p} title={p} className="h-8 flex-1 rounded-full border border-white/10" style={{ background: p }} />)}</div>
      <div className="flex flex-wrap gap-1.5">{theme.topTags.map((t) => <span key={t} className="chip">{t}</span>)}</div>

      <div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10" role="img" aria-label={`${split.a} from ${names[0]}, ${split.b} from ${names[1]}, ${split.family} from family`}>
          <span className="bg-peach" style={{ width: `${(split.a / total) * 100}%` }} /><span className="bg-orange" style={{ width: `${(split.b / total) * 100}%` }} /><span className="bg-sage" style={{ width: `${(split.family / total) * 100}%` }} />
        </div>
        <p className="text-xs text-muted mt-1.5">{theme.cardIds.length} cards · {names[0]} {split.a} · {names[1]} {split.b}{split.family ? ` · family ${split.family}` : ""}</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        <button className="btn btn-sm" onClick={() => setRenaming(true)}><Pencil size={13} aria-hidden />Rename</button>
        <button className="btn btn-sm" onClick={onEdit}><SlidersHorizontal size={13} aria-hidden />Move cards</button>
        <button className={`btn btn-sm ${theme.locked ? "btn-cream" : ""}`} aria-pressed={!!theme.locked} onClick={() => updateTheme(theme.id, { locked: !theme.locked })}>
          {theme.locked ? <Lock size={13} aria-hidden /> : <LockOpen size={13} aria-hidden />}{theme.locked ? "Locked" : "Lock"}
        </button>
      </div>
    </article>
  );
}
