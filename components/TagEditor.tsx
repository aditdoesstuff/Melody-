"use client";
import { useState } from "react";
import { X } from "lucide-react";

/** Editable chip list. Enter or comma adds, the cross removes. */
export default function TagEditor({ label, tags, onChange, placeholder = "add" }: { label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim().toLowerCase().replace(/,$/, ""); if (t && !tags.includes(t)) onChange([...tags, t]); setV(""); };
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((t) => (
          <span key={t} className="chip">{t}<button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="-mr-1 size-5 grid place-items-center rounded-full hover:bg-white/15"><X size={11} aria-hidden /></button></span>
        ))}
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add}
          placeholder={`+ ${placeholder}`} aria-label={`Add to ${label}`} className="bg-transparent text-sm px-2 py-1 w-24 rounded-full border border-dashed border-tan placeholder:text-muted" />
      </div>
    </div>
  );
}
