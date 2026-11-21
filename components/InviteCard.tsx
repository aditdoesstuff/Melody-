import type { Invite } from "@/lib/types";
import { inkOn } from "@/lib/palette";

export const TEMPLATES: { id: string; name: string }[] = [
  { id: "lotus", name: "Lotus" }, { id: "jaali", name: "Jaali" }, { id: "arch", name: "Arch" },
  { id: "plain", name: "Plain type" }, { id: "border", name: "Double border" }, { id: "petal", name: "Petals" },
];
export interface Tint { main: string; paper: string; accent: string }
export const DEFAULT_TINT: Tint = { main: "#650020", paper: "#f2e3cf", accent: "#a83a52" };

function Lotus({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 110" aria-hidden style={{ width: "62%", display: "block", margin: "0 auto" }}>
      {[-70, -42, -18, 0, 18, 42, 70].map((a, i) => <path key={a} d="M100 104 C 82 70, 86 34, 100 8 C 114 34, 118 70, 100 104 Z" fill={c} opacity={0.72 + (i === 3 ? 0.28 : 0)} transform={`rotate(${a} 100 104)`} />)}
      <circle cx="100" cy="106" r="7" fill={c} />
    </svg>
  );
}
function Jaali({ c }: { c: string }) {
  const motif = (x: number, k: number) => (
    <g key={x} transform={`translate(${x} 34)`} fill={c}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d={k % 2 ? "M0 -26 L7 -8 L0 0 L-7 -8 Z" : "M0 -26 C 9 -16, 9 -8, 0 0 C -9 -8, -9 -16, 0 -26 Z"} transform={`rotate(${a})`} />)}
      <circle r="6" fill={c} opacity="0.55" />
    </g>
  );
  return <svg viewBox="0 0 220 68" aria-hidden style={{ width: "88%", display: "block", margin: "0 auto" }}>{[38, 110, 182].map(motif)}</svg>;
}

/** An invitation card drawn in HTML and SVG, sized by its container and rendered to PNG for sending. */
export default function InviteCard({ templateId, fields, title, tint = DEFAULT_TINT }: { templateId: string; fields: Invite["fields"]; title: string; tint?: Tint }) {
  const dark = templateId === "jaali" || templateId === "petal" || templateId === "arch";
  const bg = dark ? tint.main : tint.paper;
  const ink = dark ? inkOn(tint.main) === "#151b1b" ? "#151b1b" : "#fbefe0" : tint.main;
  const names = fields.names || "Your names";
  const kind = /engage/i.test(title) ? "are getting engaged" : /sangeet/i.test(title) ? "invite you to their sangeet" : /haldi/i.test(title) ? "invite you to their haldi" : /mehe?ndi/i.test(title) ? "invite you to their mehendi" : /reception/i.test(title) ? "invite you to their reception" : "are getting married";
  const serif = "var(--font-fraunces), Georgia, serif";
  const body = (
    <div style={{ textAlign: "center", padding: "0 9%" }}>
      <p style={{ fontSize: "0.62em", letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.8 }}>Together with their families</p>
      <p style={{ fontFamily: serif, fontSize: "2.05em", lineHeight: 1.05, margin: "0.35em 0 0.3em", fontWeight: 600 }}>{names}</p>
      <p style={{ fontSize: "0.78em", opacity: 0.9 }}>{kind}</p>
      {(fields.date || fields.venue) && <div style={{ width: "22%", height: 1, background: ink, opacity: 0.45, margin: "1.1em auto" }} />}
      {fields.date && <p style={{ fontFamily: serif, fontSize: "1.05em" }}>{fields.date}</p>}
      {fields.venue && <p style={{ fontSize: "0.8em", marginTop: "0.3em" }}>{fields.venue}</p>}
      {fields.rsvp && <p style={{ fontSize: "0.62em", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "1.4em", opacity: 0.85 }}>RSVP · {fields.rsvp}</p>}
    </div>
  );
  return (
    <div style={{ aspectRatio: "4 / 5", background: templateId === "petal" ? `radial-gradient(circle at 20% 15%, ${tint.accent}, transparent 55%), radial-gradient(circle at 85% 90%, ${tint.accent}, transparent 50%), ${tint.main}` : bg, color: ink, containerType: "inline-size", position: "relative", overflow: "hidden", width: "100%" }}>
      <div style={{ fontSize: "5.2cqw", position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.2em" }}>
        {templateId === "border" && <><div style={{ position: "absolute", inset: "4%", border: `1px solid ${ink}` }} /><div style={{ position: "absolute", inset: "6%", border: `2px solid ${ink}` }} /></>}
        {templateId === "arch" && <div style={{ position: "absolute", inset: "6% 10% 6% 10%", border: `1.5px solid ${ink}`, borderRadius: "50% 50% 0 0 / 32% 32% 0 0", opacity: 0.7 }} />}
        {templateId === "lotus" && <Lotus c={tint.accent} />}
        {templateId === "jaali" && <Jaali c={ink} />}
        {body}
        {templateId === "jaali" && <Jaali c={ink} />}
      </div>
    </div>
  );
}
