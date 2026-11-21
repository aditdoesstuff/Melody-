"use client";
import { useState, type RefObject } from "react";
import { Copy, Download, FileText, MessageCircle, Share2 } from "lucide-react";
import type { ShareSnapshot } from "@/lib/types";
import { sharePath } from "@/lib/share";
import Modal from "./Modal";
import { toast } from "./Toast";

export interface ExtraAction { label: string; run: () => void }

async function renderPng(el: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: "#110d0c" });
}
function download(href: string, name: string) { const a = document.createElement("a"); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

/** Share anything: link (the whole view is encoded in the URL), WhatsApp, image, PDF, or the system share sheet. */
export default function ShareSheet({ title, snapshot, target, fileName, onClose, extras = [] }: { title: string; snapshot: ShareSnapshot; target: RefObject<HTMLElement | null>; fileName: string; onClose: () => void; extras?: ExtraAction[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const url = typeof window === "undefined" ? "" : window.location.origin + sharePath(snapshot);
  const blurb = `${title} · made on aaroh`;
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast("Link copied. It opens on any device."); }
    catch { toast("Could not copy. Long-press the link below to copy it.", "warn"); }
  };
  const image = async () => {
    if (!target.current) return;
    setBusy("image");
    try { download(await renderPng(target.current), `${fileName}.png`); toast("Image saved."); }
    catch { toast("Could not make the image. Try the PDF or the link.", "warn"); }
    setBusy(null);
  };
  const pdf = async () => {
    if (!target.current) return;
    setBusy("pdf");
    try {
      const el = target.current;
      const [png, { jsPDF }] = await Promise.all([renderPng(el), import("jspdf")]);
      const w = 595, h = Math.max(200, Math.round((el.offsetHeight / el.offsetWidth) * w));
      const doc = new jsPDF({ unit: "pt", format: [w, h], orientation: h >= w ? "portrait" : "landscape" });
      doc.addImage(png, "PNG", 0, 0, w, h);
      doc.save(`${fileName}.pdf`);
      toast("PDF saved.");
    } catch { toast("Could not make the PDF. Try the image or the link.", "warn"); }
    setBusy(null);
  };
  const native = async () => {
    try {
      if (target.current && navigator.canShare) {
        const blob = await (await fetch(await renderPng(target.current))).blob();
        const file = new File([blob], `${fileName}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ title, text: blurb, url, files: [file] }); return; }
      }
      await navigator.share({ title, text: blurb, url });
    } catch { /* closed the sheet: nothing to do */ }
  };

  return (
    <Modal title="Share" onClose={onClose}>
      <p className="text-sm text-muted -mt-2 mb-5">Anyone with the link sees a read-only page. Photos are not included, only colours and words.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <button className="btn btn-cream" onClick={copy}><Copy size={16} aria-hidden />Copy link</button>
        <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(`${blurb}\n${url}`)}`} target="_blank" rel="noreferrer noopener"><MessageCircle size={16} aria-hidden />Share to WhatsApp</a>
        <button className="btn" onClick={image} disabled={!!busy}><Download size={16} aria-hidden />{busy === "image" ? "Making image…" : "Save as image"}</button>
        <button className="btn" onClick={pdf} disabled={!!busy}><FileText size={16} aria-hidden />{busy === "pdf" ? "Making PDF…" : "Save as PDF"}</button>
        {canNativeShare && <button className="btn" onClick={native}><Share2 size={16} aria-hidden />More ways to share</button>}
        {extras.map((x) => <button key={x.label} className="btn" onClick={x.run}><Download size={16} aria-hidden />{x.label}</button>)}
      </div>
      <label className="block mt-5"><span className="eyebrow block mb-1.5">Link</span><input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field field-sm font-mono !text-xs" /></label>
    </Modal>
  );
}
