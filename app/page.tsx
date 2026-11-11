"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { buildThemes } from "@/lib/cluster";
import { mergeDiagnostic } from "@/lib/merge";
import ItemCard from "@/components/ItemCard";

export default function Home() {
  const { items, names, priorities, setStatus } = useApp();
  const pending = items.filter((i) => i.status === "pending").length;
  const kept = items.filter((i) => i.status === "kept");
  const themes = useMemo(() => buildThemes(items), [items]);
  const merge = useMemo(() => mergeDiagnostic(items), [items]);
  const resurfaced = useMemo(() => kept.slice(0, 3), [kept]);

  const steps = [
    { href: "/declutter", t: "Declutter", d: pending ? `${pending} items waiting. Keep what’s you.` : "All reviewed", done: pending === 0 && items.length > 0 },
    { href: "/diagnostic", t: "Merge", d: items.length ? `${merge.score}% shared identity` : "See where you align", done: false },
    { href: "/priorities", t: "Priorities", d: `Top: ${priorities[0]}`, done: false },
    { href: "/budget", t: "Budget", d: "See it, don't ledger it", done: false },
    { href: "/guide", t: "Identity Guide", d: "One page to show family", done: false },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="eyebrow">{names[0]} & {names[1]}</p>
        <h1 className="h-serif text-3xl md:text-5xl leading-tight">{items.length} saved.<br /><span className="text-accent">{themes.length || "3–5"} things that are actually you.</span></h1>
        <p className="text-muted max-w-xl">Every other tool adds. We subtract. Declutter down, then turn what&apos;s left into a guide you can hand to anyone.</p>
        <div className="flex gap-2 pt-2"><Link href="/library" className="btn btn-primary">+ Add inspiration</Link><Link href="/declutter" className="btn">Start decluttering</Link></div>
      </section>

      <section>
        <p className="eyebrow mb-3">Your path</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {steps.map((s, i) => (
            <Link key={s.href} href={s.href} className="card p-4 hover:border-accent transition block">
              <p className="eyebrow">0{i + 1}{s.done && " · done"}</p>
              <p className="font-semibold mt-1">{s.t}</p>
              <p className="text-xs text-muted mt-1">{s.d}</p>
            </Link>
          ))}
        </div>
      </section>

      {resurfaced.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Top of mind</p>
          <div className="grid grid-cols-3 gap-3">{resurfaced.map((i) => <ItemCard key={i.id} item={i} compact onClick={() => setStatus(i.id, "pending")} />)}</div>
          <p className="text-xs text-muted mt-1">Tap a card to put it back in the declutter queue.</p>
        </section>
      )}

      {themes.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Your themes so far</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {themes.map((t) => (
              <div key={t.id} className="card p-4 space-y-3">
                <p className="h-serif text-xl">{t.name}</p>
                <div className="flex gap-1">{t.palette.map((p) => <span key={p} className="size-6 rounded-full border border-black/10" style={{ background: p }} />)}</div>
                <p className="text-xs text-muted">{t.items.length} saved</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
