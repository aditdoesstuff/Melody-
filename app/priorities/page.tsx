"use client";
import Link from "next/link";
import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { BudgetCategory, Persona, Tier } from "@/lib/types";
import { allCategories, effectiveOrder, effectiveTiers, useApp } from "@/lib/store";
import { rankToWeights } from "@/lib/budget";
import { isDisagreement, mergeRankings, move } from "@/lib/ranking";
import PageHeader from "@/components/PageHeader";
import CatIcon from "@/components/CatIcon";
import { toast } from "@/components/Toast";

const TIERS: { v: Tier; t: string }[] = [{ v: "must", t: "Must-have" }, { v: "nice", t: "Nice-to-have" }, { v: "skip", t: "Skip" }];
type Tab = Persona | "merged";

export default function Priorities() {
  const s = useApp();
  const [tab, setTab] = useState<Tab>(s.persona);
  const [custom, setCustom] = useState("");
  const cats = allCategories(s);
  const cat = (id: string) => cats.find((c) => c.id === id);
  const order = effectiveOrder(s);
  const weights = rankToWeights(order, effectiveTiers(s));
  const top3 = order.slice(0, 3);
  const both = s.ranked.A && s.ranked.B;

  return (
    <div className="max-w-4xl">
      <PageHeader title="What matters most" lede="Rank it before you price it. The top of the list gets the biggest share of the budget.">
        <Link href="/budget" className="btn btn-primary">Next: see the budget<ArrowRight size={16} aria-hidden /></Link>
      </PageHeader>

      <div role="tablist" aria-label="Whose ranking" className="inline-flex rounded-full border border-tan p-1 mb-3">
        {([["A", s.names[0]], ["B", s.names[1]], ["merged", "Merged"]] as [Tab, string][]).map(([v, label]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`rounded-full px-4 md:px-6 py-2 min-h-11 text-sm md:text-base transition-colors ${tab === v ? "bg-cream text-ink-black font-semibold" : "text-muted"}`}>
            {label}{v !== "merged" && s.ranked[v] ? " ✓" : ""}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted mb-5">{tab === "merged" ? "Where your two lists disagree, and a fair middle. You can override any position." : `Each of you ranks on your own, then compare in Merged. Both lists live on this device.`}</p>

      {tab !== "merged" ? (
        <>
          <RankList who={tab} cats={cats} />
          <form className="flex gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); if (!custom.trim()) return; s.addCategory(custom); toast(`Added “${custom.trim()}”.`); setCustom(""); }}>
            <label className="sr-only" htmlFor="new-cat">Add your own category</label>
            <input id="new-cat" className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own, like Pet care or Charity" maxLength={40} />
            <button className="btn shrink-0" type="submit" disabled={!custom.trim()}><Plus size={16} aria-hidden />Add</button>
          </form>
        </>
      ) : (
        <Merged cats={cats} />
      )}

      <aside className="card card-tan p-5 mt-6" aria-live="polite">
        <p className="eyebrow mb-2">This will shape your budget</p>
        <p className="text-lg">
          {top3.map((id, i) => <span key={id}>{i > 0 && (i === top3.length - 1 ? " and " : ", ")}<strong className="text-peach font-medium">{cat(id)?.name}</strong> {weights[id]}%</span>)} get the most, based on {both ? "both your rankings" : s.ranked.A || s.ranked.B ? "the ranking so far" : "the starting order. Drag to make it yours"}.
        </p>
      </aside>
    </div>
  );
}

function RankList({ who, cats }: { who: Persona; cats: BudgetCategory[] }) {
  const order = useApp((s) => s.rankings[who].order);
  const tiers = useApp((s) => s.rankings[who].tiers);
  const setOrder = useApp((s) => s.setOrder);
  const setTier = useApp((s) => s.setTier);
  const removeCategory = useApp((s) => s.removeCategory);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setOrder(who, arrayMove(order, order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id))));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {order.map((id, i) => {
            const c = cats.find((x) => x.id === id);
            if (!c) return null;
            return <Row key={id} cat={c} rank={i + 1} last={i === order.length - 1} tier={tiers[id] ?? "must"}
              onMove={(d) => setOrder(who, move(order, i, i + d))} onTier={(t) => setTier(who, id, t)} onRemove={c.custom ? () => { removeCategory(id); toast(`Removed “${c.name}”.`); } : undefined} />;
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({ cat, rank, last, tier, onMove, onTier, onRemove }: { cat: BudgetCategory; rank: number; last: boolean; tier: Tier; onMove: (d: 1 | -1) => void; onTier: (t: Tier) => void; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card p-3 md:p-4 flex flex-wrap items-center gap-x-3 gap-y-2 ${isDragging ? "!border-cream shadow-2xl relative z-10" : ""} ${tier === "skip" ? "opacity-55" : ""}`}>
      <button {...attributes} {...listeners} aria-label={`Drag ${cat.name}. Currently number ${rank}. Press space, then the arrow keys.`} className="touch-none cursor-grab active:cursor-grabbing size-11 grid place-items-center rounded-full text-muted hover:text-cream shrink-0"><GripVertical size={20} aria-hidden /></button>
      <span className="h-serif text-3xl w-9 text-center shrink-0" aria-hidden>{rank}</span>
      <span className="size-10 rounded-full bg-wine grid place-items-center shrink-0"><CatIcon name={cat.icon} size={18} /></span>
      <div className="flex-1 min-w-[140px]">
        <p className="font-medium leading-tight">{cat.name}</p>
        <p className="text-xs text-muted">{cat.desc}</p>
      </div>
      <div role="group" aria-label={`How much ${cat.name} matters`} className="inline-flex rounded-full border border-line p-0.5 text-xs">
        {TIERS.map((t) => <button key={t.v} aria-pressed={tier === t.v} onClick={() => onTier(t.v)} className={`rounded-full px-2.5 py-1.5 min-h-8 ${tier === t.v ? (t.v === "skip" ? "bg-pending text-cream" : "bg-cream text-ink-black font-semibold") : "text-muted"}`}>{t.t}</button>)}
      </div>
      <div className="flex shrink-0">
        <button className="btn btn-ghost btn-icon" onClick={() => onMove(-1)} disabled={rank === 1} aria-label={`Move ${cat.name} up`}><ChevronUp size={18} aria-hidden /></button>
        <button className="btn btn-ghost btn-icon" onClick={() => onMove(1)} disabled={last} aria-label={`Move ${cat.name} down`}><ChevronDown size={18} aria-hidden /></button>
        {onRemove && <button className="btn btn-ghost btn-icon" onClick={onRemove} aria-label={`Remove ${cat.name}`}><Trash2 size={16} aria-hidden /></button>}
      </div>
    </li>
  );
}

function Merged({ cats }: { cats: BudgetCategory[] }) {
  const s = useApp();
  const { rows } = mergeRankings(s.rankings.A.order, s.rankings.B.order);
  const order = effectiveOrder(s);
  const both = s.ranked.A && s.ranked.B;
  const gaps = rows.filter(isDisagreement).length;

  if (!both) {
    const waiting = !s.ranked.A && !s.ranked.B ? "Neither of you has ranked yet." : `${s.ranked.A ? s.names[1] : s.names[0]} has not ranked yet.`;
    return <div className="card card-tan p-6"><p className="h-serif text-2xl">{waiting}</p><p className="text-muted mt-1">Open each name above and drag the list into order. The merged view appears once both are done.</p></div>;
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <p className="flex-1">{gaps ? `${gaps} ${gaps === 1 ? "category is" : "categories are"} four or more places apart. Worth a conversation.` : "No big disagreements. You are ranking almost the same wedding."}</p>
        {s.mergedOrder && <button className="btn btn-sm" onClick={() => { s.setMergedOrder(null); toast("Back to the meet-in-the-middle order."); }}>Reset to meet in the middle</button>}
      </div>
      <div className="relative scroll-x">
        <table className="w-full text-left min-w-[520px]">
          <thead><tr className="eyebrow"><th className="py-2 pr-2 font-medium">Merged</th><th className="py-2 font-medium">Category</th><th className="py-2 px-2 font-medium text-center">{s.names[0]}</th><th className="py-2 px-2 font-medium text-center">{s.names[1]}</th><th className="py-2 font-medium"><span className="sr-only">Reorder</span></th></tr></thead>
          <tbody>
            {order.map((id, i) => {
              const r = rows.find((x) => x.id === id), c = cats.find((x) => x.id === id);
              if (!r || !c) return null;
              const big = isDisagreement(r);
              return (
                <tr key={id} className="border-t border-line">
                  <td className="py-2.5 pr-2 h-serif text-2xl w-14">{i + 1}</td>
                  <td className="py-2.5"><span className="font-medium">{c.name}</span>{big && <span className="chip chip-orange ml-2">{r.gap} apart</span>}</td>
                  <td className="py-2.5 px-2 text-center tabular-nums">#{r.a}</td>
                  <td className="py-2.5 px-2 text-center tabular-nums">#{r.b}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button className="btn btn-ghost btn-icon" disabled={i === 0} onClick={() => s.setMergedOrder(move(order, i, i - 1))} aria-label={`Move ${c.name} up in the merged order`}><ChevronUp size={18} aria-hidden /></button>
                    <button className="btn btn-ghost btn-icon" disabled={i === order.length - 1} onClick={() => s.setMergedOrder(move(order, i, i + 1))} aria-label={`Move ${c.name} down in the merged order`}><ChevronDown size={18} aria-hidden /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
