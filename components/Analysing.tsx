"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/lib/types";
import { gradientFor } from "@/lib/palette";

const STAGES = ["Reading your cards", "Lining up colours and moods", "Seeing what keeps repeating", "Naming what we found"];

/** The "thinking" moment before themes appear. Purely for feel: the clustering itself takes a few milliseconds. */
export default function Analysing({ cards, onDone }: { cards: Card[]; onDone: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 700 : 3400;
    const tick = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), total / STAGES.length);
    const done = setTimeout(onDone, total);
    return () => { clearInterval(tick); clearTimeout(done); };
  }, [onDone]);

  const tiles = cards.slice(0, 28);
  const words = [...new Set(cards.flatMap((c) => [...c.tags.themes, ...c.tags.mood]))].slice(0, 12);
  return (
    <div className="fixed inset-0 z-[70] bg-bg/95 backdrop-blur grid place-items-center p-6" role="status" aria-live="polite">
      <div className="w-full max-w-xl text-center">
        <div className="grid grid-cols-7 gap-2 mb-8" aria-hidden>
          {tiles.map((c, i) => (
            <motion.div key={c.id} className="aspect-square rounded-xl" style={{ background: gradientFor(c.thumbColors ?? c.tags.colors.map((s) => s.hex)) }}
              initial={{ opacity: 0.25, scale: 0.9 }} animate={{ opacity: [0.25, 1, 0.5], scale: [0.9, 1.06, 1] }} transition={{ duration: 1.4, delay: (i % 7) * 0.12 + Math.floor(i / 7) * 0.18, repeat: Infinity, repeatDelay: 0.6 }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[64px]" aria-hidden>
          {words.map((w, i) => (
            <motion.span key={w} className="chip" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.2 }}>{w}</motion.span>
          ))}
        </div>
        <p className="h-serif text-3xl md:text-4xl">{STAGES[stage]}…</p>
        <div className="h-1 rounded-full bg-white/10 mt-6 overflow-hidden max-w-xs mx-auto"><motion.div className="h-full bg-cream" initial={{ width: "4%" }} animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} transition={{ duration: 0.7 }} /></div>
      </div>
    </div>
  );
}
