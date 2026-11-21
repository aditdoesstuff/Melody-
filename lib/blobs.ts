"use client";
import { del, get, set } from "idb-keyval";
import { useEffect, useState } from "react";

/** Image blobs live in IndexedDB, outside the main store, so the store stays small and fast. */
const urls = new Map<string, string>();

export async function putBlob(key: string, blob: Blob): Promise<void> { await set("blob:" + key, blob); }
export async function getBlob(key: string): Promise<Blob | undefined> { return get<Blob>("blob:" + key); }
export async function delBlob(key?: string): Promise<void> {
  if (!key) return;
  const u = urls.get(key);
  if (u) { URL.revokeObjectURL(u); urls.delete(key); }
  await del("blob:" + key).catch(() => {});
}

/** Downscale to at most `max` px on the long edge and re-encode as JPEG. Keeps uploads light. */
export async function makeThumb(file: Blob, max = 800, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not read that image"))), "image/jpeg", quality));
}

export async function blobUrl(key: string): Promise<string | null> {
  const cached = urls.get(key);
  if (cached) return cached;
  const blob = await getBlob(key).catch(() => undefined);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urls.set(key, u);
  return u;
}
export async function blobDataUrl(key: string): Promise<string | null> {
  const blob = await getBlob(key).catch(() => undefined);
  if (!blob) return null;
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => res(null); r.readAsDataURL(blob); });
}

/** Object URL for a stored image, or null while loading / if missing. */
export function useBlobUrl(key?: string): string | null {
  const [url, setUrl] = useState<string | null>(key ? urls.get(key) ?? null : null);
  useEffect(() => {
    let live = true;
    if (!key) return;
    blobUrl(key).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [key]);
  return key ? url : null;
}
