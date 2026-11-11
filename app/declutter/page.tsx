"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useApp } from "@/lib/store";
import { buildThemes } from "@/lib/cluster";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/types";

function Card({ item, onDecide }: { item: Item; onDecide: (keep: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const keepO = useTransform(x, [20, 120], [0, 1]);
  const dropO = useTransform(x, [-120, -20], [1, 0]);
  const decided = useRef(false);
  const fly = (keep: boolean) => { if (decided.current) return; decided.current = true; return animate(x, keep ? 600 : -600, { duration: 0.22 }).then(() => onDecide(keep)); };
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "ArrowRight") fly(true); if (e.key === "ArrowLeft") fly(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  return (
    <div className="space-y-4">
      <motion.div style={{ x, rotate, touchAction: "pan-y" }} drag="x" dragSnapToOrigin dragElastic={0.7}
        onDragEnd={(_, i) => { if (i.offset.x > 110) fly(true); else if (i.offset.x < -110) fly(false); }}
        className="relative max-w-sm mx-auto cursor-grab active:cursor-grabbing">
        <ItemCard item={item} compact />
        <motion.span style={{ opacity: keepO }} className="absolute top-4 left-4 chip !bg-sage !text-white rotate-[-8deg]">KEEP</motion.span>
        <motion.span style={{ opacity: dropO }} className="absolute top-4 right-4 chip !bg-accent !text-white rotate-[8deg]">NOT US</motion.span>
      </motion.div>
      <div className="flex justify-center gap-3">
        <button className="btn" onClick={() => fly(false)} aria-label="Not us">✕ Not us</button>
        <button className="btn btn-primary" onClick={() => fly(true)} aria-label="Keep">♡ Keep</button>
      </div>
    </div>
  );
}

export default function Declutter() {
  const { items, setStatus, view } = useApp();
  const queue = items.filter((i) => i.status === "pending" && (view === "family" || i.owner !== "family"));
  const declined = items.filter((i) => i.status === "declined");
  const kept = items.filter((i) => i.status === "kept");
  const themes = buildThemes(items);
  const total = queue.length + kept.length + declined.length;
  const done = kept.length + declined.length;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Declutter</p>
        <h1 className="h-serif text-3xl">Swipe away the noise.</h1>
        <p className="text-muted text-sm mt-1">Right keeps it. Left sets it aside — you can always bring it back. Arrow keys work too.</p>
        <div className="h-1.5 rounded-full bg-line mt-3 overflow-hidden"><div className="h-full bg-accent transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <p className="text-xs text-muted mt-1">{done} of {total} reviewed · {kept.length} kept</p>
      </div>

      {queue.length > 0 ? (
        <Card key={queue[0].id} item={queue[0]} onDecide={(k) => setStatus(queue[0].id, k ? "kept" : "declined")} />
      ) : (
        <div className="card p-6 text-center space-y-2">
          <p className="h-serif text-2xl">{total ? "That's the whole pile." : "Nothing to review yet."}</p>
          <p className="text-muted text-sm">{total ? `${total} down to ${themes.length || "a few"} themes.` : "Add inspiration in the Library first."}</p>
        </div>
      )}

      {themes.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Themes emerging from what you kept</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {themes.map((t) => (
              <div key={t.id} className="card p-4 space-y-2">
                <p className="h-serif text-lg">{t.name}</p>
                <div className="flex gap-1">{t.palette.map((p) => <span key={p} className="size-5 rounded-full border border-black/10" style={{ background: p }} />)}</div>
                <p className="text-xs text-muted">{t.items.map((i) => i.title).slice(0, 3).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="eyebrow mb-3">Set aside ({declined.length}) — tap to restore</p>
        {declined.length === 0 ? <p className="text-sm text-muted">Nothing set aside yet.</p> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {declined.map((i) => (
              <button key={i.id} onClick={() => setStatus(i.id, "pending")} className="card p-2 text-left opacity-70 hover:opacity-100" aria-label={`Restore ${i.title}`}>
                <div className="h-12 rounded-lg mb-1" style={{ background: `linear-gradient(135deg, ${i.palette[0] ?? "#ddd"}, ${i.palette[2] ?? i.palette[0] ?? "#bbb"})` }} />
                <p className="text-xs font-semibold leading-tight">{i.title}</p>
                <p className="text-[10px] text-accent">↺ restore</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
