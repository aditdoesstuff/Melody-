// Real colour extraction in the browser: downscale, quantise, rank by frequency, de-duplicate similar hues.
export function extractPalette(src: string, count = 4): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 48;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
          e.r += r; e.g += g; e.b += b; e.n++;
          buckets.set(key, e);
        }
        const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n]);
        const picked: number[][] = [];
        for (const col of ranked) {
          if (picked.every((p) => dist(p, col) > 60)) picked.push(col);
          if (picked.length >= count) break;
        }
        resolve(picked.map(toHex));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

// Plain-language colour family, used for search ("blush", "sage") and heuristic tags.
export function colourName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l > 0.9) return "ivory";
  if (l < 0.15) return "black";
  if (s < 0.12) return l > 0.6 ? "cream" : "charcoal";
  if (h < 15 || h >= 345) return l > 0.7 ? "blush" : "red";
  if (h < 40) return l > 0.65 ? "peach" : "terracotta";
  if (h < 65) return l > 0.6 ? "butter" : "marigold";
  if (h < 160) return l > 0.6 ? "sage" : "green";
  if (h < 200) return "teal";
  if (h < 260) return l > 0.65 ? "sky" : "navy";
  if (h < 300) return "lavender";
  return "rose";
}
