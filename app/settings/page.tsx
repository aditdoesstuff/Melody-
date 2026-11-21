"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, Upload } from "lucide-react";
import { STORE_KEY, pickData, storageError, useApp, whoName } from "@/lib/store";
import { blobDataUrl, putBlob } from "@/lib/blobs";
import { partner } from "@/lib/services/partner";
import type { WeddingType } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { toast } from "@/components/Toast";

export default function SettingsPage() {
  const s = useApp();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const link = typeof window === "undefined" ? "" : partner.inviteLink(s.partnerCode, window.location.origin);

  const exportAll = async () => {
    setBusy(true);
    const blobs: Record<string, string> = {};
    for (const c of s.cards) for (const k of [c.thumbKey, c.blobKey]) if (k && !blobs[k]) { const d = await blobDataUrl(k); if (d) blobs[k] = d; }
    const payload = JSON.stringify({ app: "aaroh", version: 1, key: STORE_KEY, exportedAt: new Date().toISOString(), data: pickData(useApp.getState()), blobs });
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `aaroh-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setBusy(false);
    toast("Everything exported, images included.");
  };
  const importAll = async (f?: File) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (j?.app !== "aaroh" || !j.data || !Array.isArray(j.data.cards)) throw new Error("not aaroh");
      for (const [k, d] of Object.entries((j.blobs ?? {}) as Record<string, string>)) await putBlob(k, await (await fetch(d)).blob());
      s.importAll(j.data);
      toast(`Imported ${j.data.cards.length} cards.`);
    } catch { toast("That file is not an aaroh export.", "warn"); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" lede="Your details, your partner, your data." />
      <div className="space-y-5">
        <Section title="You two">
          <div className="grid sm:grid-cols-2 gap-3">
            <Text label="Your name" value={s.names[0]} onChange={(v) => s.patchProfile({ names: [v || "You", s.names[1]] })} />
            <Text label="Partner's name" value={s.names[1]} onChange={(v) => s.patchProfile({ names: [s.names[0], v || "Partner"] })} />
            <label className="block"><span className="eyebrow block mb-2">Wedding date</span><input type="date" className="field" value={s.date} onChange={(e) => s.patchProfile({ date: e.target.value })} /></label>
            <Text label="Wedding location" value={s.location} onChange={(v) => s.patchProfile({ location: v })} />
            <label className="block sm:col-span-2"><span className="eyebrow block mb-2">Type of wedding</span>
              <select className="field" value={s.weddingType} onChange={(e) => { const t = e.target.value as WeddingType; s.patchProfile({ weddingType: t }); if (t === "court") s.setView("couple"); }}>
                <option value="love">Love marriage</option><option value="arranged">Arranged marriage</option><option value="court">Court marriage (hides the family layer)</option>
              </select>
            </label>
          </div>
        </Section>

        <Section title="Your partner">
          <p className="text-muted">aaroh has no server yet, so two phones cannot sync. To see how the two-person features work, switch to partner view: anything you add or rank is then saved as {whoName(s.names, "B")}.</p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button className={`btn ${s.persona === "B" ? "btn-cream" : "btn-primary"}`} aria-pressed={s.persona === "B"} onClick={() => { const next = s.persona === "A" ? "B" : "A"; s.setPersona(next); toast(`Now viewing as ${whoName(s.names, next)}.`); }}>
              {s.persona === "A" ? `Switch to partner view (${whoName(s.names, "B")})` : `Switch back to ${whoName(s.names, "A")}`}
            </button>
            <span className="text-sm">Currently: <strong className="text-peach font-medium">{whoName(s.names, s.persona)}</strong></span>
          </div>
          <div className="mt-5 pt-5 border-t border-line">
            <p className="eyebrow mb-2">Partner code (preview)</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl tracking-[0.3em] text-peach">{s.partnerCode || "······"}</span>
              <button className="btn btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(link); toast("Invite link copied."); } catch { toast("Could not copy the link.", "warn"); } }}><Copy size={14} aria-hidden />Copy invite link</button>
            </div>
            <p className="text-xs text-muted mt-2">The link opens aaroh on your partner&apos;s phone and starts a separate space there. Real shared spaces need a backend, which is the next step for this prototype.</p>
          </div>
        </Section>

        <Section title="Demo">
          <p className="text-muted">Fills your space with sixty tagged cards from two partners and their family, plus made-up guests, so every feature has something to show.</p>
          <button className="btn mt-4" onClick={() => { s.loadDemo(Date.now()); toast("Demo couple loaded: 60 cards."); router.push("/space"); }}>Load demo couple</button>
        </Section>

        <Section title="Your data">
          <p className="text-muted">Everything lives in this browser&apos;s storage. Export a backup before clearing your browser or switching phones.</p>
          {storageError && <p role="alert" className="chip chip-pending mt-3 !whitespace-normal">Storage problem: {storageError}. Export a backup and delete a few images.</p>}
          <div className="flex flex-wrap gap-3 mt-4">
            <button className="btn" onClick={exportAll} disabled={busy}><Download size={16} aria-hidden />{busy ? "Packing…" : "Export everything (.json)"}</button>
            <button className="btn" onClick={() => file.current?.click()}><Upload size={16} aria-hidden />Import a backup</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { void importAll(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <div className="mt-5 pt-5 border-t border-line">
            {!confirming ? <button className="btn" onClick={() => setConfirming(true)}>Reset everything</button> : (
              <div role="alertdialog" aria-label="Confirm reset" className="flex flex-wrap items-center gap-3">
                <p className="flex-1 min-w-[220px]">This deletes all {s.cards.length} cards, your guide, budget and guest list from this device. There is no undo.</p>
                <button className="btn" onClick={() => setConfirming(false)}>Keep my data</button>
                <button className="btn btn-primary" onClick={() => { s.resetAll(); router.replace("/"); }}>Yes, delete it all</button>
              </div>
            )}
          </div>
        </Section>

        <p className="text-xs text-muted">aaroh prototype · tags come from an on-device dictionary and colour reader, not a cloud model · {s.cards.length} cards, {s.contacts.length} guests stored locally.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card p-5 md:p-6"><h2 className="h-serif text-3xl mb-3">{title}</h2>{children}</section>;
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="eyebrow block mb-2">{label}</span><input className="field" defaultValue={value === "You" || value === "Partner" ? "" : value} onBlur={(e) => onChange(e.target.value.trim())} placeholder={value} /></label>;
}
