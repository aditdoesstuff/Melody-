"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import type { ShareSnapshot } from "@/lib/types";
import { decodeSnapshot } from "@/lib/share";
import { money } from "@/lib/format";
import { inkOn } from "@/lib/palette";
import Logo from "./Logo";

const SEG = ["#8a1035", "#d9622b", "#e8c98f", "#9db393", "#c98f8a", "#7b6048", "#e8e2d1", "#b5543c", "#6f8a9a", "#a5788f", "#c9b27a", "#5a7a4a", "#d8826b", "#8d6e9b"];

/** Read-only page rendered entirely from the link. Works on any device, with no account and no server. */
export default function ShareView() {
  const [snap, setSnap] = useState<ShareSnapshot | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setSnap(decodeSnapshot(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-5 md:px-12 pt-6 flex items-center justify-between"><Link href="/" aria-label="aaroh home"><Logo width={120} /></Link><span className="chip">Read-only</span></header>
      <main className="flex-1 px-5 md:px-12 py-8 max-w-5xl w-full mx-auto">
        {snap === undefined && <div className="space-y-4" aria-busy="true"><div className="skeleton h-16 w-2/3" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div>}
        {snap === null && (
          <div className="card card-tan p-8 text-center"><p className="h-serif text-3xl">This link is incomplete.</p><p className="text-muted mt-2">It may have been cut off when it was copied. Ask for it again, or start your own space.</p></div>
        )}
        {snap && (
          <>
            <p className="eyebrow">{snap.k === "themes" ? "Wedding themes" : snap.k === "identity" ? "Wedding identity guide" : "Wedding budget"}</p>
            <h1 className="h-display text-5xl md:text-7xl mt-2 mb-8">{snap.n[0]} &amp; {snap.n[1]}</h1>
            {snap.k === "themes" && (
              <div className="grid md:grid-cols-2 gap-4">
                {snap.t.map((t) => (
                  <article key={t.name} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3"><h2 className="h-serif text-3xl">{t.name}</h2><span className="h-serif text-2xl">{t.pct}%</span></div>
                    <p className="text-muted">{t.d}</p>
                    <div className="flex gap-1.5">{t.p.map((p) => <span key={p} className="h-10 flex-1 rounded-full border border-white/10" style={{ background: p }} />)}</div>
                    <div className="flex flex-wrap gap-1.5">{t.g.map((g) => <span key={g} className="chip">{g}</span>)}</div>
                  </article>
                ))}
              </div>
            )}
            {snap.k === "identity" && (
              <div className="space-y-8">
                <p className="font-serif text-peach text-2xl md:text-4xl leading-snug">“{snap.s}”</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {snap.p.map((sw) => <div key={sw.hex} className="rounded-2xl h-28 p-3 flex flex-col justify-end border border-line" style={{ background: sw.hex, color: inkOn(sw.hex) }}><span className="font-medium text-sm">{sw.name}</span><span className="text-[11px] font-mono uppercase">{sw.hex}</span></div>)}
                </div>
                <div className="grid md:grid-cols-3 gap-4">{snap.t.map((t) => <div key={t.word} className="card p-5"><p className="h-serif text-3xl capitalize">{t.word}</p><p className="text-muted mt-2">{t.line}</p></div>)}</div>
                {snap.th.length > 0 && <p className="text-muted">Themes: <span className="font-serif text-peach text-lg">{snap.th.join(" · ")}</span></p>}
                <div className="grid md:grid-cols-2 gap-4">
                  {([["Do", snap.dos, true], ["Don't", snap.donts, false]] as const).map(([title, items, ok]) => (
                    <div key={title} className="card p-5"><h2 className="h-serif text-3xl mb-4">{title}</h2>
                      <ul className="space-y-2.5">{items.map((d) => <li key={d} className="flex gap-3"><span className={`size-6 rounded-full grid place-items-center shrink-0 mt-0.5 ${ok ? "bg-green text-green-text" : "bg-wine text-white"}`}>{ok ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}</span><span>{d}</span></li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {snap.k === "budget" && (
              <div className="space-y-4">
                <div className="card card-tan p-5">
                  <div className="flex items-baseline justify-between gap-3 mb-3"><p className="eyebrow">Total{snap.g ? ` · ${snap.g} guests` : ""}</p><p className="h-serif text-4xl">{money(snap.total, snap.c)}</p></div>
                  <div className="flex h-12 rounded-full overflow-hidden bg-white/5" role="img" aria-label="Budget split">{snap.rows.map((r, i) => <span key={r.name} title={r.name} style={{ width: `${r.pct}%`, background: r.name === "Contingency" ? "#3a3430" : SEG[i % SEG.length] }} />)}</div>
                </div>
                <ul className="space-y-2">
                  {snap.rows.map((r, i) => (
                    <li key={r.name} className="card p-4 flex items-center gap-3">
                      <span className="size-4 rounded-full shrink-0" style={{ background: r.name === "Contingency" ? "#3a3430" : SEG[i % SEG.length] }} />
                      <span className="flex-1 font-medium">{r.name}</span><span className="text-muted tabular-nums">{r.pct}%</span><span className="h-serif text-xl w-36 text-right tabular-nums">{money(r.amt, snap.c)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="px-5 md:px-12 py-10 text-center border-t border-line mt-8">
        <p className="lede text-lg">Planning your own? Declutter first, then decide.</p>
        <Link href="/" className="btn btn-primary mt-4">Make yours on aaroh<ArrowRight size={16} aria-hidden /></Link>
      </footer>
    </div>
  );
}
