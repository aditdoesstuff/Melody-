import { describe, expect, it } from "vitest";
import { mergeRankings, mergeTiers, move, isDisagreement } from "@/lib/ranking";
import { clusterCards } from "@/lib/cluster";
import { mergeDiagnostic } from "@/lib/merge";
import { buildIndex } from "@/lib/search";
import { demoCards } from "@/lib/seed";
import { INSPIRATION } from "@/lib/inspiration";
import { generateGuide } from "@/lib/identity";
import { normalisePhone, parseCsv, parseLines, parseVcf, toContacts } from "@/lib/phone";
import { decodeSnapshot, encodeSnapshot } from "@/lib/share";
import { sourceFromUrl, tagFrom } from "@/lib/tagging";
import { fillMessage, smsLink, smsParts, waLink } from "@/lib/services/invite";
import { MockUnfurlService, normaliseUrl } from "@/lib/services/unfurl";
import { money } from "@/lib/format";
import type { ShareSnapshot } from "@/lib/types";

const cards = demoCards(1_700_000_000_000);

describe("ranking", () => {
  it("meets in the middle and reports gaps", () => {
    const { order, rows } = mergeRankings(["a", "b", "c", "d", "e"], ["e", "b", "c", "d", "a"]);
    expect(order).toHaveLength(5);
    expect(order[0]).toBe("b");
    expect(rows.filter(isDisagreement).map((r) => r.id).sort()).toEqual(["a", "e"]);
  });
  it("merges tiers conservatively", () => expect(mergeTiers({ a: "skip", b: "skip" }, { a: "skip", b: "must" }, ["a", "b", "c"])).toEqual({ a: "skip", b: "nice", c: "must" }));
  it("moves items", () => expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]));
});

