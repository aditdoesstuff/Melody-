"use client";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { mergeDiagnostic, familyConflicts } from "@/lib/merge";
import ItemCard from "@/components/ItemCard";

export default function Diagnostic() {
  const { items, names, view, marriageType } = useApp();
  const m = useMemo(() => mergeDiagnostic(items), [items]);
  const fc = useMemo(() => familyConflicts(items), [items]);
  const r = 70;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Merge diagnostic</p>
        <h1 className="h-serif text-3xl">{m.headline}</h1>
        <p className="text-muted text-sm mt-1">Not a negotiation — a picture of what you already share.</p>
      </div>

      <section className="card p-6 grid md:grid-cols-2 gap-6 items-center">
        <div className="relative mx-auto" style={{ width: 260, height: 170 }} aria-label={`${m.score}% shared identity`}>
          <div className="absolute rounded-full border-2 border-accent/60 bg-accent/15" style={{ width: r * 2, height: r * 2, left: 20, top: 15 }} />
          <div className="absolute rounded-full border-2 border-sage bg-sage/20" style={{ width: r * 2, height: r * 2, right: 20, top: 15 }} />
          <div className="absolute inset-0 grid place-items-center"><p className="h-serif text-4xl">{m.score}%</p></div>
          <span className="absolute left-3 bottom-0 text-xs font-semibold">{names[0]}</span>
          <span className="absolute right-3 bottom-0 text-xs font-semibold">{names[1]}</span>
        </div>
        <div className="space-y-4">
          <div><p className="eyebrow mb-2">You both love</p><div className="flex flex-wrap gap-1.5">{m.shared.length ? m.shared.map((t) => <span key={t} className="chip">{t}</span>) : <span className="text-sm text-muted">Add more to compare</span>}</div></div>
          {m.sharedColours.length > 0 && <div><p className="eyebrow mb-2">Shared colours</p><div className="flex flex-wrap gap-1.5">{m.sharedColours.map((t) => <span key={t} className="chip !bg-sage/25 !text-ink">{t}</span>)}</div></div>}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="card p-4"><p className="eyebrow mb-2">Just {names[0]}</p><div className="flex flex-wrap gap-1.5">{m.onlyMe.map((t) => <span key={t} className="chip">{t}</span>)}</div></div>
        <div className="card p-4"><p className="eyebrow mb-2">Just {names[1]}</p><div className="flex flex-wrap gap-1.5">{m.onlyPartner.map((t) => <span key={t} className="chip">{t}</span>)}</div></div>
      </section>
      <p className="text-sm text-muted -mt-4">These aren&apos;t conflicts. They&apos;re the places to leave room for each other.</p>

      {marriageType !== "court" && (
        <section className="space-y-3">
          <div>
            <p className="eyebrow">Family lens {view === "family" ? "" : "· switch to “Family” above to see their picks in your library"}</p>
            <h2 className="h-serif text-2xl">Where family&apos;s ideas meet yours</h2>
          </div>
          {fc.aligned.length + fc.diverging.length === 0 ? <p className="text-sm text-muted">No family ideas added yet.</p> : (
            <div className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm font-semibold mb-2 text-sage">Already aligned ({fc.aligned.length})</p><div className="columns-2 gap-3">{fc.aligned.map((i) => <ItemCard key={i.id} item={i} compact />)}</div></div>
              <div><p className="text-sm font-semibold mb-2 text-accent">Worth a conversation ({fc.diverging.length})</p><div className="columns-2 gap-3">{fc.diverging.map((i) => <ItemCard key={i.id} item={i} compact />)}</div></div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
