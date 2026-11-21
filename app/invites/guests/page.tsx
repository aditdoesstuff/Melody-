"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import type { Contact } from "@/lib/types";
import { useApp } from "@/lib/store";
import { CSV_TEMPLATE, parseCsv, parseLines, parseVcf, prettyPhone, toContacts, type Draft } from "@/lib/phone";
import { DEMO_CONTACTS } from "@/lib/seed";
import { recipientsOf } from "@/lib/invites";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";

type ContactsApi = { select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> };

export default function Guests() {
  const s = useApp();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [inviteId, setInviteId] = useState("");
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<"paste" | "add" | null>(null);
  const [edit, setEdit] = useState<Contact | null>(null);
  const [newGroup, setNewGroup] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const picker = typeof navigator !== "undefined" ? (navigator as Navigator & { contacts?: ContactsApi }).contacts : undefined;

  const statusFor = (c: Contact) => s.invites.filter((i) => recipientsOf(i, [c]).length).map((i) => ({ invite: i, state: i.status[c.id] ?? "pending" }));
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.contacts.filter((c) => {
      if (needle && !c.name.toLowerCase().includes(needle) && !c.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "") || "~")) return false;
      if (group && !c.groups.includes(group)) return false;
      const st = s.invites.filter((i) => (!inviteId || i.id === inviteId) && recipientsOf(i, [c]).length).map((i) => i.status[c.id] ?? "pending");
      if (inviteId && !st.length) return false;
      if (status && !(st as string[]).includes(status)) return false;
      return true;
    });
  }, [s.contacts, s.invites, q, group, inviteId, status]);

  const ingest = (drafts: Draft[], source: string) => {
    const r = toContacts(drafts, s.contacts, s.countryCode);
    if (r.added.length) s.addContacts(r.added);
    const bits = [`${r.added.length} added from ${source}`, r.duplicates ? `${r.duplicates} duplicate${r.duplicates > 1 ? "s" : ""} skipped` : "", r.invalid ? `${r.invalid} number${r.invalid > 1 ? "s look" : " looks"} wrong` : ""].filter(Boolean);
    toast(drafts.length ? bits.join(" · ") : `Nothing readable in that ${source}.`, r.added.length && !r.invalid ? "ok" : "warn");
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    const text = await f.text();
    ingest(/\.vcf$/i.test(f.name) || /BEGIN:VCARD/i.test(text) ? parseVcf(text) : parseCsv(text), "the file");
  };
  const pick = async () => {
    try { const res = await picker!.select(["name", "tel"], { multiple: true }); ingest(res.flatMap((r) => (r.tel ?? []).slice(0, 1).map((tel) => ({ name: r.name?.[0] ?? "", phone: tel }))), "your phone"); }
    catch { /* picker dismissed */ }
  };
  const template = () => { const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "aaroh-guest-list-template.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
  const ids = [...sel];
  const allShown = shown.length > 0 && shown.every((c) => sel.has(c.id));
  const invalid = s.contacts.filter((c) => !c.valid).length;

  return (
    <div>
      <Link href="/invites" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-peach mb-3"><ArrowLeft size={15} aria-hidden />Invitations</Link>
      <PageHeader title="Guest & Family" lede="Add your family list, guests and their function-wise invites." />

      <div className="grid sm:grid-cols-2 gap-4 max-w-[1010px] mx-auto">
        <button className="btn min-h-[58px] text-base md:text-lg uppercase tracking-wide" onClick={() => file.current?.click()}>Upload a guest list</button>
        <button className="btn btn-cream min-h-[58px] text-base md:text-lg uppercase tracking-wide" onClick={template}>Download template</button>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {picker && <button className="btn btn-sm" onClick={pick}>Pick from phone contacts</button>}
        <button className="btn btn-sm" onClick={() => setModal("paste")}>Paste numbers</button>
        {!s.contacts.some((c) => c.id.startsWith("demo-c-")) && <button className="btn btn-sm" onClick={() => { const fresh = DEMO_CONTACTS.filter((d) => !s.contacts.some((c) => c.phone === d.phone)); s.addContacts(fresh); toast(`${fresh.length} demo contacts added. Their numbers are made up.`); }}>Use demo contacts</button>}
      </div>
      <input ref={file} type="file" accept=".csv,.vcf,text/csv,text/vcard,text/plain" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />

      <div className="flex flex-wrap items-center gap-2 mt-10">
        <span className="mr-1">Groups</span>
        {s.groups.map((g) => (
          <span key={g} className="chip chip-orange !py-1">{g} · {s.contacts.filter((c) => c.groups.includes(g)).length}
            <button onClick={() => { s.removeGroup(g); if (group === g) setGroup(""); toast(`Group “${g}” removed. Guests are kept.`); }} aria-label={`Remove group ${g}`} className="size-5 grid place-items-center rounded-full hover:bg-black/20"><X size={12} aria-hidden /></button>
          </span>
        ))}
        {newGroup === null ? <button className="chip chip-outline" onClick={() => setNewGroup("")}><Plus size={12} aria-hidden />New group</button>
          : <form className="inline-flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (newGroup.trim()) s.addGroup(newGroup); setNewGroup(null); }}><label className="sr-only" htmlFor="ng">New group name</label><input id="ng" autoFocus className="field field-sm !w-44" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onBlur={() => { if (!newGroup.trim()) setNewGroup(null); }} placeholder="Engagement + Wedding" maxLength={32} /><button className="btn btn-sm" type="submit">Add</button></form>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <label className="sr-only" htmlFor="gq">Search name or number</label>
          <input id="gq" type="search" className="field field-sm !pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or number…" />
        </div>
        <label><span className="sr-only">Filter by group</span><select className="field field-sm !w-auto" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{s.groups.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label><span className="sr-only">Filter by message</span><select className="field field-sm !w-auto" value={inviteId} onChange={(e) => setInviteId(e.target.value)}><option value="">Any message</option>{s.invites.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}</select></label>
        <label><span className="sr-only">Filter by status</span><select className="field field-sm !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option><option value="opened">Opened</option><option value="pending">Pending</option><option value="skipped">Skipped</option></select></label>
        <button className="chip chip-outline ml-auto !py-1.5" onClick={() => setModal("add")}><Plus size={12} aria-hidden />Add guest</button>
      </div>
      <p className="text-sm text-right mt-2" aria-live="polite">{shown.length} of {s.contacts.length} guests{invalid ? ` · ${invalid} with a number to check` : ""}</p>

      {ids.length > 0 && (
        <div className="card card-tan p-3 mt-3 flex flex-wrap items-center gap-2" role="region" aria-label="Bulk actions">
          <span className="text-sm">{ids.length} selected</span>
          <label><span className="sr-only">Add selected to group</span>
            <select className="field field-sm !w-auto" value="" onChange={(e) => { const g = e.target.value; if (!g) return; ids.forEach((id) => { const c = s.contacts.find((x) => x.id === id); if (c && !c.groups.includes(g)) s.updateContact(id, { groups: [...c.groups, g] }); }); toast(`Added ${ids.length} to ${g}.`); }}><option value="">Add to group…</option>{s.groups.map((g) => <option key={g}>{g}</option>)}</select>
          </label>
          <button className="btn btn-sm" onClick={() => { s.removeContacts(ids); setSel(new Set()); toast(`${ids.length} removed.`); }}><Trash2 size={14} aria-hidden />Remove</button>
        </div>
      )}

      {s.contacts.length === 0 ? (
        <div className="card card-tan p-8 text-center mt-4"><p className="h-serif text-3xl">No guests yet.</p><p className="text-muted mt-2">Upload a CSV or vCard, paste a list, or add people one at a time.</p></div>
      ) : (
        <div className="relative scroll-x mt-3">
          <table className="w-full text-left min-w-[760px] text-sm">
            <thead>
              <tr className="eyebrow border-b border-line">
                <th className="py-3 pl-2 w-10"><input type="checkbox" aria-label="Select all shown" checked={allShown} onChange={() => setSel(allShown ? new Set() : new Set(shown.map((c) => c.id)))} /></th>
                <th className="py-3 font-medium">Name</th><th className="py-3 font-medium">WhatsApp number</th><th className="py-3 font-medium">Groups</th><th className="py-3 font-medium">Messages</th><th className="py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b border-line/60">
                  <td className="py-3.5 pl-2"><input type="checkbox" aria-label={`Select ${c.name}`} checked={sel.has(c.id)} onChange={() => setSel((x) => { const n = new Set(x); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} /></td>
                  <td className="py-3.5 pr-3">{c.name}</td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] whitespace-nowrap">{prettyPhone(c.phone)}{!c.valid && <span className="chip chip-pending ml-2 font-sans" title="This does not look like a complete phone number"><TriangleAlert size={11} aria-hidden />check number</span>}</td>
                  <td className="py-3.5 pr-3"><div className="flex flex-wrap gap-1">{c.groups.length ? c.groups.map((g) => <span key={g} className="chip chip-orange">{g}</span>) : <span className="text-muted">No group</span>}</div></td>
                  <td className="py-3.5 pr-3"><div className="flex flex-wrap gap-1">{statusFor(c).map(({ invite, state }) => <span key={invite.id} className={`chip ${state === "opened" ? "chip-green" : "chip-pending"}`}>{invite.title} · {state === "opened" ? "Opened" : state === "skipped" ? "Skipped" : "Pending"}</span>)}</div></td>
                  <td className="py-3.5 whitespace-nowrap text-right">
                    <button className="btn btn-ghost btn-icon !w-10 !min-h-10 text-orange" aria-label={`Edit ${c.name}`} onClick={() => setEdit(c)}><Pencil size={15} aria-hidden /></button>
                    <button className="btn btn-ghost btn-icon !w-10 !min-h-10" aria-label={`Remove ${c.name}`} onClick={() => { s.removeContacts([c.id]); toast(`${c.name} removed.`); }}><Trash2 size={15} aria-hidden /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <p className="text-center text-muted py-8">Nobody matches those filters.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-8 text-sm text-muted">
        <p className="flex-1 min-w-[240px]">Your guest list stays on this device, in this browser. aaroh never uploads it.</p>
        <label className="inline-flex items-center gap-2">Default country code +<input className="field field-sm !w-20" inputMode="numeric" value={s.countryCode} onChange={(e) => s.setCountryCode(e.target.value)} aria-label="Default country code" /></label>
        {s.contacts.length > 0 && <button className="btn btn-sm" onClick={() => { s.removeContacts(s.contacts.map((c) => c.id)); setSel(new Set()); toast("All contacts cleared."); }}>Clear contacts</button>}
      </div>

      {modal === "paste" && <PasteModal onClose={() => setModal(null)} onDone={(d) => { ingest(d, "your list"); setModal(null); }} />}
      {(modal === "add" || edit) && <GuestModal contact={edit} onClose={() => { setModal(null); setEdit(null); }} />}
    </div>
  );
}

function PasteModal({ onClose, onDone }: { onClose: () => void; onDone: (d: Draft[]) => void }) {
  const [text, setText] = useState("");
  const drafts = parseLines(text);
  return (
    <Modal title="Paste numbers" onClose={onClose}>
      <label htmlFor="paste" className="text-sm text-muted block -mt-2 mb-3">One guest per line, like <span className="font-mono text-cream">Riya, 98765 43210</span>. A number on its own works too.</label>
      <textarea id="paste" autoFocus className="field !min-h-[200px] font-mono !text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder={"Riya, 98765 43210\nNana ji, +91 98765 01234"} />
      <div className="flex items-center justify-between gap-3 mt-4"><span className="text-sm text-muted">{drafts.length} found</span><button className="btn btn-primary" disabled={!drafts.length} onClick={() => onDone(drafts)}>Add {drafts.length || ""} guest{drafts.length === 1 ? "" : "s"}</button></div>
    </Modal>
  );
}

function GuestModal({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const s = useApp();
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [groups, setGroups] = useState<string[]>(contact?.groups ?? []);
  const [error, setError] = useState("");
  const save = () => {
    const r = toContacts([{ name: name.trim(), phone, groups }], s.contacts.filter((c) => c.id !== contact?.id), s.countryCode);
    if (!phone.trim()) { setError("Add a phone number."); return; }
    if (r.duplicates) { setError("That number is already on your list."); return; }
    const c = r.added[0];
    if (contact) s.updateContact(contact.id, { name: c.name, phone: c.phone, valid: c.valid, groups });
    else s.addContacts([{ ...c, groups }]);
    toast(c.valid ? (contact ? "Guest updated." : "Guest added.") : "Saved, but that number looks incomplete.", c.valid ? "ok" : "warn");
    onClose();
  };
  return (
    <Modal title={contact ? "Edit guest" : "Add guest"} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <label className="block"><span className="eyebrow block mb-2">Name</span><input autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya Kapoor" /></label>
        <label className="block"><span className="eyebrow block mb-2">WhatsApp number</span><input className="field" inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} placeholder="98765 43210" aria-invalid={!!error} aria-describedby={error ? "ph-err" : undefined} /></label>
        {error && <p id="ph-err" role="alert" className="text-sm text-orange">{error}</p>}
        <fieldset><legend className="eyebrow mb-2">Groups</legend><div className="flex flex-wrap gap-2">{s.groups.map((g) => <button type="button" key={g} className="chip" aria-pressed={groups.includes(g)} onClick={() => setGroups(groups.includes(g) ? groups.filter((x) => x !== g) : [...groups, g])}>{g}</button>)}</div></fieldset>
        <button type="submit" className="btn btn-primary w-full">{contact ? "Save" : "Add guest"}</button>
      </form>
    </Modal>
  );
}
