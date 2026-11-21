"use client";
import type { Card, Source } from "./types";
import { currentAdder, useApp } from "./store";
import { delBlob, getBlob, makeThumb, putBlob } from "./blobs";
import { tagging } from "./services/tagging";
import { normaliseUrl, unfurler } from "./services/unfurl";
import { EMPTY_TAGS, tagFrom } from "./tagging";
import { isHex, normHex, swatch } from "./palette";
import { uid } from "./format";

const base = (type: Card["type"], source: Source): Card => ({ id: uid(), type, createdAt: Date.now(), addedBy: currentAdder(useApp.getState()), source, tags: EMPTY_TAGS, tagStatus: "pending" });
const done = (id: string, patch: Partial<Card>) => useApp.getState().updateCard(id, { ...patch, tagStatus: "done" });
const failed = (id: string) => useApp.getState().updateCard(id, { tagStatus: "error" });

/** Images appear instantly; thumbnails are stored and tags arrive a moment later. Returns how many could not be saved. */
export async function addImages(files: File[]): Promise<{ added: number; failed: number }> {
  let added = 0, bad = 0;
  await Promise.all(files.map(async (file) => {
    const card = base("image", "upload");
    card.title = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/^(img|image|screenshot|photo|pxl|dsc)\s*[\d\s.()at-]*$/i, "").trim() || undefined;
    card.thumbKey = "t-" + card.id;
    try {
      const thumb = await makeThumb(file);
      await putBlob(card.thumbKey, thumb);
      useApp.getState().addCards([card]);
      added++;
      tagging.tagImage(thumb, file.name).then((tags) => done(card.id, { tags })).catch(() => failed(card.id));
    } catch {
      bad++;
      void delBlob(card.thumbKey);
    }
  }));
  return { added, failed: bad };
}

export function addFile(file: File): void {
  const card = base("file", "upload");
  card.fileName = file.name;
  useApp.getState().addCards([card]);
  tagging.tagText(file.name.replace(/\.[a-z0-9]+$/i, "")).then((tags) => done(card.id, { tags: { ...tags, source: "upload" } })).catch(() => failed(card.id));
}

export function addColor(input: string, name?: string): void {
  const hex = normHex(input);
  const card = base("color", "manual");
  card.hex = hex;
  card.title = name?.trim() || swatch(hex).name.replace(/^./, (c) => c.toUpperCase());
  useApp.getState().addCards([{ ...card, tags: tagFrom(name ?? "", [hex], "manual"), tagStatus: "done" }]);
}

export function addLink(url: string, source?: Source): void {
  const card = base("link", source ?? "web");
  card.url = url;
  useApp.getState().addCards([card]);
  unfurler.unfurl(url)
    .then(async (u) => {
      const src = source ?? u.source;
      useApp.getState().updateCard(card.id, { title: u.title, source: src, thumbColors: u.colors });
      const tags = await tagging.tagLink(url, u.title);
      done(card.id, { tags: { ...tags, source: src } });
    })
    .catch(() => failed(card.id));
}

export function addNote(text: string, source?: Source): void {
  const card = base("text", source ?? "manual");
  card.text = text.trim();
  useApp.getState().addCards([card]);
  tagging.tagText(text).then((tags) => done(card.id, { tags: { ...tags, source: source ?? "manual" } })).catch(() => failed(card.id));
}

/** One box for everything: a URL becomes a link card, a hex code a swatch, anything else a note. */
export function addSmart(input: string, source?: Source): "link" | "color" | "text" | null {
  const text = input.trim();
  if (!text) return null;
  const url = normaliseUrl(text);
  if (url) { addLink(url, source); return "link"; }
  if (isHex(text)) { addColor(text); return "color"; }
  addNote(text, source);
  return "text";
}

/** If the tab closed mid-tagging, finish the job on the next visit. */
export function retagPending(): void {
  for (const c of useApp.getState().cards.filter((x) => x.tagStatus === "pending" || x.tagStatus === "error")) {
    const run = async () => {
      if (c.type === "image" && c.thumbKey) { const blob = await getBlob(c.thumbKey); if (blob) return tagging.tagImage(blob, c.title ?? ""); }
      if (c.type === "link" && c.url) return tagging.tagLink(c.url, c.title ?? "");
      return tagging.tagText([c.title, c.text, c.fileName].filter(Boolean).join(" "));
    };
    run().then((tags) => done(c.id, { tags })).catch(() => failed(c.id));
  }
}
