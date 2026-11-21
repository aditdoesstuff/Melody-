# AAROH — Product Build Guide (for Claude Code)

> Paste this whole file into Claude Code as the first prompt, or save it as `CLAUDE.md` / `docs/BUILD_GUIDE.md` in the repo root and say: **"Read BUILD_GUIDE.md fully, then execute Phase 0."**

---

## 0. How to work (read first)

- You are building a **working front-end prototype** of **aaroh**, a web app for Gen Z couples planning weddings.
- **No real backend exists.** Everything must *feel* real: persistence, AI tagging, sharing, sending invites. Use local storage + mock adapters (see §6).
- Build in **phases** (§9). After each phase: run the app, fix errors, summarise what works, then continue. Do not skip ahead.
- Ask me **at most one** question, and only if blocked. Otherwise pick a sensible default and note it in `DECISIONS.md`.
- Keep a running `DECISIONS.md` (what you chose and why) and `README.md` (how to run).
- Quality bar: it should look like a shipped product, not a hackathon demo. No lorem ipsum, no broken buttons, no dead links.

---

## 1. Product context

**Product:** aaroh — a personalised wedding framework for Gen Z couples.

**Problem:** Decision fatigue + endless options. Couples fear losing their identity, so they fall back on generic Pinterest templates. Their inspiration is scattered across Instagram, Pinterest, WhatsApp and Spotify as screenshots, links, files and notes, and never gets organised.

**Promise:** Declutter first, then decide. One place to dump everything → aaroh finds the couple's themes → they rank what matters → they get an identity guide + budget they can share.

**Delight factor:** a MyMind-style "dump anything, find anything" space with **zero onboarding friction** and **AI-tagged, searchable cards**.

**Users:** two partners (often long-distance or in different cities), age 22–32, mobile-first, allergic to forms and jargon.

---

## 2. Brand (CRITICAL)

Brand guidelines and logo are supplied by me separately.

1. Look for them in `/brand` (or `/assets`, or any file I point to). Read every file there before writing UI code.
2. Extract into `src/styles/tokens.css` and `tailwind.config`: colours, typography (families, scale, weights), spacing, radii, shadows, motion, iconography style.
3. Use the real logo files (SVG preferred) in header, favicon, loading state, share cards and the exported guide.
4. If brand files are missing, **stop and tell me**. Do not invent a brand. As a temporary fallback only, use neutral tokens clearly marked `/* TEMP — replace with brand */`.
5. Write all copy in the brand voice from the guidelines. Default tone if unspecified: warm, witty, short sentences, never corporate, never "bridezilla" clichés. Address the couple as "you two".

---

## 3. Tech stack (defaults, override only with reason)

