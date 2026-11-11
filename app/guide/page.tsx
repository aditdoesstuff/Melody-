"use client";
import { useMemo, useRef, useState } from "react";
import { useApp, allocate } from "@/lib/store";
import { buildThemes, topPalette } from "@/lib/cluster";
import { ShareCard, ExclusionCard, type GuideData } from "@/components/GuideCard";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Guide() {
  const { items, names, priorities, weights, budget } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const full = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  const d: GuideData & { rows: ReturnType<typeof allocate> } = useMemo(() => {
    const themes = buildThemes(items);
    const rows = allocate(priorities, weights, budget);
    const keptTags = new Set(items.filter((i) => i.status === "kept").flatMap((i) => i.tags));
    const declined = items.filter((i) => i.status === "declined");
    const tagFreq = new Map<string, number>();
    declined.forEach((i) => i.tags.forEach((t) => !keptTags.has(t) && t !== "inspiration" && tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1)));
    const tags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    return { names, themes, palette: topPalette(items), top: rows, rows, notThis: { tags, titles: declined.map((i) => i.title ?? "an idea") }, budget: inr(budget) };
  }, [items, names, priorities, weights, budget]);

  const dl = (href: string, name: string) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };

  const exportPng = async () => {
    if (!card.current) return;
    setBusy("png");
    const { toPng } = await import("html-to-image");
    dl(await toPng(card.current, { pixelRatio: 2, cacheBust: true }), "our-wedding-card.png");
    setBusy(null);
  };
  const exportPdf = async () => {
    if (!full.current) return;
    setBusy("pdf");
    const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    const el = full.current;
    const png = await toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: "#f7f3ec" });
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (el.offsetHeight / el.offsetWidth) * w;
    pdf.addImage(png, "PNG", 0, 0, w, Math.min(h, pdf.internal.pageSize.getHeight()));
    pdf.save("wedding-identity-guide.pdf");
    setBusy(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Identity Guide</p>
        <h1 className="h-serif text-3xl">The page you show family — instead of re-arguing taste.</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn btn-primary" onClick={exportPdf} disabled={!!busy}>{busy === "pdf" ? "Making PDF…" : "⬇ Full guide (PDF)"}</button>
          <button className="btn" onClick={exportPng} disabled={!!busy}>{busy === "png" ? "Making image…" : "⬇ Share card (PNG)"}</button>
        </div>
      </div>

      <div ref={full} className="space-y-6 p-1" style={{ background: "var(--bg)" }}>
        <section className="space-y-1">
          <p className="eyebrow">Wedding identity guide</p>
          <h2 className="h-serif text-4xl">{names[0]} & {names[1]}</h2>
          <div className="flex gap-1.5 pt-2">{d.palette.map((c) => <span key={c} className="size-9 rounded-full border border-black/10" style={{ background: c }} />)}</div>
        </section>

        <section>
          <p className="eyebrow mb-2">The feel</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {d.themes.length ? d.themes.map((t) => (
              <div key={t.id} className="card p-4 space-y-2"><p className="h-serif text-xl">{t.name}</p>
                <div className="flex gap-1">{t.palette.slice(0, 4).map((p) => <span key={p} className="size-5 rounded-full border border-black/10" style={{ background: p }} />)}</div></div>
            )) : <p className="text-sm text-muted">Keep a few items in Declutter to see your themes.</p>}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">What matters most · {d.budget}</p>
          <ol className="card divide-y divide-line">
            {d.rows.slice(0, 5).map((r, i) => (
              <li key={r.name} className="flex items-center gap-3 p-3"><span className="h-serif text-xl text-accent w-6">{i + 1}</span><span className="flex-1 font-medium">{r.name}</span><span className="text-sm text-muted">{Math.round(r.pct)}% · {inr(r.amount)}</span></li>
            ))}
          </ol>
        </section>

        <ExclusionCard {...d.notThis} />
      </div>

      <section className="space-y-3">
        <p className="eyebrow">Share card · for the family group chat</p>
        <div className="overflow-x-auto"><div ref={card} className="inline-block"><ShareCard d={d} /></div></div>
      </section>
    </div>
  );
}
