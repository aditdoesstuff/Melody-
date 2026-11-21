import { describe, expect, it } from "vitest";
import { allocate, insights, largestRemainder, rankToWeights, setWeight, stepFor } from "@/lib/budget";
import { DEFAULT_ORDER } from "@/lib/categories";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("largestRemainder", () => {
  it("always sums to the total", () => {
    for (const total of [1, 7, 100, 999, 12345]) expect(sum(largestRemainder([3, 3, 3, 1, 0.5], total))).toBe(total);
  });
  it("handles all-zero weights", () => expect(largestRemainder([0, 0], 10)).toEqual([0, 0]));
});

describe("rankToWeights", () => {
  it("sums to 100 and decreases with rank", () => {
    const w = rankToWeights(DEFAULT_ORDER);
    const vals = DEFAULT_ORDER.map((id) => w[id]);
    expect(sum(vals)).toBe(100);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeLessThanOrEqual(vals[i - 1]);
  });
  it("gives skipped categories nothing and damps nice-to-haves", () => {
    const w = rankToWeights(["a", "b", "c"], { b: "skip", c: "nice" });
    expect(w.b).toBe(0);
    expect(sum(Object.values(w))).toBe(100);
    expect(w.c).toBeLessThan(rankToWeights(["a", "b", "c"], { b: "skip" }).c);
  });
  it("moves when the ranking changes", () => {
    const before = rankToWeights(["venue", "photo", "music"]);
    const after = rankToWeights(["music", "photo", "venue"]);
    expect(after.music).toBeGreaterThan(before.music);
    expect(after.venue).toBeLessThan(before.venue);
  });
});

describe("setWeight", () => {
  const base = { a: 40, b: 30, c: 20, d: 10 };
  it("keeps the total at 100", () => {
    for (const v of [0, 5, 55, 100, 140, -3]) expect(sum(Object.values(setWeight(base, "a", v)))).toBe(100);
  });
  it("never touches locked categories", () => {
    const out = setWeight(base, "a", 60, ["b"]);
    expect(out.b).toBe(30);
    expect(out.a).toBe(60);
    expect(sum(Object.values(out))).toBe(100);
  });
  it("cannot push past what the locks leave free", () => {
    const out = setWeight(base, "a", 95, ["b", "c"]);
    expect(out.a).toBe(50);
    expect(out.d).toBe(0);
  });
  it("ignores edits to a locked category", () => expect(setWeight(base, "a", 10, ["a"])).toEqual(base));
});

describe("allocate", () => {
  it("amounts plus contingency equal the total exactly, for awkward totals", () => {
    const w = rankToWeights(DEFAULT_ORDER);
    for (const total of [1_500_000, 1_234_567, 999_999, 87_650, 4321, 250, 0]) {
      for (const cp of [0, 5, 8, 10]) {
        const a = allocate(total, w, cp, DEFAULT_ORDER);
        expect(sum(a.rows.map((r) => r.amount)) + a.contingency).toBe(total);
        a.rows.forEach((r) => expect(r.amount % a.step).toBe(0));
      }
    }
  });
  it("uses clean steps", () => { expect(stepFor(1_500_000)).toBe(1000); expect(stepFor(250_000)).toBe(500); expect(stepFor(45_000)).toBe(100); });
  it("follows the order it is given", () => expect(allocate(1000, { a: 50, b: 50 }, 0, ["b", "a"]).rows.map((r) => r.id)).toEqual(["b", "a"]));
});

describe("insights", () => {
  it("flags a top-ranked category with a tiny share", () => {
    const order = ["venue", "photo", "catering", "decor"];
    const a = allocate(1_000_000, { venue: 50, photo: 4, catering: 36, decor: 10 }, 5, order);
    const lines = insights(a, 1_000_000, (id) => order.indexOf(id) + 1, (id) => id, 100);
    expect(lines.some((l) => l.includes("photo") && l.includes("#2"))).toBe(true);
    expect(lines.length).toBeLessThanOrEqual(3);
  });
});
