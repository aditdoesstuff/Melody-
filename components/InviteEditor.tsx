"use client";
import { useState } from "react";
import type { Invite } from "@/lib/types";
import { useApp } from "@/lib/store";
import { DEFAULT_MESSAGE, fillMessage, smsParts } from "@/lib/services/invite";
import { recipientsOf } from "@/lib/invites";
import Modal from "./Modal";
import InviteCard, { TEMPLATES, type Tint } from "./InviteCard";

/** The "Edit message" dialog from the mockups: details on the left, live preview on the right. */
export default function InviteEditor({ invite, tint, onClose, onSend }: { invite: Invite; tint: Tint; onClose: () => void; onSend: () => void }) {
  const groups = useApp((s) => s.groups);
  const contacts = useApp((s) => s.contacts);
  const updateInvite = useApp((s) => s.updateInvite);
  const [d, setD] = useState<Invite>(invite);
  const set = (p: Partial<Invite>) => setD((x) => ({ ...x, ...p }));
  const setField = (k: keyof Invite["fields"], v: string) => setD((x) => ({ ...x, fields: { ...x.fields, [k]: v } }));
  const to = recipientsOf(d, contacts);
  const sample = to[0]?.name ?? "Riya";
  const preview = fillMessage(d.message, sample, d.fields);
  const sms = smsParts(preview);
  const save = () => updateInvite(invite.id, { ...d, title: d.title.trim() || "Invite", status: invite.status });

  return (
    <Modal title="Edit message" onClose={onClose} wide>
      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8">
        <div className="space-y-5">
          <label className="block"><span className="eyebrow block mb-2">Title</span><input className="field" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Wedding Invite" /></label>
          <fieldset>
            <legend className="eyebrow mb-2">Send to</legend>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => <button type="button" key={g} className="chip" aria-pressed={d.groups.includes(g)} onClick={() => set({ groups: d.groups.includes(g) ? d.groups.filter((x) => x !== g) : [...d.groups, g] })}>{g}</button>)}
            </div>
            <p className="text-xs text-muted mt-2">{d.groups.length ? `${to.length} guest${to.length === 1 ? "" : "s"} in ${d.groups.length} group${d.groups.length === 1 ? "" : "s"}` : `No group picked, so this goes to all ${contacts.length} guests`}</p>
          </fieldset>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="eyebrow block mb-2">Names on the card</span><input className="field field-sm" value={d.fields.names} onChange={(e) => setField("names", e.target.value)} placeholder="Anya & Anuj" /></label>
            <label className="block"><span className="eyebrow block mb-2">Date</span><input className="field field-sm" value={d.fields.date} onChange={(e) => setField("date", e.target.value)} placeholder="19 November 2026" /></label>
            <label className="block"><span className="eyebrow block mb-2">Venue</span><input className="field field-sm" value={d.fields.venue} onChange={(e) => setField("venue", e.target.value)} placeholder="Delhi" /></label>
            <label className="block"><span className="eyebrow block mb-2">RSVP link or phone</span><input className="field field-sm" value={d.fields.rsvp} onChange={(e) => setField("rsvp", e.target.value)} placeholder="Optional" /></label>
          </div>
          <div>
            <div className="flex items-end justify-between gap-3 mb-2">
              <label htmlFor="msg" className="eyebrow">Message text</label>
              <div role="group" aria-label="Message language" className="inline-flex rounded-full border border-line p-0.5 text-xs">
                {(["en", "hinglish"] as const).map((l) => <button type="button" key={l} aria-pressed={d.lang === l} onClick={() => set({ lang: l, message: DEFAULT_MESSAGE[l] })} className={`rounded-full px-3 py-1.5 min-h-8 ${d.lang === l ? "bg-cream text-ink-black font-semibold" : "text-muted"}`}>{l === "en" ? "English" : "Hinglish"}</button>)}
              </div>
            </div>
            <textarea id="msg" className="field !min-h-[190px]" value={d.message} onChange={(e) => set({ message: e.target.value })} />
            <p className="text-xs text-muted mt-1.5">Use {"{name}"} for each guest&apos;s first name. {"{names}"}, {"{date}"}, {"{venue}"} and {"{rsvp}"} fill in from above. · {sms.chars} characters, {sms.parts} SMS {sms.parts === 1 ? "part" : "parts"}{sms.unicode ? " (special characters shorten SMS)" : ""}</p>
          </div>
          <fieldset>
            <legend className="eyebrow mb-2">Card design</legend>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TEMPLATES.map((t) => (
                <button type="button" key={t.id} aria-pressed={d.templateId === t.id} aria-label={`${t.name} design`} onClick={() => set({ templateId: t.id })} className={`rounded-xl overflow-hidden border-2 ${d.templateId === t.id ? "border-cream" : "border-transparent"}`}>
                  <InviteCard templateId={t.id} fields={{ names: "A & A", date: "", venue: "", rsvp: "" }} title={d.title} tint={tint} />
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <p className="eyebrow mb-2">Preview</p>
          <div className="rounded-[28px] border border-tan p-4 space-y-3 bg-bg">
            <div className="rounded-2xl overflow-hidden max-w-[300px] mx-auto"><InviteCard templateId={d.templateId} fields={d.fields} title={d.title} tint={tint} /></div>
            <p className="bg-[#1f3d2f] text-[#e7f5ea] rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">{preview || "Your message will show here."}</p>
            <p className="text-[11px] text-muted text-center">As {sample} would see it</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button className="btn flex-1" onClick={() => { save(); onClose(); }}>Save</button>
            <button className="btn btn-primary flex-1" disabled={!to.length} onClick={() => { save(); onSend(); }}>Send to {to.length || "all"} guest{to.length === 1 ? "" : "s"}</button>
          </div>
          {!to.length && <p className="text-xs text-muted mt-2">Add guests first, from the guest list.</p>}
        </div>
      </div>
    </Modal>
  );
}
