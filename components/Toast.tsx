"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";

interface ToastState { items: { id: number; text: string; tone: "ok" | "warn" }[]; push: (text: string, tone?: "ok" | "warn") => void }
let seq = 0;
const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (text, tone = "ok") => {
    const id = ++seq;
    set((s) => ({ items: [...s.items.slice(-2), { id, text, tone }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3600);
  },
}));
/** Fire a short message from anywhere: toast("Link copied"). */
export const toast = (text: string, tone: "ok" | "warn" = "ok") => useToasts.getState().push(text, tone);

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="fixed inset-x-0 bottom-24 md:bottom-8 z-[80] flex flex-col items-center gap-2 pointer-events-none px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className={`pointer-events-auto rounded-full px-4 py-2.5 text-sm shadow-2xl border ${t.tone === "warn" ? "bg-pending border-orange text-cream" : "bg-cream border-cream text-ink-black font-medium"}`}>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
