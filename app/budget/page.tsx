"use client";
import { useApp, allocate } from "@/lib/store";

const COLORS = ["#b5543c", "#d99a5b", "#8fa285", "#6f8a9a", "#a5788f", "#c9b27a", "#7a6a58", "#d8826b"];
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Budget() {
  const { priorities, budget, setBudget, weights, setWeight } = useApp();
  const rows = allocate(priorities, weights, budget);
  const R = 70, C = 2 * Math.PI * R;
  const offsets = rows.map((_, i) => rows.slice(0, i).reduce((a, x) => a + (x.pct / 100) * C, 0));
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Budget</p>
        <h1 className="h-serif text-3xl">See it. Don&apos;t ledger it.</h1>
        <p className="text-muted text-sm mt-1">Your priorities set the split. Nudge a slider if a number feels off. No vendors, no line items.</p>
      </div>

      <label className="block card p-4 space-y-2">
        <span className="eyebrow">Total budget</span>
        <p className="h-serif text-3xl">{inr(budget)}</p>
        <input type="range" min={200000} max={10000000} step={50000} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[var(--accent)]" aria-label="Total budget" />
      </label>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <svg viewBox="0 0 200 200" className="w-64 mx-auto -rotate-90" role="img" aria-label="Budget split">
          {rows.map((r, i) => {
            const len = (r.pct / 100) * C;
            return <circle key={r.name} cx="100" cy="100" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="28" strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-offsets[i]} />;
          })}
        </svg>
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.name} className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="size-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 font-medium">{r.name}</span>
                <span className="text-muted">{Math.round(r.pct)}%</span>
                <span className="font-semibold w-24 text-right">{inr(r.amount)}</span>
              </div>
              <input type="range" min={1} max={100} value={Math.round(weights[r.name] ?? r.pct)} onChange={(e) => { if (!Object.keys(weights).length) rows.forEach((x) => setWeight(x.name, x.pct)); setWeight(r.name, +e.target.value); }}
                className="w-full accent-[var(--accent)] h-1" aria-label={`Weight for ${r.name}`} />
            </li>
          ))}
        </ul>
      </div>
      {Object.keys(weights).length > 0 && <button className="btn" onClick={() => priorities.forEach((p) => setWeight(p, null))}>Reset to priority order</button>}
    </div>
  );
}
