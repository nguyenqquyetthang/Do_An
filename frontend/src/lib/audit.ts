import { sha256Hex } from "./sha256";
import type { AuditEntry, Role } from "@/data/types";

export const GENESIS_HASH = "0".repeat(64);

export interface AuditPayload {
  at: string;
  actor: string;
  actorRole: Role | "SYSTEM";
  action: string;
  entity: string;
  detail: string;
}

export const auditHash = (prevHash: string, payload: AuditPayload) =>
  sha256Hex(
    [prevHash, payload.at, payload.actor, payload.actorRole, payload.action, payload.entity, payload.detail].join("|"),
  );

/** Audit log là append-only: mỗi bản ghi khoá bản ghi trước bằng hash. */
export function appendAudit(entries: AuditEntry[], payload: AuditPayload): AuditEntry[] {
  const prevHash = entries.length ? entries[entries.length - 1].hash : GENESIS_HASH;
  const entry: AuditEntry = {
    id: `LOG${String(entries.length + 1).padStart(4, "0")}`,
    ...payload,
    prevHash,
    hash: auditHash(prevHash, payload),
  };
  return [...entries, entry];
}

export function verifyAuditChain(entries: AuditEntry[]): boolean {
  let prevHash = GENESIS_HASH;
  for (const entry of entries) {
    if (entry.prevHash !== prevHash) return false;
    if (auditHash(prevHash, entry) !== entry.hash) return false;
    prevHash = entry.hash;
  }
  return true;
}
