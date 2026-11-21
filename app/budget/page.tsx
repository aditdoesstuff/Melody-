"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, LockOpen, RotateCcw, Share2 } from "lucide-react";
import type { Currency, ShareSnapshot } from "@/lib/types";
import { allCategories, effectiveOrder, effectiveWeights, useApp } from "@/lib/store";
import { allocate, insights, setWeight } from "@/lib/budget";
import { money, moneyShort, SYMBOL } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import CatIcon from "@/components/CatIcon";
import ShareSheet from "@/components/ShareSheet";
import { toast } from "@/components/Toast";

const SEG = ["#8a1035", "#d9622b", "#e8c98f", "#9db393", "#c98f8a", "#7b6048", "#e8e2d1", "#b5543c", "#6f8a9a", "#a5788f", "#c9b27a", "#5a7a4a", "#d8826b", "#8d6e9b", "#3f6f73", "#b99b6b"];
const CONTINGENCY = "#3a3430";
const CURRENCIES: Currency[] = ["INR", "USD", "GBP", "EUR"];

export default function BudgetPage() {
  const s = useApp();
  const { budget } = s;
  const [sharing, setSharing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const cats = allCategories(s);
  const order = effectiveOrder(s);
  const weights = effectiveWeights(s);
  const a = useMemo(() => allocate(budget.total, weights, budget.contingencyPct, order), [budget.total, budget.contingencyPct, weights, order]);
  const name = (id: string) => cats.find((c) => c.id === id)?.name ?? id;
  const colour = (id: string) => SEG[Math.max(0, cats.findIndex((c) => c.id === id)) % SEG.length];
  const lines = insights(a, budget.total, (id) => order.indexOf(id) + 1, name, budget.guests);
  const c = budget.currency;
  const custom = budget.weights !== null;
  const ranked = s.ranked.A || s.ranked.B;

  const slide = (id: string, v: number) => s.setBudget({ weights: setWeight(weights, id, v, budget.locked) });
  const commitTotal = () => { if (draft === null) return; const n = parseInt(draft.replace(/[^\d]/g, ""), 10); s.setBudget({ total: Number.isFinite(n) ? Math.min(n, 9_999_999_999) : 0 }); setDraft(null); };
  const csv = () => {
    const rows = [["Category", "Amount", "Percent of total"], ...a.rows.map((r) => [name(r.id), String(r.amount), r.pct.toFixed(1)]), ["Contingency", String(a.contingency), budget.total ? ((a.contingency * 100) / budget.total).toFixed(1) : "0"], ["Total", String(budget.total), "100"]];
    const blob = new Blob([rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "aaroh-budget.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("CSV saved.");
  };
  const snapshot: ShareSnapshot = { k: "budget", n: s.names, c, total: budget.total, g: budget.guests, cp: budget.contingencyPct, rows: [...a.rows.filter((r) => r.amount > 0).map((r) => ({ name: name(r.id), amt: r.amount, pct: Math.round(r.pct * 10) / 10 })), { name: "Contingency", amt: a.contingency, pct: budget.total ? Math.round((a.contingency * 1000) / budget.total) / 10 : 0 }] };

  return (
    <div>
      <PageHeader title="Your budget" lede="No ledger, no vendors. Just what your ranking says the money should do.">
        <button className="btn" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden />Share</button>
        {custom && <button className="btn" onClick={() => { s.setBudget({ weights: null, locked: [] }); toast("Back to what your ranking suggests."); }}><RotateCcw size={16} aria-hidden />Reset to ranking</button>}
        <Link href="/identity" className="btn btn-primary">Next: your identity guide<ArrowRight size={16} aria-hidden /></Link>
      </PageHeader>

      {!ranked && <div className="card card-tan p-4 mb-5 flex flex-wrap items-center gap-3"><p className="flex-1">This split uses the starting order. Rank what matters to make it yours.</p><Link href="/priorities" className="btn btn-sm btn-cream">Rank priorities</Link></div>}

      <section className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-4" aria-label="Budget inputs">
        <div className="card card-tan p-5">
          <label htmlFor="total" className="eyebrow block mb-2">Total budget</label>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="currency">Currency</label>
            <select id="currency" className="field !w-28" value={c} onChange={(e) => s.setBudget({ currency: e.target.value as Currency })}>{CURRENCIES.map((x) => <option key={x} value={x}>{SYMBOL[x]} {x}</option>)}</select>
            <input id="total" inputMode="numeric" className="field font-serif !text-2xl !text-peach" value={draft ?? Math.round(budget.total).toLocaleString(c === "INR" ? "en-IN" : "en-US")}
              onChange={(e) => setDraft(e.target.value)} onFocus={(e) => { setDraft(String(budget.total)); e.currentTarget.select(); }} onBlur={commitTotal} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          </div>
          <p className="text-sm text-muted mt-2">{moneyShort(budget.total, c)} in total · {moneyShort(a.spendable, c)} to spend after contingency</p>
        </div>
        <div className="card p-5">
          <label htmlFor="guests" className="eyebrow block mb-2">Guests (optional)</label>
          <input id="guests" inputMode="numeric" className="field" value={budget.guests ?? ""} placeholder="How many people?" onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); s.setBudget({ guests: Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : undefined }); }} />
          <p className="text-sm text-muted mt-2">{budget.guests ? `${money(budget.total / budget.guests, c)} per guest, all in` : "Add a number to see cost per guest"}</p>
        </div>
        <div className="card p-5">
          <label htmlFor="cont" className="eyebrow block mb-2">Contingency {budget.contingencyPct}%</label>
          <input id="cont" type="range" min={0} max={15} step={1} value={budget.contingencyPct} onChange={(e) => s.setBudget({ contingencyPct: +e.target.value })} className="w-full h-11" />
          <p className="text-sm text-muted">{money(a.contingency, c)} held back for surprises. 5 to 10% is typical.</p>
        </div>
      </section>

      <div ref={sheet} className="mt-6 pb-1">
        <section className="card card-tan p-5" aria-label="Whole budget">
          <div className="flex items-baseline justify-between gap-3 mb-3"><p className="eyebrow">The whole thing</p><p className="h-serif text-3xl">{money(budget.total, c)}</p></div>
          <div className="flex h-12 rounded-full overflow-hidden bg-white/5" role="img" aria-label={a.rows.filter((r) => r.amount > 0).map((r) => `${name(r.id)} ${Math.round(r.pct)}%`).join(", ") + `, contingency ${money(a.contingency, c)}`}>
            {a.rows.map((r) => <motion.span key={r.id} title={`${name(r.id)} ${money(r.amount, c)}`} style={{ background: colour(r.id) }} initial={false} animate={{ width: `${r.pct}%` }} transition={{ type: "spring", stiffness: 220, damping: 30 }} />)}
            <motion.span title={`Contingency ${money(a.contingency, c)}`} style={{ background: CONTINGENCY }} className="border-l border-bg" initial={false} animate={{ width: `${budget.total ? (a.contingency * 100) / budget.total : 0}%` }} />
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4 items-start">
          <ul className="space-y-2" aria-label="Budget by category">
            {a.rows.map((r) => {
              const cat = cats.find((x) => x.id === r.id);
              const locked = budget.locked.includes(r.id);
              return (
                <li key={r.id} className={`card p-4 ${r.weight === 0 ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="size-9 rounded-full grid place-items-center shrink-0" style={{ background: colour(r.id), color: "#151b1b" }}><CatIcon name={cat?.icon ?? "Star"} size={17} /></span>
                    <div className="flex-1 min-w-0"><p className="font-medium truncate">{name(r.id)}</p><p className="text-xs text-muted">Ranked #{order.indexOf(r.id) + 1}</p></div>
                    <p className="text-right"><span className="h-serif text-xl block tabular-nums">{money(r.amount, c)}</span><span className="text-xs text-muted tabular-nums">{r.pct.toFixed(1)}% of total</span></p>
                    <button className={`btn btn-icon btn-ghost ${locked ? "!text-peach" : "text-muted"}`} aria-pressed={locked} aria-label={locked ? `Unlock ${name(r.id)}` : `Lock ${name(r.id)} at this amount`} onClick={() => s.toggleLock(r.id)}>{locked ? <Lock size={17} aria-hidden /> : <LockOpen size={17} aria-hidden />}</button>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden mt-3" aria-hidden><motion.div className="h-full rounded-full" style={{ background: colour(r.id) }} initial={false} animate={{ width: `${Math.min(100, (r.weight / Math.max(...a.rows.map((x) => x.weight), 1)) * 100)}%` }} transition={{ type: "spring", stiffness: 220, damping: 30 }} /></div>
                  <label className="sr-only" htmlFor={`w-${r.id}`}>{name(r.id)} share, {r.weight}% of spending</label>
                  <input id={`w-${r.id}`} type="range" min={0} max={60} step={1} value={Math.min(r.weight, 60)} disabled={locked} onChange={(e) => slide(r.id, +e.target.value)} className="w-full h-9 disabled:opacity-40" />
                </li>
              );
            })}
            <li className="card p-4 flex items-center gap-3">
              <span className="size-9 rounded-full shrink-0 border border-tan" style={{ background: CONTINGENCY }} />
              <p className="flex-1 font-medium">Contingency</p>
              <p className="text-right"><span className="h-serif text-xl block tabular-nums">{money(a.contingency, c)}</span><span className="text-xs text-muted tabular-nums">{budget.total ? ((a.contingency * 100) / budget.total).toFixed(1) : 0}% of total</span></p>
            </li>
          </ul>

          <aside className="card card-tan p-5 lg:sticky lg:top-20" aria-live="polite">
            <p className="eyebrow mb-3">What we notice</p>
            <ul className="space-y-3">{lines.map((l) => <li key={l} className="leading-relaxed">{l.replace(/about (\d[\d,]*) per guest/, (_, n) => `about ${SYMBOL[c]}${n} per guest`).replace(/roughly (\d[\d,]*)\./, (_, n) => `roughly ${SYMBOL[c]}${n}.`)}</li>)}</ul>
            <p className="text-xs text-muted mt-4">{custom ? "You have adjusted the split by hand. Changing your ranking resets it." : "Following your ranking exactly. Drag a slider to fine-tune; lock one to hold it."}</p>
          </aside>
        </div>
      </div>

      {sharing && <ShareSheet title={`${s.names[0]} & ${s.names[1]}: our wedding budget`} snapshot={snapshot} target={sheet} fileName="aaroh-budget" onClose={() => setSharing(false)} extras={[{ label: "Save as CSV", run: csv }]} />}
    </div>
  );
}
