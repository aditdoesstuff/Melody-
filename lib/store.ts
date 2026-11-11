"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item, MarriageType, Owner, Status, ViewMode } from "./types";
import { PRIORITY_DEFAULTS, seedItems } from "./seed";

interface State {
  hydrated: boolean;
  onboarded: boolean;
  marriageType: MarriageType;
  names: [string, string];
  items: Item[];
  activeOwner: Owner; // whose board you are adding to
  view: ViewMode; // couple vs family lens
  priorities: string[]; // ordered, most important first
  budget: number; // total INR
  weights: Record<string, number>; // manual overrides 0-100 by priority name
  setHydrated: () => void;
  finishOnboarding: (type: MarriageType, names: [string, string], demo: boolean) => void;
  addItem: (i: Omit<Item, "id" | "createdAt" | "status"> & { status?: Status }) => void;
  setStatus: (id: string, s: Status) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  setActiveOwner: (o: Owner) => void;
  setView: (v: ViewMode) => void;
  setPriorities: (p: string[]) => void;
  setBudget: (n: number) => void;
  setWeight: (k: string, v: number | null) => void;
  resetAll: () => void;
}

const initial = {
  onboarded: false,
  marriageType: "love" as MarriageType,
  names: ["You", "Partner"] as [string, string],
  items: [] as Item[],
  activeOwner: "me" as Owner,
  view: "couple" as ViewMode,
  priorities: PRIORITY_DEFAULTS,
  budget: 1500000,
  weights: {} as Record<string, number>,
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      ...initial,
      setHydrated: () => set({ hydrated: true }),
      finishOnboarding: (marriageType, names, demo) =>
        set({ onboarded: true, marriageType, names, items: demo ? seedItems() : [], view: "couple", activeOwner: "me" }),
      addItem: (i) =>
        set((s) => ({ items: [{ ...i, status: i.status ?? "pending", id: crypto.randomUUID(), createdAt: Date.now() }, ...s.items] })),
      setStatus: (id, status) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, status } : x)) })),
      updateItem: (id, patch) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      setActiveOwner: (activeOwner) => set({ activeOwner }),
      setView: (view) => set({ view }),
      setPriorities: (priorities) => set({ priorities, weights: {} }),
      setBudget: (budget) => set({ budget }),
      setWeight: (k, v) =>
        set((s) => {
          const w = { ...s.weights };
          if (v === null) delete w[k];
          else w[k] = v;
          return { weights: w };
        }),
      resetAll: () => set({ ...initial, items: [] }),
    }),
    {
      name: "vow-identity-v1",
      skipHydration: true,
      partialize: (s) => ({
        onboarded: s.onboarded, marriageType: s.marriageType, names: s.names, items: s.items,
        activeOwner: s.activeOwner, view: s.view, priorities: s.priorities, budget: s.budget, weights: s.weights,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

// Allocation: rank-based share (earlier = bigger) unless the couple overrides a weight.
export function allocate(priorities: string[], weights: Record<string, number>, budget: number) {
  const base = priorities.map((p, i) => ({ name: p, w: weights[p] ?? Math.max(priorities.length - i, 1) ** 1.6 }));
  const total = base.reduce((a, b) => a + b.w, 0) || 1;
  return base.map((b) => ({ name: b.name, pct: (b.w / total) * 100, amount: Math.round(((b.w / total) * budget) / 1000) * 1000 }));
}
