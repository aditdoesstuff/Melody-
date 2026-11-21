import { hash } from "../format";

export interface PartnerService { createCode(seed: string): string; inviteLink(code: string, origin: string): string }

/**
 * Mock partner link. There is no server, so nothing syncs between devices.
 * The "partner" is simulated on one device by Settings -> "Switch to partner view".
 */
export class MockPartnerService implements PartnerService {
  createCode(seed: string): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let h = hash(seed), out = "";
    for (let i = 0; i < 6; i++) { out += alphabet[h % alphabet.length]; h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0; }
    return out;
  }
  inviteLink(code: string, origin: string): string { return `${origin}/?join=${code}`; }
}
export const partner: PartnerService = new MockPartnerService();
