import type { Contact, Invite } from "./types";

/** Who an invite goes to: everyone in any of its groups (or everyone, if it has no groups). */
export const recipientsOf = (invite: Invite, contacts: Contact[]): Contact[] =>
  invite.groups.length ? contacts.filter((c) => c.groups.some((g) => invite.groups.includes(g))) : contacts;

export function progressOf(invite: Invite, contacts: Contact[]) {
  const to = recipientsOf(invite, contacts);
  const opened = to.filter((c) => invite.status[c.id] === "opened").length;
  const skipped = to.filter((c) => invite.status[c.id] === "skipped").length;
  return { total: to.length, opened, skipped, pending: to.length - opened - skipped, complete: to.length > 0 && opened + skipped === to.length };
}
