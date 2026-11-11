# Vow — a wedding identity framework for Gen Z couples

## 1. Problem
Gen Z couples face **decision fatigue**, **family pressure** and **identity loss** (generic trends overriding what they actually want).
- Choice overload: past a point, more options lower satisfaction and raise anxiety (paradox of choice).
- 68% of Indian families report extreme wedding-planning stress; "ease of planning" is what millennials most want from platforms.
- Family pressure is the least-served need across existing platforms.

## 2. Insight
Every competitor is **additive** (more vendors, filters, pins). Pinterest is a volume engine. Nobody **subtracts**.
Vow's core loop is subtraction: 50+ saved ideas -> 3-5 themes -> one guide.
Reference product: mymind.com ("Remember everything. Organize nothing.") — save without filing, auto-tag, search-first, private. We keep that capture feel and add what it lacks: subtraction, two people, and family.

## 3. Segments
| Segment | Pressure | How Vow adapts |
|---|---|---|
| Love marriage | Partner alignment | Merge diagnostic is the hero |
| Arranged marriage | Family is structural | Family/Ours toggle and conflict view front and centre |
| Court marriage | May skip family | Family layer hidden entirely |

## 4. Features -> user outcome
| Feature | Where | Outcome |
|---|---|---|
| Merge diagnostic | /diagnostic | Identity feels shared, not negotiated |
| Moodboard + declutter (swipe keep / set aside, restorable) | /declutter | 50+ images -> 3-5 themes; relief from overload |
| Family / self toggle | header | Family ideas visible without taking over |
| Priority drag-sort | /priorities | Decide what matters before money is spent |
| Identity Guide (PDF + PNG share card) | /guide | A reference artifact to show family instead of re-litigating taste |
| Budget visualizer | /budget | Clarity without a live ledger or vendor upsell |
| "What this isn't" card | /guide | Stated exclusions defend the vision |

Plus: capture hub (note, camera, gallery, file), auto-tags, colour palette extraction, custom tags and notes, queryable search (tags, notes, colour names), "Add to share" into the master library.

## 5. Onboarding friction
No account. 2 steps (marriage type, names). One tap loads a sample couple. All data stays on the device.

## 6. Demo script (3 min)
1. Welcome -> Love marriage -> sample couple.
2. Home: 22 saved. Library: search "sage", add a note, upload an image (palette appears).
3. Declutter: swipe / arrow keys; restore one item from Set aside.
4. Merge: shared tags and colours, "just you" vs "just partner".
5. Toggle Family: aligned vs worth-a-conversation.
6. Priorities: drag Music above Venue. Budget re-splits instantly.
7. Guide: export PDF and share card.

## 7. Honest limits
Tagging is a keyword/colour heuristic (swappable for a vision model in `lib/tagging.ts`). Partner and family boards are simulated on one device; no real-time sharing. Validate with 5-8 couple interviews.
