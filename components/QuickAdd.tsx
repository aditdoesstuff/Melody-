"use client";
import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Palette, Plus } from "lucide-react";
import type { Source } from "@/lib/types";
import { addColor, addFile, addImages, addSmart } from "@/lib/capture";
import { toast } from "./Toast";

const FROM: { v: Source; t: string; hint: string }[] = [
  { v: "instagram", t: "Instagram", hint: "Paste an Instagram post or reel link" },
  { v: "pinterest", t: "Pinterest", hint: "Paste a pin or board link" },
  { v: "whatsapp", t: "WhatsApp", hint: "Paste a link or a forwarded message" },
  { v: "spotify", t: "Spotify", hint: "Paste a song or playlist link" },
];

export async function handleFiles(files: File[]) {
  const images = files.filter((f) => f.type.startsWith("image/"));
  const others = files.filter((f) => !f.type.startsWith("image/"));
  others.forEach(addFile);
  if (images.length) {
    const r = await addImages(images);
    if (r.failed) toast(r.added ? `${r.failed} image${r.failed > 1 ? "s" : ""} could not be read. The rest are in.` : "That image could not be saved. Your browser storage may be full.", "warn");
  }
  const n = files.length;
  if (n) toast(n === 1 ? "Added. Tagging it now." : `${n} added. Tagging them now.`);
}

/** The capture bar: one box for links, hex codes and thoughts, plus image, file and colour buttons. */
export default function QuickAdd({ autoFocus = false, onAdded }: { autoFocus?: boolean; onAdded?: () => void }) {
  const [text, setText] = useState("");
  const [from, setFrom] = useState<Source | null>(null);
  const [picking, setPicking] = useState(false);
  const [hex, setHex] = useState("#650020");
  const images = useRef<HTMLInputElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLInputElement>(null);

  const submit = () => {
    const kind = addSmart(text, from ?? undefined);
    if (!kind) return;
    toast(kind === "link" ? "Link saved." : kind === "color" ? "Colour saved." : "Thought saved.");
    setText(""); setFrom(null); onAdded?.();
  };

  return (
    <section aria-label="Add to your space" className="card card-tan p-3 md:p-4 space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2">
        <label htmlFor="quick-add" className="sr-only">Drop a screenshot, paste a link, or type a thought</label>
        <input id="quick-add" ref={box} autoFocus={autoFocus} value={text} onChange={(e) => setText(e.target.value)} className="field"
          placeholder={from ? FROM.find((f) => f.v === from)!.hint : "Drop a screenshot, paste a link, or type a thought"} />
        <button type="submit" className="btn btn-primary shrink-0" disabled={!text.trim()}><Plus size={18} aria-hidden /><span className="hidden sm:inline">Add</span><span className="sr-only sm:hidden">Add</span></button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-sm" onClick={() => images.current?.click()}><ImageIcon size={15} aria-hidden />Images</button>
        <button className="btn btn-sm" onClick={() => files.current?.click()}><FileText size={15} aria-hidden />File</button>
        <button className="btn btn-sm" aria-expanded={picking} onClick={() => setPicking((p) => !p)}><Palette size={15} aria-hidden />Colour</button>
        <span className="text-xs text-muted ml-1 hidden sm:inline">Add from</span>
        {FROM.map((f) => (
          <button key={f.v} className="chip" aria-pressed={from === f.v} onClick={() => { setFrom(from === f.v ? null : f.v); box.current?.focus(); }}>{f.t}</button>
        ))}
      </div>
      {picking && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); addColor(hex); toast("Colour saved."); setPicking(false); onAdded?.(); }}>
          <label className="sr-only" htmlFor="swatch-pick">Pick a colour</label>
          <input id="swatch-pick" type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="size-11 rounded-full bg-transparent border border-tan cursor-pointer" />
          <label className="sr-only" htmlFor="swatch-hex">Hex code</label>
          <input id="swatch-hex" value={hex} onChange={(e) => setHex(e.target.value)} className="field field-sm !w-32 font-mono" pattern="#?[0-9a-fA-F]{6}" />
          <button className="btn btn-sm btn-cream" type="submit">Save swatch</button>
        </form>
      )}
      <input ref={images} type="file" accept="image/*" multiple hidden onChange={(e) => { void handleFiles([...(e.target.files ?? [])]).then(onAdded); e.target.value = ""; }} />
      <input ref={files} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" multiple hidden onChange={(e) => { void handleFiles([...(e.target.files ?? [])]).then(onAdded); e.target.value = ""; }} />
    </section>
  );
}