| Concern | Choice |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS + CSS variables from brand tokens |
| Routing | React Router |
| State | Zustand, persisted |
| Storage | IndexedDB via `idb-keyval` or Dexie (images/blobs); localStorage for small settings |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` (touch + keyboard support) |
| Motion | Framer Motion |
| Search | Fuse.js (fuzzy) + tag filters |
| Charts | Hand-built SVG/CSS bars (no heavy chart lib) |
| Image colour | `colorthief` or `node-vibrant` for palette extraction |
| Export | `html-to-image` for PNG, `jspdf` optional for PDF |
| Icons | Lucide, unless brand specifies otherwise |
| Tests | Vitest for logic (ranking, budget maths, search); a Playwright smoke test for the main flow |

PWA-ready (manifest + icons) so it installs to the home screen. **Mobile-first**, then tablet/desktop.

---

## 4. App structure

### Information architecture
```
/                    Landing + instant "Start your space" (no signup)
/space               The Mind: all cards, search, filters (home)
/space/add           Quick-add sheet (modal on mobile)
/diagnostic          Merge Diagnostic (themes from your cards)
/priorities          Priority Drag Sort
/identity            Identity Guide builder (swipe/keep-reject, then guide)
/budget              Budget Visualizer
/invites             Invite sender
/share/:id           Read-only shared view (identity guide / budget)
/settings            Partner link, export data, reset
```

### Navigation
- Mobile: bottom tab bar → **Space · Themes · Priorities · Identity · Budget**; Invites reachable from a persistent floating action or the home screen.
- Desktop: left rail with the same items.
- A visible **progress rail** ("Dump → Themes → Priorities → Identity → Budget → Invite") so couples always know the next step. Each step unlocks a clear "Next" CTA when its output exists.

### Zero-friction onboarding
- No account wall. Land → type your names (2 fields, optional) → you're in the Space. That's it.
- Optional "Add your partner" via a share link/code (mocked, see §6.4).
- Seed an **empty state that teaches**: 3 sample cards couples can delete, plus a one-line prompt "Drop a screenshot, paste a link, or type a thought."
- Offer a **"Load demo couple"** button in Settings that fills 60 realistic cards so every feature can be demoed instantly. Required for investor/judge demos.

---

## 5. Features (acceptance criteria)

### 5.0 The Space (MyMind-style core, build FIRST)
Everything else feeds off this.

**Capture types (all must work):**
- Image upload (drag-drop, file picker, paste from clipboard, multi-select)
- Link paste (URL → card with title, domain, thumbnail; mock the unfurl if offline, using the domain + a generated gradient thumb)
- Text note (quick, no title required)
- File (PDF/doc) → card with filename + icon
- Colour swatch (from image or hex)
- Optional: "Add from…" shortcuts labelled Instagram / Pinterest / WhatsApp / Spotify that open a paste-link flow and tag the source

**Card behaviour:**
- Masonry grid, variable heights, smooth layout animation.
- Each card auto-gets **AI tags** (see §6.1): theme words, colours, mood, wedding-category (e.g. decor, outfit, venue, music, food, photography), source.
- Tap a card → detail drawer: large preview, editable tags, note field, "similar cards", delete, "pin to identity guide".
- **Search is the hero.** One persistent search bar. Must support natural queries: `warm outdoor evening`, `green`, `lehenga`, `playlist`, `things from instagram`. Combine fuzzy text match across tags, notes, titles, colours, and source. Show result count and "clear".
- Filter chips: type, source, category, colour, "untagged".
- Bulk select → tag / delete / move to a theme.
- Instant, optimistic UI: cards appear immediately with a shimmer "tagging…" state, then tags animate in after ~0.8–1.5s.

**Done when:** I can drop 50 images, they get tagged, and searching "pastel mandap" returns sensible results in under 100ms.

### 5.1 Merge Diagnostic
Turn 50+ cards into **3–5 clear themes**.

- Trigger: "Find our themes" button (enabled at ≥ 12 cards; show a progress hint below that).
- Run a believable **analysis animation** (scanning cards, tags flowing together, ~3–4s).
- Algorithm (client-side, deterministic): cluster cards by tag vector similarity + dominant colours (k-means or agglomerative, k chosen 3–5 by silhouette or a simple heuristic).
- Output per theme: **name** (evocative, brand-voice, e.g. "Golden-hour garden"), 1-line description, 6-card mini mood board, palette (5 swatches), top 5 tags, % of your saved content.
- Support **two partners**: if cards carry an `addedBy` field, show **overlap** ("You both love…") vs **divergence** ("Only you…" / "Only they…"). This is the "merge" in Merge Diagnostic, so make it a visible section, with a "compromise theme" suggestion that blends both.
- Actions: rename theme, move cards between themes, lock/unlock a theme, re-run.
- Persist result; invalidate gently when many new cards are added ("12 new cards, refresh themes?").

### 5.2 Priority Drag Sort
Decide **where money matters** before any number is typed.

- ~10–12 category cards: Venue, Catering, Decor & Florals, Photography & Video, Outfits, Music & Entertainment, Makeup & Styling, Invitations & Stationery, Travel & Stay, Honeymoon, Gifts & Favours, Planner/Coordination. Each card: icon, one-line description.
- Drag to rank into an ordered list (1 = most important). Also support **tap-to-move up/down buttons** and keyboard reordering for accessibility.
- Optional "tier" gutters (Must-have / Nice-to-have / Skip) that the user can drop into; ranking within tiers.
- Allow **custom category** add.
- If two partners: each ranks independently, then show **"Merge rankings"** view highlighting disagreements (big rank gaps) with a lightweight "meet in the middle" resolver (average rank, user can override).
- Rank is saved to the store and **directly feeds** the Budget Visualizer (§5.4). Show a live "this will shape your budget" hint.

### 5.3 Identity Guide
Show people your **exact taste**.

- **Step 1: Keep / Not-for-us.** Pinterest-style swipe or two-column tap flow over the user's own cards (and a curated pool of ~40 bundled placeholder inspiration images/tiles to fill gaps if the Space is thin). Three outcomes per card: **Yes / No / Maybe**. Fast, thumb-friendly, undoable.
- **Step 2: Generate.** From Yes/No data, produce the guide:
  - **Palette** (primary, secondary, accent, neutrals; with hex + a name for each)
  - **Tone words / tonality** (e.g. "intimate, playful, unfussy") with a short sentence on each
  - **Do's** (5–8) and **Don'ts** (5–8), derived from tags of Yes vs No cards
  - **Hero moodboard** (best 8–12 Yes images)
  - **"Never" board** (strongest No images, blurred by default, tap to reveal)
  - Theme names pulled from the Diagnostic
  - A **one-line identity statement** ("A slow, candle-lit celebration that feels like our living room, scaled up.")
- **Design it like a brand sheet**, using aaroh's brand but as a beautiful, print-worthy layout.
- **Shareable** (§5.5): export as image/PDF, copy a link, share to WhatsApp. Vendors/family should be able to read it in 20 seconds.
- Editable: couples can tweak palette, words, do's/don'ts before sharing.

### 5.4 Budget Visualizer
- Inputs: **total budget** (₹ default, currency switcher INR/USD/GBP/EUR; Indian digit grouping when INR), optional guest count.
- **Priority weights:** initialise from the ranking in §5.2 (e.g. rank-based weights), shown as sliders per category that the user can fine-tune. Locking a category fixes its amount and redistributes the rest.
- Show: a **stacked horizontal bar** (whole budget) + per-category bars with amount and %. Animate on change.
- Rules: weights always sum to 100%; amounts round cleanly; show a **"Contingency 5–10%"** line by default (editable).
- Insights panel (rule-based, 2–3 short lines): e.g. "Venue + catering take 58%, typical for guest-heavy weddings", "You ranked photography #2 but gave it 6%, want to nudge it?".
- Per-guest cost metric if guest count given.
- Compare **Scenario A / B** (duplicate and tweak) is a stretch goal.
- Shareable (§5.5), exportable as image/CSV.

### 5.5 Sharing (cross-cutting)
- Every output (Themes, Identity Guide, Budget) has a **Share** button.
- Sheet with: **Copy link**, **Share to WhatsApp**, **Save as image**, **Save as PDF**, Web Share API when available.
- Link works by encoding a **compact snapshot** of the output into the URL (compressed JSON, e.g. `lz-string`, in the hash) rendered by `/share/:id`, or by storing the snapshot in IndexedDB and using a short mocked id for same-device demos. Prefer the URL-encoded approach so a link genuinely works on another device without a backend. Image blobs shouldn't go in the URL: in shared views use palette, text, and theme tiles, or bundled thumbnails.
- Shared view is read-only, branded, with a soft CTA "Make yours on aaroh".

### 5.6 Invite Sender
Send invite cards to chosen contacts via **SMS or WhatsApp**.

**Flow:** Pick card → choose contacts → choose channel → preview message → send.

- **Invite card:** choose from 4–6 bundled templates tinted by the couple's palette; editable fields (names, date, venue, RSVP link/phone). Render to PNG via `html-to-image`.
- **Contacts input (works regardless of backend/browser):**
  1. Try the **Contact Picker API** (`navigator.contacts.select(['name','tel'], {multiple: true})`) where supported (Android Chrome).
  2. Fallback A: **import CSV / vCard (.vcf)** file.
  3. Fallback B: **paste numbers** (one per line, "Name, number").
  4. Fallback C: **manual add** row.
  5. Provide a **"Use demo contacts"** button with ~12 fake contacts so the flow demos anywhere.
- Contact list UI: search, select-all, checkboxes, group tags (Family / Friends / Work / Elders), invalid-number warnings, de-dupe, E.164 normalisation (default country +91, configurable).
- **Channels:**
  - **WhatsApp:** open `https://wa.me/<number>?text=<encoded message>` per contact.
  - **SMS:** open `sms:<number>?&body=<encoded message>` (note the `?&body=` form works across iOS and Android).
  - Because deep links open one chat at a time, build a **queue UI**: "Send to Riya (1 of 12) → Next". Mark each as sent/skipped, with progress.
  - Include the card: use Web Share API with `files` where supported (so the image attaches), else a **"Download card"** button plus the message with a hosted/shared link.
