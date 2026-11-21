"use client";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { del, get, set as idbSet } from "idb-keyval";
import type { Budget, BudgetCategory, Card, CategoryId, Contact, IdentityGuide, Invite, LogEntry, Persona, Ranking, Role, SendStatus, Theme, Tier, ViewMode, Vote, WeddingType, Who } from "./types";
import { CATEGORIES, DEFAULT_ORDER } from "./categories";
import { rankToWeights } from "./budget";
import { mergeRankings, mergeTiers } from "./ranking";
import { DEFAULT_GROUPS, DEMO_CONTACTS, demoCards, sampleCards } from "./seed";
import { DEFAULT_MESSAGE } from "./services/invite";
import { partner } from "./services/partner";
import { delBlob } from "./blobs";
import { prettyDate } from "./format";

export interface Profile { weddingType: WeddingType; role: Role; names: [string, string]; date: string; location: string }

interface Data extends Profile {
  onboarded: boolean;
  persona: Persona; // whose eyes you are looking through ("partner view" is simulated on one device)
  view: ViewMode;
  partnerCode: string;
  cards: Card[];
  themes: Theme[];
  themesStamp: { count: number; at: number } | null;
  customCategories: BudgetCategory[];
  rankings: Record<Persona, Ranking>;
  ranked: Record<Persona, boolean>;
  mergedOrder: CategoryId[] | null;
  budget: Budget;
  budgetTouched: boolean;
  poolVotes: Record<string, Vote>;
  guide: IdentityGuide | null;
  contacts: Contact[];
  groups: string[];
  invites: Invite[];
  log: LogEntry[];
  countryCode: string;
}

interface Actions {
  hydrated: boolean;
  setHydrated: () => void;
  finishOnboarding: (p: Profile, mode: "demo" | "empty", now: number) => void;
  patchProfile: (p: Partial<Profile>) => void;
  loadDemo: (now: number) => void;
  setPersona: (p: Persona) => void;
  setView: (v: ViewMode) => void;
  addCards: (cards: Card[]) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  updateCards: (ids: string[], fn: (c: Card) => Partial<Card>) => void;
  removeCards: (ids: string[]) => void;
  setVote: (id: string, v: Vote | undefined) => void;
  setPoolVote: (id: string, v: Vote | undefined) => void;
  setThemes: (t: Theme[], now: number) => void;
  updateTheme: (id: string, patch: Partial<Theme>) => void;
  moveCardToTheme: (cardId: string, themeId: string | null) => void;
  setOrder: (who: Persona, order: CategoryId[]) => void;
  setTier: (who: Persona, id: CategoryId, tier: Tier) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: CategoryId) => void;
  setMergedOrder: (order: CategoryId[] | null) => void;
  setBudget: (patch: Partial<Budget>) => void;
  toggleLock: (id: CategoryId) => void;
  setGuide: (g: IdentityGuide | null) => void;
  addContacts: (c: Contact[]) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  removeContacts: (ids: string[]) => void;
  addGroup: (g: string) => void;
  removeGroup: (g: string) => void;
  addInvite: (i: Invite) => void;
  updateInvite: (id: string, patch: Partial<Invite>) => void;
  removeInvite: (id: string) => void;
  markSent: (inviteId: string, contactId: string, status: SendStatus | null) => void;
  addLog: (text: string, at: number) => void;
  setCountryCode: (cc: string) => void;
  importAll: (data: Partial<Data>) => void;
  resetAll: () => void;
}
export type State = Data & Actions;

const emptyRanking = (): Ranking => ({ order: [...DEFAULT_ORDER], tiers: {} });
const initial: Data = {
  onboarded: false,
  weddingType: "love", role: "both", names: ["You", "Partner"], date: "", location: "",
  persona: "A", view: "couple", partnerCode: "",
  cards: [], themes: [], themesStamp: null,
  customCategories: [], rankings: { A: emptyRanking(), B: emptyRanking() }, ranked: { A: false, B: false }, mergedOrder: null,
  budget: { total: 1_500_000, currency: "INR", guests: undefined, weights: null, locked: [], contingencyPct: 8 },
  budgetTouched: false,
  poolVotes: {}, guide: null,
  contacts: [], groups: [...DEFAULT_GROUPS], invites: [], log: [], countryCode: "91",
};

function starterInvites(p: Profile): Invite[] {
  const names = p.names.filter((n) => n && n !== "You" && n !== "Partner").join(" & ");
  const fields = { names: names || "", date: prettyDate(p.date), venue: p.location, rsvp: "" };
  return [
    { id: "inv-engagement", title: "Engagement Invite", templateId: "lotus", groups: ["Family", "Elders"], message: DEFAULT_MESSAGE.en.replace("getting married", "getting engaged"), lang: "en", fields, status: {} },
    { id: "inv-wedding", title: "Wedding Invite", templateId: "jaali", groups: [...DEFAULT_GROUPS], message: DEFAULT_MESSAGE.en, lang: "en", fields, status: {} },
  ];
}

