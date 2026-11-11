import type { Theme } from "@/lib/types";

export interface GuideData {
  names: [string, string];
  themes: Theme[];
  palette: string[];
  top: { name: string; pct: number }[];
  notThis: { tags: string[]; titles: string[] };
  budget: string;
}

// Compact one-screen card made for sending to family on WhatsApp.
export function ShareCard({ d }: { d: GuideData }) {
  return (
    <div style={{ width: 420, background: "#f7f3ec", color: "#1f1b16", padding: 28, fontFamily: "Georgia, serif", borderRadius: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#7a7268", fontFamily: "sans-serif" }}>Our wedding in a glance</p>
      <h2 style={{ fontSize: 30, lineHeight: 1.1, margin: "6px 0 14px" }}>{d.names[0]} & {d.names[1]}</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>{d.palette.map((c) => <span key={c} style={{ width: 34, height: 34, borderRadius: 999, background: c, border: "1px solid rgba(0,0,0,.1)" }} />)}</div>
      <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#7a7268", marginBottom: 4 }}>THE FEEL</p>
      <p style={{ fontSize: 20, marginBottom: 14 }}>{d.themes.map((t) => t.name).slice(0, 3).join(" · ") || "—"}</p>
      <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#7a7268", marginBottom: 4 }}>WHAT MATTERS MOST</p>
      <ol style={{ fontFamily: "sans-serif", fontSize: 15, paddingLeft: 18, marginBottom: 14 }}>{d.top.slice(0, 3).map((t) => <li key={t.name}>{t.name} <span style={{ color: "#7a7268" }}>({Math.round(t.pct)}%)</span></li>)}</ol>
      <div style={{ background: "#f3dfd6", borderRadius: 14, padding: 12 }}>
        <p style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 1.5, color: "#b5543c", fontWeight: 700 }}>THIS ISN&apos;T</p>
        <p style={{ fontSize: 16, marginTop: 2 }}>{d.notThis.tags.slice(0, 4).join(" · ") || "Nothing ruled out yet"}</p>
      </div>
    </div>
  );
}

export function ExclusionCard({ tags, titles }: { tags: string[]; titles: string[] }) {
  return (
    <div className="card p-5 border-accent space-y-3">
      <p className="eyebrow !text-accent">What this isn&apos;t</p>
      <p className="h-serif text-2xl">{tags.length ? tags.slice(0, 5).join(" · ") : "Swipe left in Declutter to build this card."}</p>
      {titles.length > 0 && <p className="text-sm text-muted">We looked at {titles.slice(0, 4).join(", ")}{titles.length > 4 ? ` and ${titles.length - 4} more` : ""} — and said no thank you.</p>}
    </div>
  );
}
