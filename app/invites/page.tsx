"use client";
import Link from "next/link";
import { useState } from "react";
import { Copy, Plus, Trash2, Users } from "lucide-react";
import type { Invite } from "@/lib/types";
import { useApp } from "@/lib/store";
import { DEFAULT_MESSAGE } from "@/lib/services/invite";
import { progressOf } from "@/lib/invites";
import { tintFrom } from "@/lib/tint";
import { prettyDate, uid } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import InviteCard from "@/components/InviteCard";
import InviteEditor from "@/components/InviteEditor";
import SendQueue from "@/components/SendQueue";
import { toast } from "@/components/Toast";

export default function Invites() {
  const s = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const tint = tintFrom(s.guide);
  const find = (id: string | null) => s.invites.find((i) => i.id === id);
  const names = s.names.filter((n) => n !== "You" && n !== "Partner").join(" & ");

  const add = () => {
    const invite: Invite = { id: "inv-" + uid(), title: "New invite", templateId: "arch", groups: [], message: DEFAULT_MESSAGE.en, lang: "en", fields: { names, date: prettyDate(s.date), venue: s.location, rsvp: "" }, status: {} };
    s.addInvite(invite);
    setEditing(invite.id);
  };
  const editInvite = find(editing), sendInvite = find(sending);

  return (
    <div>
      <PageHeader title="Invitation sender" lede="Send invitation cards on WhatsApp or SMS, group by group.">
        <Link href="/invites/guests" className="btn"><Users size={16} aria-hidden />Guest list · {s.contacts.length}</Link>
      </PageHeader>

      {!s.contacts.length && <div className="card card-tan p-4 mb-6 flex flex-wrap items-center gap-3"><p className="flex-1">No guests yet. Add a few, or try it with made-up demo contacts.</p><Link href="/invites/guests" className="btn btn-sm btn-cream">Add guests</Link></div>}

      <div className="flex flex-wrap items-center gap-5">
        {s.invites.map((inv) => {
          const p = progressOf(inv, s.contacts);
          return (
            <article key={inv.id} className="card card-tan p-6 w-full sm:w-[320px]">
              <div className="rounded-xl overflow-hidden h-[128px] relative"><div className={`absolute inset-x-0 ${inv.templateId === "lotus" ? "-top-[6%]" : "top-1/2 -translate-y-1/2"}`}><InviteCard templateId={inv.templateId} fields={{ names: inv.fields.names, date: "", venue: "", rsvp: "" }} title={inv.title} tint={tint} /></div></div>
              <h2 className="text-xl mt-4">{inv.title}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">{inv.groups.length ? inv.groups.map((g) => <span key={g} className="chip chip-orange">{g}</span>) : <span className="chip chip-orange">Everyone</span>}</div>
              <p className="flex justify-between text-sm mt-4 tabular-nums"><span>{p.opened}/{p.total} opened</span><span>{p.pending} pending{p.skipped ? ` · ${p.skipped} skipped` : ""}</span></p>
              <div className="flex items-center gap-2 mt-4">
                {p.complete ? <span className="chip chip-green !px-6 !py-2 !text-sm">Complete</span>
                  : <button className="btn btn-cream btn-sm whitespace-nowrap" disabled={!p.total} onClick={() => setSending(inv.id)}>{p.opened + p.skipped > 0 ? "Continue sending" : "Ready to send"}</button>}
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setEditing(inv.id)}>Edit</button>
                <button className="btn btn-ghost btn-icon !w-9 !min-h-9" aria-label={`Duplicate ${inv.title}`} onClick={() => { s.addInvite({ ...inv, id: "inv-" + uid(), title: inv.title + " copy", status: {} }); toast("Duplicated."); }}><Copy size={15} aria-hidden /></button>
                <button className="btn btn-ghost btn-icon !w-9 !min-h-9" aria-label={`Delete ${inv.title}`} onClick={() => { s.removeInvite(inv.id); toast("Invite deleted."); }}><Trash2 size={15} aria-hidden /></button>
              </div>
            </article>
          );
        })}
        <button onClick={add} aria-label="New invite" className="size-16 rounded-full bg-wine hover:bg-wine-hi text-white grid place-items-center shrink-0 mx-6 transition-colors"><Plus size={26} aria-hidden /></button>
      </div>

      <section className="mt-12 max-w-3xl" aria-labelledby="log-h">
        <h2 id="log-h" className="h-serif text-3xl">Activity</h2>
        <p className="text-sm text-muted mt-1">aaroh opens your messaging app, you tap send. So this log shows what was opened, not what was delivered.</p>
        {s.log.length ? (
          <ul className="mt-4 divide-y divide-line card">
            {s.log.slice(0, 30).map((l, i) => <li key={l.at + "-" + i} className="px-4 py-2.5 flex justify-between gap-4 text-sm"><span>{l.text}</span><time className="text-muted whitespace-nowrap" dateTime={new Date(l.at).toISOString()}>{new Date(l.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time></li>)}
          </ul>
        ) : <p className="card p-4 mt-4 text-muted">Nothing sent yet.</p>}
      </section>

      {editInvite && <InviteEditor key={editInvite.id} invite={editInvite} tint={tint} onClose={() => setEditing(null)} onSend={() => { setEditing(null); setSending(editInvite.id); }} />}
      {sendInvite && <SendQueue key={sendInvite.id} invite={sendInvite} tint={tint} onClose={() => setSending(null)} />}
    </div>
  );
}