describe("clustering", () => {
  const themes = clusterCards(cards);
  it("turns the demo couple into 3 to 5 named themes", () => {
    expect(themes.length).toBeGreaterThanOrEqual(3);
    expect(themes.length).toBeLessThanOrEqual(5);
    expect(new Set(themes.map((t) => t.name)).size).toBe(themes.length);
    themes.forEach((t) => { expect(t.cardIds.length).toBeGreaterThanOrEqual(3); expect(t.palette.length).toBeGreaterThan(0); expect(t.topTags.length).toBeGreaterThan(0); });
  });
  it("puts every card in at most one theme", () => {
    const ids = themes.flatMap((t) => t.cardIds);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("is deterministic", () => expect(clusterCards(cards).map((t) => [t.name, t.cardIds])).toEqual(themes.map((t) => [t.name, t.cardIds])));
  it("keeps locked themes intact on re-run", () => {
    const locked = { ...themes[0], name: "Ours, do not touch", locked: true };
    const again = clusterCards(cards, [locked]);
    expect(again[0].name).toBe("Ours, do not touch");
    expect(again[0].cardIds).toEqual(locked.cardIds);
    expect(again.length).toBeLessThanOrEqual(5);
  });
});

describe("partner overlap", () => {
  it("finds shared and one-sided taste", () => {
    const m = mergeDiagnostic(cards);
    expect(m.score).toBeGreaterThan(0);
    expect(m.shared.length).toBeGreaterThan(0);
    expect(m.onlyA.length + m.onlyB.length).toBeGreaterThan(0);
  });
});

describe("search", () => {
  const index = buildIndex(cards, { A: "Anya", B: "Anuj", family: "Family" });
  const byId = new Map(cards.map((c) => [c.id, c]));
  const top = (q: string, n = 5) => index.search(q).slice(0, n).map((id) => byId.get(id)!);
  const cases: [string, (c: (typeof cards)[number]) => boolean][] = [
    ["warm outdoor evening", (c) => c.tags.mood.includes("warm") || c.tags.themes.some((t) => ["garden", "candlelit", "courtyard"].includes(t))],
    ["green", (c) => c.tags.colors.some((s) => ["sage", "green"].includes(s.name)) || c.tags.themes.includes("garden")],
    ["lehenga", (c) => c.tags.objects.includes("lehenga")],
    ["playlist", (c) => c.tags.category === "music"],
    ["things from instagram", (c) => c.source === "instagram"],
    ["pastel mandap", (c) => c.tags.objects.includes("mandap") || c.tags.themes.includes("pastel")],
    ["candle", (c) => c.tags.themes.includes("candlelit") || c.tags.objects.includes("candles")],
    ["marigold", (c) => JSON.stringify(c).toLowerCase().includes("marigold")],
    ["notes", (c) => c.type === "text"],
    ["pinterest", (c) => c.source === "pinterest"],
    ["small cosy dinner", (c) => c.tags.themes.includes("intimate") || c.tags.mood.includes("warm")],
    ["invite", (c) => c.tags.category === "stationery"],
  ];
  for (const [q, ok] of cases) {
    it(`"${q}" returns relevant cards first`, () => {
      const res = top(q);
      expect(res.length).toBeGreaterThan(0);
      expect(res.filter(ok).length / res.length).toBeGreaterThanOrEqual(0.6);
      expect(ok(res[0])).toBe(true);
    });
  }
  it("tolerates typos", () => expect(top("lehnga").some((c) => c.tags.objects.includes("lehenga"))).toBe(true));
  it("returns everything for an empty query", () => expect(index.search("  ")).toHaveLength(cards.length));
  it("stays under 100ms on 3,000 cards", () => {
    const big = Array.from({ length: 50 }, (_, k) => cards.map((c) => ({ ...c, id: `${c.id}-${k}` }))).flat();
    const idx = buildIndex(big);
    const t = performance.now();
    idx.search("pastel mandap");
    expect(performance.now() - t).toBeLessThan(100);
  });
});

describe("identity guide", () => {
  const pool = INSPIRATION.slice(0, 6).map((c, i) => ({ ...c, identityVote: (i % 2 ? "no" : "yes") as "yes" | "no" }));
  const g = generateGuide([...cards, ...pool], clusterCards(cards), 1);
  it("produces every section", () => {
    expect(g.palette.length).toBeGreaterThanOrEqual(4);
    expect(new Set(g.palette.map((p) => p.hex)).size).toBe(g.palette.length);
    expect(g.tones.length).toBeGreaterThanOrEqual(2);
    expect(g.dos.length).toBeGreaterThanOrEqual(5);
    expect(g.donts.length).toBeGreaterThanOrEqual(3);
    expect(g.statement).toMatch(/celebration that feels like/);
    expect(g.heroCardIds.length).toBeGreaterThan(0);
    expect(g.neverCardIds.length).toBeGreaterThan(0);
    expect(g.themeNames.length).toBeGreaterThanOrEqual(3);
  });
  it("never lists the same idea as both a do and a don't", () => expect(g.dos.some((d) => g.donts.includes(d))).toBe(false));
  it("copes with no votes at all", () => expect(generateGuide([], [], 1).statement).toMatch(/Keep a few cards/));
});

describe("phones and contact import", () => {
  it("normalises to E.164 with +91 by default", () => {
    expect(normalisePhone("98765 43210")).toEqual({ phone: "+919876543210", valid: true });
    expect(normalisePhone("09876543210").phone).toBe("+919876543210");
    expect(normalisePhone("+91-98765-43210").phone).toBe("+919876543210");
    expect(normalisePhone("0044 7700 900123").phone).toBe("+447700900123");
    expect(normalisePhone("919876543210").phone).toBe("+919876543210");
    expect(normalisePhone("(202) 555-0143", "1")).toEqual({ phone: "+12025550143", valid: true });
  });
  it("flags bad numbers", () => { expect(normalisePhone("12345").valid).toBe(false); expect(normalisePhone("1234567890").valid).toBe(false); });
  it("parses pasted lines in either order", () => {
    const d = parseLines("Riya, 9876543210\n9876501234, Nana ji\n\nKabir 98111 22233\n+44 7700 900111");
    expect(d.map((x) => x.name)).toEqual(["Riya", "Nana ji", "Kabir", ""]);
  });
  it("parses CSV with headers and quoted commas", () => {
    const d = parseCsv('Name,WhatsApp Number,Group\n"Mehta, Kabir",9876543210,Friends\nDadi,9876501234,Elders|Family\n');
    expect(d[0]).toEqual({ name: "Mehta, Kabir", phone: "9876543210", groups: ["Friends"] });
    expect(d[1].groups).toEqual(["Elders", "Family"]);
  });
  it("parses vCards", () => {
    const d = parseVcf("BEGIN:VCARD\nVERSION:3.0\nFN:Riya Kapoor\nTEL;TYPE=CELL:+91 98765 43210\nEND:VCARD\nBEGIN:VCARD\nN:Mehta;Kabir;;;\nTEL:9811122233\nTEL;TYPE=HOME:01123456789\nEND:VCARD");
    expect(d).toHaveLength(3);
    expect(d[0].name).toBe("Riya Kapoor");
    expect(d[1].name).toBe("Kabir Mehta");
  });
  it("de-dupes and counts invalid numbers", () => {
    const r = toContacts([{ name: "A", phone: "9876543210" }, { name: "A again", phone: "+91 98765 43210" }, { name: "Bad", phone: "123" }], []);
    expect(r.added).toHaveLength(2);
    expect(r.duplicates).toBe(1);
    expect(r.invalid).toBe(1);
  });
});

describe("share links", () => {
  it("round-trips a snapshot through the URL", () => {
    const snap: ShareSnapshot = { k: "budget", n: ["Anya", "Anuj"], c: "INR", total: 1500000, cp: 8, rows: [{ name: "Venue", amt: 400000, pct: 26.7 }] };
    const enc = encodeSnapshot(snap);
    expect(enc).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(decodeSnapshot("#" + enc)).toEqual(snap);
  });
  it("rejects junk", () => { expect(decodeSnapshot("not-a-snapshot")).toBeNull(); expect(decodeSnapshot("")).toBeNull(); });
});

describe("tagging and links", () => {
  it("reads words and colours", () => {
    const t = tagFrom("pastel lehenga with light embroidery", ["#f0c9c4"]);
    expect(t.category).toBe("outfit");
    expect(t.themes).toContain("pastel");
    expect(t.objects).toContain("lehenga");
    expect(t.colors[0].name).toBe("blush");
  });
  it("still says something for IMG_2041.jpg", () => {
    const t = tagFrom("IMG_2041", ["#b7c4a8", "#f4efe4"]);
    expect(t.themes.length).toBeGreaterThan(0);
    expect(t.mood.length).toBeGreaterThan(0);
  });
  it("is deterministic", () => expect(tagFrom("garden brunch", ["#9fb38a"])).toEqual(tagFrom("garden brunch", ["#9fb38a"])));
  it("knows where a link came from", () => {
    expect(sourceFromUrl("https://open.spotify.com/playlist/x")).toBe("spotify");
    expect(sourceFromUrl("https://pin.it/abc")).toBe("pinterest");
    expect(sourceFromUrl("https://example.com")).toBe("web");
  });
  it("unfurls offline", async () => {
    const u = await new MockUnfurlService().unfurl("https://www.pinterest.com/pin/garden-mandap-ideas");
    expect(u).toMatchObject({ title: "Garden mandap ideas", domain: "pinterest.com", source: "pinterest" });
    expect(normaliseUrl("instagram.com/p/abc")).toBe("https://instagram.com/p/abc");
    expect(normaliseUrl("just a thought")).toBeNull();
  });
});

describe("invite messages", () => {
  const f = { names: "Anya & Anuj", date: "19 Nov 2026", venue: "", rsvp: "" };
  it("personalises and drops empty lines", () => {
    const msg = fillMessage("Hi {name}!\n{names}\n{date}\n{venue}\nRSVP: {rsvp}", "Riya Kapoor", f);
    expect(msg).toBe("Hi Riya!\nAnya & Anuj\n19 Nov 2026");
  });
  it("builds deep links with the encoded message", () => {
    expect(waLink("+91 98765 43210", "Hi Riya & co")).toBe("https://wa.me/919876543210?text=Hi%20Riya%20%26%20co");
    expect(smsLink("+919876543210", "Hi there")).toBe("sms:+919876543210?&body=Hi%20there");
  });
  it("counts SMS parts", () => { expect(smsParts("a".repeat(160)).parts).toBe(1); expect(smsParts("a".repeat(161)).parts).toBe(2); expect(smsParts("शादी").unicode).toBe(true); });
});

describe("money", () => {
  it("uses Indian grouping for INR", () => { expect(money(1250000, "INR")).toBe("₹12,50,000"); expect(money(1250000, "USD")).toBe("$1,250,000"); });
});