- **Message templating:** `{name}` personalisation, editable message, character counter for SMS, language toggle (English / Hinglish default copies).
- **Honest status:** an activity log "Opened WhatsApp for Riya" (we can't verify delivery). Never claim "delivered". Surface a small note: "aaroh opens your messaging app, you tap send."
- **Privacy:** contacts stay on-device in IndexedDB; show a one-line privacy note and a "Clear contacts" button.

---

## 6. Mocking strategy (backend not available)

Create `src/services/` with interfaces and **swap-able adapters**, so a real backend can be plugged in later without touching UI.

### 6.1 AI tagging: `TaggingService`
```ts
interface TaggingService {
  tagImage(file: Blob): Promise<Tags>;
  tagText(text: string): Promise<Tags>;
  tagLink(url: string): Promise<Tags>;
}
```
- **Default `MockTaggingService`:** deterministic and believable. For images: extract dominant colours (colorthief), map colours to mood words, combine with filename/URL keywords and a bundled dictionary (≈300 wedding terms across decor, attire, venue, food, music, photography). For text/links: keyword extraction + domain heuristics (instagram.com → "social", open.spotify.com → "music/playlist").
- Add small random-but-seeded latency (600–1500ms) for realism.
- **Optional `ClaudeVisionTaggingService`** behind an env flag (`VITE_TAGGING=claude`) that calls a thin proxy endpoint. Provide the interface only and document it. Never put API keys in client code.
- Tags schema: `{ themes: string[], mood: string[], colors: {hex,name}[], category: Category, objects: string[], source?: string }`.

### 6.2 Storage: `Store`
- Zustand with persistence. Blobs in IndexedDB; keep thumbnails (max 800px) to stay fast. Handle quota errors gracefully.
- Export/Import all data as a single `.json` (and a "Reset everything" in Settings).

### 6.3 Link unfurl: `UnfurlService`
- Mock: derive title from URL slug, favicon from domain, generated gradient thumbnail. No network dependency.

### 6.4 Partner sync: `PartnerService`
- Mock "Add your partner": generate a 6-char code; "partner" is simulated by a **Partner Preview mode** (toggle in Settings: "Switch to partner view") which swaps `addedBy` and ranking context so both-sides flows (overlap, merged rankings) are fully demoable on one device. State this plainly in the UI so nobody thinks it's real-time sync.

### 6.5 Sending: `InviteService`
- Real deep links (wa.me, sms:) plus the mock activity log. This one genuinely works without a backend.

---

## 7. Data model (starting point)

```ts
type Card = {
  id: string; type: 'image'|'link'|'text'|'file'|'color';
  createdAt: number; addedBy: 'A'|'B';
  title?: string; note?: string; url?: string; source?: 'instagram'|'pinterest'|'whatsapp'|'spotify'|'upload'|'web'|'manual';
  blobKey?: string; thumbKey?: string; text?: string;
  tags: Tags; tagStatus: 'pending'|'done'|'error';
  themeId?: string; identityVote?: 'yes'|'no'|'maybe';
};
type Theme = { id: string; name: string; description: string; cardIds: string[]; palette: string[]; topTags: string[]; locked?: boolean };
type Ranking = { by: 'A'|'B'|'merged'; order: CategoryId[]; tiers?: Record<CategoryId,'must'|'nice'|'skip'> };
type Budget = { total: number; currency: string; guests?: number; weights: Record<CategoryId, number>; locked: CategoryId[]; contingencyPct: number };
type IdentityGuide = { palette: Swatch[]; tones: {word:string; line:string}[]; dos: string[]; donts: string[]; statement: string; heroCardIds: string[]; neverCardIds: string[] };
type Contact = { id: string; name: string; phone: string; group?: string; status?: 'pending'|'opened'|'skipped' };
```

Budget maths must live in a **pure, unit-tested** module (`lib/budget.ts`): rank → weights, lock/redistribute, rounding with largest-remainder so totals match exactly.

---

## 8. UX, design and quality rules

- **Mobile-first**, thumb-reachable actions, min tap target 44px.
- **Delight over decoration:** purposeful motion only (card entry, tag reveal, theme clustering, bar growth, confetti-free celebration at the "Guide ready" moment, using brand motifs).
- **Empty, loading, error, and offline states** for every screen. Skeletons, not spinners.
- **Accessibility:** WCAG AA contrast, focus rings, keyboard DnD, `prefers-reduced-motion` respected, alt text from tags.
- **Performance:** lazy-load routes, virtualise the grid beyond ~200 cards, compress uploads client-side, Lighthouse mobile ≥ 90.
- **Copy:** short, human, no wedding-industry clichés. Microcopy matters: button labels like "Find our themes", never "Submit".
- **Inclusive defaults:** gender-neutral language; no assumption of religion, ceremony format, or couple composition. Support multi-day/multi-ceremony weddings in categories (e.g. optional "Sangeet/Mehendi/Reception" tags).
- No dark patterns, no fake urgency, no fake social proof.
- Do **not** use real copyrighted images. Use generated gradients/placeholders or licensed/free assets (Unsplash-style, with credits in `CREDITS.md`) for demo content.

---

## 9. Build phases (execute in order)

| Phase | Deliverable | Exit check |
|---|---|---|
| **0. Setup** | Vite+TS app, Tailwind, router, tokens from `/brand`, logo in header, folder structure, lint/format, `README`, `DECISIONS.md` | `npm run dev` shows branded shell with working nav |
| **1. Space** | Capture (image/link/text/file/colour), mock tagging, masonry grid, detail drawer, search + filters, persistence, "Load demo couple" | Drop 20 images → tagged → searchable; reload keeps everything |
| **2. Merge Diagnostic** | Clustering, theme naming, mood boards, partner overlap view, edit/lock | Demo data yields 3–5 sensible themes |
| **3. Priority Drag Sort** | DnD + tap/keyboard reorder, tiers, custom category, merged view | Ranking persists and is readable by Budget |
| **4. Budget Visualizer** | Weights from ranking, sliders, locks, stacked bar, insights, currency | Totals always exact; changing rank updates budget |
| **5. Identity Guide** | Keep/No/Maybe flow, guide generation, editable, brand-sheet layout | Guide renders with palette, tones, do/don't, statement |
| **6. Sharing** | Share sheet, URL-encoded snapshots, `/share/:id`, PNG/PDF export | Open a copied link in a private window → renders |
| **7. Invite Sender** | Card builder, contact input (picker + fallbacks), queue UI, WhatsApp/SMS deep links, log | Full flow works with demo contacts on desktop and phone |
| **8. Polish** | Onboarding, empty/error states, motion pass, a11y pass, PWA, perf pass | Lighthouse + manual checklist (§10) pass |

After each phase: run the app, test on a 390px viewport, fix issues, and commit with a clear message.

---

## 10. Definition of done (checklist)

- [ ] Zero-signup start; first card added in < 20 seconds
- [ ] All four core features plus sharing and invites work end-to-end with demo data **and** with real user input
- [ ] Ranking → Budget connection verified (change rank, see budget move)
- [ ] Themes → Identity Guide connection verified
- [ ] Search returns relevant results for ≥ 10 varied natural queries (list them in `DECISIONS.md`)
- [ ] Share link opens correctly on a second device/browser profile
- [ ] Invite flow: SMS and WhatsApp links open correctly with the encoded message
- [ ] Brand tokens and logo applied everywhere; no placeholder branding left
- [ ] No console errors; unit tests pass; Playwright smoke test passes
- [ ] Works at 360px, 768px, 1280px; keyboard-navigable; reduced-motion respected
- [ ] README explains how to run, how mocks work, and how to swap in real backends

---

## 11. Out of scope for now

Real auth, real-time partner sync, payments, vendor marketplace, server-side AI, delivery receipts for messages. Leave clean adapter seams (§6) and document them in `README.md` under "Going to production".

---

## 12. Final output expected from you (Claude Code)

1. The working app in this repo.
2. `README.md`, `DECISIONS.md`, `CREDITS.md`.
3. A short **demo script** (`DEMO.md`): a 3-minute click path showing Space → Themes → Priorities → Budget → Identity → Share → Invite.
4. A closing summary: what's done, what's mocked, known gaps, and the top 5 next steps.

**Start now with Phase 0. Read `/brand` first.**