// The whole store is persisted to IndexedDB (not localStorage), so guest lists and big boards never hit the 5MB cap.
const idbStorage: StateStorage = {
  getItem: async (name) => (typeof indexedDB === "undefined" ? null : (await get<string>(name)) ?? null),
  setItem: async (name, value) => { if (typeof indexedDB !== "undefined") await idbSet(name, value).catch((e) => { storageError = e instanceof Error ? e.message : "Could not save"; }); },
  removeItem: async (name) => { if (typeof indexedDB !== "undefined") await del(name); },
};
/** Last persistence failure (for example the browser's storage quota). Surfaced in Settings. */
export let storageError: string | null = null;
export const STORE_KEY = "aaroh-v1";

const DATA_KEYS = Object.keys(initial) as (keyof Data)[];
export const pickData = (s: State): Data => Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as Data;

export const useApp = create<State>()(
  persist(
    (set, getState) => ({
      hydrated: false,
      ...initial,
      setHydrated: () => set({ hydrated: true }),
      finishOnboarding: (p, mode, now) =>
        set({
          ...initial, ...p, onboarded: true, partnerCode: partner.createCode(p.names.join("|") + now),
          cards: mode === "demo" ? demoCards(now) : sampleCards(now),
          contacts: mode === "demo" ? DEMO_CONTACTS : [],
          invites: starterInvites(p),
        }),
      patchProfile: (p) => set(p),
      loadDemo: (now) =>
        set((s) => ({
          cards: [...demoCards(now), ...s.cards.filter((c) => !c.id.startsWith("demo-") && !c.sample)],
          contacts: s.contacts.length ? s.contacts : DEMO_CONTACTS,
          themes: [], themesStamp: null, guide: null,
        })),
      setPersona: (persona) => set({ persona }),
      setView: (view) => set({ view }),
      addCards: (cards) => set((s) => ({ cards: [...cards, ...s.cards] })),
      updateCard: (id, patch) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      updateCards: (ids, fn) => set((s) => ({ cards: s.cards.map((c) => (ids.includes(c.id) ? { ...c, ...fn(c) } : c)) })),
      removeCards: (ids) => {
        getState().cards.filter((c) => ids.includes(c.id)).forEach((c) => { void delBlob(c.blobKey); void delBlob(c.thumbKey); });
        set((s) => ({
          cards: s.cards.filter((c) => !ids.includes(c.id)),
          themes: s.themes.map((t) => ({ ...t, cardIds: t.cardIds.filter((id) => !ids.includes(id)) })).filter((t) => t.cardIds.length),
        }));
      },
      setVote: (id, v) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, identityVote: v } : c)) })),
      setPoolVote: (id, v) => set((s) => { const poolVotes = { ...s.poolVotes }; if (v) poolVotes[id] = v; else delete poolVotes[id]; return { poolVotes }; }),
      setThemes: (themes, now) => set((s) => ({ themes, themesStamp: { count: s.cards.length, at: now } })),
      updateTheme: (id, patch) => set((s) => ({ themes: s.themes.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      moveCardToTheme: (cardId, themeId) =>
        set((s) => {
          const total = s.cards.length || 1;
          return {
            themes: s.themes
              .map((t) => { const cardIds = t.id === themeId ? [...new Set([...t.cardIds, cardId])] : t.cardIds.filter((id) => id !== cardId); return { ...t, cardIds, pct: Math.round((cardIds.length / total) * 100) }; })
              .filter((t) => t.cardIds.length),
          };
        }),
      setOrder: (who, order) => set((s) => ({ rankings: { ...s.rankings, [who]: { ...s.rankings[who], order } }, ranked: { ...s.ranked, [who]: true }, mergedOrder: null, budget: { ...s.budget, weights: null, locked: [] } })),
      setTier: (who, id, tier) => set((s) => ({ rankings: { ...s.rankings, [who]: { ...s.rankings[who], tiers: { ...s.rankings[who].tiers, [id]: tier } } }, ranked: { ...s.ranked, [who]: true }, budget: { ...s.budget, weights: null, locked: [] } })),
      addCategory: (name) =>
        set((s) => {
          const clean = name.trim();
          if (!clean) return {};
          const id = "custom-" + clean.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          if ([...CATEGORIES, ...s.customCategories].some((c) => c.id === id)) return {};
          const add = (r: Ranking): Ranking => ({ ...r, order: [...r.order, id] });
          return { customCategories: [...s.customCategories, { id, name: clean, desc: "Your own category", icon: "Star", custom: true }], rankings: { A: add(s.rankings.A), B: add(s.rankings.B) }, mergedOrder: null, budget: { ...s.budget, weights: null, locked: [] } };
        }),
      removeCategory: (id) =>
        set((s) => {
          const drop = (r: Ranking): Ranking => ({ order: r.order.filter((x) => x !== id), tiers: Object.fromEntries(Object.entries(r.tiers).filter(([k]) => k !== id)) });
          return { customCategories: s.customCategories.filter((c) => c.id !== id), rankings: { A: drop(s.rankings.A), B: drop(s.rankings.B) }, mergedOrder: null, budget: { ...s.budget, weights: null, locked: [] } };
        }),
      setMergedOrder: (mergedOrder) => set((s) => ({ mergedOrder, budget: { ...s.budget, weights: null, locked: [] } })),
      setBudget: (patch) => set((s) => ({ budget: { ...s.budget, ...patch }, budgetTouched: true })),
      toggleLock: (id) => set((s) => ({ budget: { ...s.budget, weights: s.budget.weights ?? effectiveWeights(s), locked: s.budget.locked.includes(id) ? s.budget.locked.filter((x) => x !== id) : [...s.budget.locked, id] } })),
      setGuide: (guide) => set({ guide }),
      addContacts: (c) => set((s) => ({ contacts: [...s.contacts, ...c], groups: [...new Set([...s.groups, ...c.flatMap((x) => x.groups)])] })),
      updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeContacts: (ids) => set((s) => ({ contacts: s.contacts.filter((c) => !ids.includes(c.id)) })),
      addGroup: (g) => set((s) => (g.trim() && !s.groups.includes(g.trim()) ? { groups: [...s.groups, g.trim()] } : {})),
      removeGroup: (g) => set((s) => ({ groups: s.groups.filter((x) => x !== g), contacts: s.contacts.map((c) => ({ ...c, groups: c.groups.filter((x) => x !== g) })), invites: s.invites.map((i) => ({ ...i, groups: i.groups.filter((x) => x !== g) })) })),
      addInvite: (i) => set((s) => ({ invites: [...s.invites, i] })),
      updateInvite: (id, patch) => set((s) => ({ invites: s.invites.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      removeInvite: (id) => set((s) => ({ invites: s.invites.filter((i) => i.id !== id) })),
      markSent: (inviteId, contactId, status) =>
        set((s) => ({ invites: s.invites.map((i) => { if (i.id !== inviteId) return i; const st = { ...i.status }; if (status) st[contactId] = status; else delete st[contactId]; return { ...i, status: st }; }) })),
      addLog: (text, at) => set((s) => ({ log: [{ at, text }, ...s.log].slice(0, 200) })),
      setCountryCode: (countryCode) => set({ countryCode: countryCode.replace(/\D/g, "") || "91" }),
      importAll: (data) => set({ ...initial, ...data, onboarded: true }),
      resetAll: () => { getState().cards.forEach((c) => { void delBlob(c.blobKey); void delBlob(c.thumbKey); }); set({ ...initial }); },
    }),
    {
      name: STORE_KEY,
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => pickData(s) as unknown as State,
      onRehydrateStorage: () => (state, error) => { if (error) storageError = "Could not read saved data"; useApp.getState().setHydrated(); void state; },
    }
  )
);

// ---------- selectors (pure, usable outside React) ----------
type RankSlice = Pick<Data, "customCategories" | "rankings" | "ranked" | "mergedOrder" | "budget">;
export const allCategories = (s: Pick<Data, "customCategories">): BudgetCategory[] => [...CATEGORIES, ...s.customCategories];
export const categoryName = (s: Pick<Data, "customCategories">, id: CategoryId) => allCategories(s).find((c) => c.id === id)?.name ?? id;

/** The ranking that drives the budget: an explicit merged order, else the average of both partners, else whoever has ranked. */
export function effectiveOrder(s: RankSlice): CategoryId[] {
  if (s.mergedOrder) return s.mergedOrder;
  if (s.ranked.A && s.ranked.B) return mergeRankings(s.rankings.A.order, s.rankings.B.order).order;
  return s.ranked.B && !s.ranked.A ? s.rankings.B.order : s.rankings.A.order;
}
export function effectiveTiers(s: RankSlice): Record<CategoryId, Tier> {
  if (s.ranked.A && s.ranked.B) return mergeTiers(s.rankings.A.tiers, s.rankings.B.tiers, s.rankings.A.order);
  return s.ranked.B && !s.ranked.A ? s.rankings.B.tiers : s.rankings.A.tiers;
}
export const effectiveWeights = (s: RankSlice): Record<CategoryId, number> => s.budget.weights ?? rankToWeights(effectiveOrder(s), effectiveTiers(s));

export const whoName = (names: [string, string], who: Who) => (who === "A" ? names[0] : who === "B" ? names[1] : "Family");
/** Who a new card belongs to: the current persona, or family when looking through the family lens. */
export const currentAdder = (s: Pick<Data, "persona" | "view">): Who => (s.view === "family" ? "family" : s.persona);
