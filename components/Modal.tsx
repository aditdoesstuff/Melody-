"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/** Bottom sheet on phones, centred dialog on larger screens. Escape and backdrop click close it. */
export default function Modal({ title, onClose, children, wide = false, labelledBy }: { title?: string; onClose: () => void; children: React.ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="presentation">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/75" onClick={onClose} />
      <motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full ${wide ? "md:max-w-5xl" : "md:max-w-lg"} max-h-[92dvh] overflow-y-auto bg-surface border border-tan/60 rounded-t-[28px] md:rounded-[28px] p-5 md:p-8 outline-none`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          {title ? <h2 className="h-serif text-3xl md:text-4xl">{title}</h2> : <span />}
          <button onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mr-2 -mt-2 shrink-0"><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
