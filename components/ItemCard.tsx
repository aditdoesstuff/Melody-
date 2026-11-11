"use client";
import type { Item } from "@/lib/types";

export default function ItemCard({ item, onClick, compact }: { item: Item; onClick?: () => void; compact?: boolean }) {
  const [a, b, c] = [item.palette[0] ?? "#e6dfd2", item.palette[1] ?? item.palette[0] ?? "#cfc6b5", item.palette[2] ?? item.palette[1] ?? "#bfb5a2"];
  const tall = !compact && (item.id.charCodeAt(item.id.length - 1) % 3 === 0);
  return (
    <button onClick={onClick} className="card overflow-hidden text-left w-full break-inside-avoid mb-3 block group" aria-label={item.title ?? item.text ?? "item"}>
      {item.type === "note" ? (
        <div className="p-4 min-h-24"><p className="h-serif text-lg leading-snug">{item.text}</p></div>
      ) : item.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt={item.title ?? ""} className="w-full object-cover" style={{ aspectRatio: tall ? "3/4" : "4/3" }} />
      ) : (
        <div style={{ aspectRatio: tall ? "3/4" : "4/3", background: `radial-gradient(circle at 25% 20%, ${b}, transparent 60%), linear-gradient(135deg, ${a}, ${c})` }} />
      )}
      <div className="p-3 space-y-2">
        {item.title && <p className="text-sm font-semibold leading-tight">{item.title}</p>}
        <div className="flex flex-wrap gap-1">{item.tags.slice(0, 3).map((t) => <span key={t} className="chip">{t}</span>)}</div>
        <div className="flex gap-1 items-center">
          {item.palette.slice(0, 4).map((p) => <span key={p} className="size-3.5 rounded-full border border-black/10" style={{ background: p }} />)}
          <span className="ml-auto text-[10px] eyebrow">{item.owner === "me" ? "You" : item.owner === "partner" ? "Partner" : "Family"}</span>
        </div>
      </div>
    </button>
  );
}
