"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, MessageCircle, Share2, SkipForward, Smartphone } from "lucide-react";
import type { Channel, Contact, Invite } from "@/lib/types";
import { useApp } from "@/lib/store";
import { fillMessage, linkFor } from "@/lib/services/invite";
import { recipientsOf } from "@/lib/invites";
import { prettyPhone } from "@/lib/phone";
import Modal from "./Modal";
import InviteCard, { type Tint } from "./InviteCard";
import { toast } from "./Toast";

/** Deep links open one chat at a time, so sending is a queue: open, tap send in your app, come back, next. */
export default function SendQueue({ invite, tint, onClose }: { invite: Invite; tint: Tint; onClose: () => void }) {
  const contacts = useApp((s) => s.contacts);
  const markSent = useApp((s) => s.markSent);
  const addLog = useApp((s) => s.addLog);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  // Freeze the list when the queue opens so it does not reshuffle as statuses change.
  const [list] = useState<Contact[]>(() => recipientsOf(invite, contacts).filter((c) => c.valid && !invite.status[c.id]));
  const [invalid] = useState(() => recipientsOf(invite, contacts).filter((c) => !c.valid).length);
  const [i, setI] = useState(0);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const current = list[i];
  const label = channel === "whatsapp" ? "WhatsApp" : "Messages";

  const png = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { toBlob } = await import("html-to-image");
    return toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };
  const next = () => { setOpened(false); setI((x) => x + 1); };
  const open = (c: Contact) => { markSent(invite.id, c.id, "opened"); addLog(`Opened ${label} for ${c.name} · ${invite.title}`, Date.now()); setOpened(true); };
  const skip = (c: Contact) => { markSent(invite.id, c.id, "skipped"); addLog(`Skipped ${c.name} · ${invite.title}`, Date.now()); next(); };
  const downloadCard = async () => {
    setBusy(true);
    try { const b = await png(); if (!b) throw new Error(); const url = URL.createObjectURL(b); const a = document.createElement("a"); a.href = url; a.download = `${invite.title.replace(/\W+/g, "-").toLowerCase()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); toast("Card saved. Attach it in the chat."); }
    catch { toast("Could not make the card image.", "warn"); }
    setBusy(false);
  };
  const shareCard = async (c: Contact, text: string) => {
    setBusy(true);
    try {
      const b = await png();
      const file = b && new File([b], "invite.png", { type: "image/png" });
      if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); markSent(invite.id, c.id, "opened"); addLog(`Shared the card with ${c.name} · ${invite.title}`, Date.now()); setOpened(true); }
      else await downloadCard();
    } catch { /* share sheet dismissed */ }
    setBusy(false);
  };
  const text = current ? fillMessage(invite.message, current.name, invite.fields) : "";
  const canShareFiles = typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare;

  return (
    <Modal title={current ? `Send to ${current.name}` : "All done"} onClose={onClose}>
      <div aria-hidden style={{ position: "fixed", left: -9999, top: 0, width: 540 }}><div ref={cardRef}><InviteCard templateId={invite.templateId} fields={invite.fields} title={invite.title} tint={tint} /></div></div>

      {!list.length ? (
        <div><p className="text-muted">Nobody is waiting on this invite{invalid ? `, apart from ${invalid} guest${invalid > 1 ? "s" : ""} whose number looks wrong` : ""}.</p><Link href="/invites/guests" className="btn mt-4">Open guest list</Link></div>
      ) : !current ? (
        <div>
          <p className="text-lg">You went through all {list.length}. {invite.title} is on its way.</p>
          <p className="text-sm text-muted mt-2">aaroh cannot see whether a message was delivered or read. The log shows which chats you opened.</p>
          <button className="btn btn-cream mt-5" onClick={onClose}>Close</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-muted mb-1.5"><span>{i + 1} of {list.length}</span><span>{prettyPhone(current.phone)}</span></div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={i} aria-label="Sending progress"><div className="h-full bg-cream transition-all" style={{ width: `${(i / list.length) * 100}%` }} /></div>
          </div>
          <div role="group" aria-label="Send with" className="inline-flex rounded-full border border-tan p-1">
            {([["whatsapp", "WhatsApp", MessageCircle], ["sms", "SMS", Smartphone]] as const).map(([v, t, Icon]) => <button key={v} aria-pressed={channel === v} onClick={() => setChannel(v)} className={`rounded-full px-4 py-2 min-h-10 inline-flex items-center gap-1.5 text-sm ${channel === v ? "bg-cream text-ink-black font-semibold" : "text-muted"}`}><Icon size={15} aria-hidden />{t}</button>)}
          </div>
          <p className="bg-[#1f3d2f] text-[#e7f5ea] rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">{text}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <a className={`btn ${opened ? "" : "btn-primary"} sm:col-span-2 min-h-14 text-base`} href={linkFor(channel, current.phone, text)} target={channel === "whatsapp" ? "_blank" : undefined} rel="noreferrer noopener" onClick={() => open(current)}>
              {channel === "whatsapp" ? <MessageCircle size={18} aria-hidden /> : <Smartphone size={18} aria-hidden />}{opened ? `Open ${label} again` : `Open ${label}`}
            </a>
            {canShareFiles ? <button className="btn" disabled={busy} onClick={() => shareCard(current, text)}><Share2 size={16} aria-hidden />Share with the card</button>
              : <button className="btn" disabled={busy} onClick={downloadCard}><Download size={16} aria-hidden />{busy ? "Making card…" : "Download card"}</button>}
            {opened ? <button className="btn btn-cream" onClick={next}>Next guest</button> : <button className="btn" onClick={() => skip(current)}><SkipForward size={16} aria-hidden />Skip</button>}
          </div>
          <p className="text-xs text-muted">aaroh opens your messaging app with the text filled in. You tap send. {invalid > 0 && `${invalid} guest${invalid > 1 ? "s were" : " was"} left out because the number looks wrong.`}</p>
        </div>
      )}
    </Modal>
  );
}
