"use client";
import { useApp } from "@/lib/store";

export default function FamilyToggle() {
  const { view, setView } = useApp();
  return (
    <div role="group" aria-label="Whose view" className="inline-flex rounded-full border border-line bg-card p-0.5 text-sm">
      {(["couple", "family"] as const).map((v) => (
        <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
          className={`rounded-full px-3.5 py-1.5 min-h-9 font-semibold transition ${view === v ? "bg-ink text-bg" : "text-muted"}`}>
          {v === "couple" ? "Ours" : "Family"}
        </button>
      ))}
    </div>
  );
}
