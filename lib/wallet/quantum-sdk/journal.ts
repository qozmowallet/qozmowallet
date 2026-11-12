import type { Hex } from "viem";
import type { UserOperation } from "viem/account-abstraction";

/**
 * Write-ahead record of every signature a wallet has produced, keyed by WOTS key index.
 *
 * This is the main defence against the one risk that can lose funds: signing two different
 * messages with the same one-time key. An entry is written *before* a signature leaves the
 * wallet, so after a crash we still know the key has been exposed.
 */
export type JournalEntry = {
  keyIndex: number;
  userOpHash: Hex;
  nextPublicKeyHash: Hex;
  /** Full signed operation, so a stuck operation can be re-sent unchanged. */
  userOperation: SerializedUserOperation;
  /**
   * signed: the signature left the wallet, not yet on-chain. confirmed: on-chain.
   * replaced: a recovery signature superseded this operation (its key was skipped).
   */
  status: "signed" | "confirmed" | "replaced";
  createdAt: number;
  transactionHash?: Hex;
  /** "recovery" entries are keyed by RECOVERY_KEY_OFFSET + recovery index. */
  kind?: "main" | "recovery";
  /** For recovery entries: the main key index whose stuck operation this replaces. */
  replacesKeyIndex?: number;
};

/** Unlocked access, only valid inside a journal transaction. */
export interface JournalStore {
  get(keyIndex: number): Promise<JournalEntry | undefined>;
  put(entry: JournalEntry): Promise<void>;
  list(): Promise<JournalEntry[]>;
}

export interface KeyJournal extends JournalStore {
  /** Serializes reads, signing and persistence across users of the same journal. */
  transaction<T>(work: (store: JournalStore) => Promise<T>): Promise<T>;
}

export type JournalLock = <T>(work: () => Promise<T>) => Promise<T>;

/** In-process lock. Persistent stores must additionally lock across tabs/processes. */
export function createJournalLock(): JournalLock {
  let tail = Promise.resolve();
  return async <T>(work: () => Promise<T>): Promise<T> => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await work(); } finally { release(); }
  };
}

/** Fail closed: unreadable or malformed persistence must never become an empty journal. */
export function parseJournal(value: unknown): Record<string, JournalEntry> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid key journal; restore the original journal before signing.");
  for (const [key, entry] of Object.entries(value)) {
    const e = entry as JournalEntry;
    if (!e || !Number.isSafeInteger(e.keyIndex) || e.keyIndex < 0 || String(e.keyIndex) !== key ||
        !/^0x[0-9a-fA-F]{64}$/.test(e.userOpHash) || !/^0x[0-9a-fA-F]{64}$/.test(e.nextPublicKeyHash) ||
        !["signed", "confirmed", "replaced"].includes(e.status) || !Number.isFinite(e.createdAt) ||
        !e.userOperation || typeof e.userOperation !== "object" || Array.isArray(e.userOperation) ||
        !/^0x[0-9a-fA-F]+$/.test(e.userOperation.signature ?? "")) {
      throw new Error("Invalid key journal; restore the original journal before signing.");
    }
  }
  return value as Record<string, JournalEntry>;
}

/** Chain IDs change the signed digest, not the WOTS key derived from a seed. */
export function assertNoConflictingExposure(entry: JournalEntry, records: JournalEntry[]) {
  for (const previous of records) {
    if (previous.keyIndex === entry.keyIndex &&
        (previous.userOpHash.toLowerCase() !== entry.userOpHash.toLowerCase() ||
         previous.nextPublicKeyHash.toLowerCase() !== entry.nextPublicKeyHash.toLowerCase() ||
         previous.userOperation.signature !== entry.userOperation.signature)) {
      throw new Error(`Key #${entry.keyIndex} already signed a different operation, possibly on another network. Use a separate recovery phrase per network; keep the original journal.`);
    }
  }
}

/** Every access uses the same lock; the transaction's store avoids nested lock acquisition. */
export class SerializedJournal implements KeyJournal {
  private readonly store: JournalStore;
  private readonly lock: JournalLock;
  constructor(store: JournalStore, lock: JournalLock) {
    this.store = {
      get: index => store.get(index),
      list: () => store.list(),
      put: async entry => {
        const previous = await store.get(entry.keyIndex);
        if (previous && (previous.userOpHash.toLowerCase() !== entry.userOpHash.toLowerCase() ||
            previous.nextPublicKeyHash.toLowerCase() !== entry.nextPublicKeyHash.toLowerCase() ||
            previous.userOperation.signature !== entry.userOperation.signature)) {
          throw new Error(`Key #${entry.keyIndex} already has a different signed operation`);
        }
        // Never downgrade a completed record when a repeated request finishes late.
        if (previous && previous.status !== "signed" && entry.status === "signed") return;
        await store.put(entry);
      },
    };
    this.lock = lock;
  }
  transaction<T>(work: (store: JournalStore) => Promise<T>): Promise<T> { return this.lock(() => work(this.store)); }
  get(index: number) { return this.transaction(store => store.get(index)); }
  put(entry: JournalEntry) { return this.transaction(store => store.put(entry)); }
  list() { return this.transaction(store => store.list()); }
}

export class MemoryJournal extends SerializedJournal {
  constructor() {
    const entries = new Map<number, JournalEntry>();
    super({
      get: async index => { const entry = entries.get(index); return entry ? structuredClone(entry) : undefined; },
      put: async entry => { entries.set(entry.keyIndex, structuredClone(entry)); },
      list: async () => structuredClone([...entries.values()].sort((a, b) => a.keyIndex - b.keyIndex)),
    }, createJournalLock());
  }
}

/** Web Locks span same-origin tabs/workers. No unsafe local-only fallback. */
export function browserJournalLock(name: string): JournalLock {
  return async <T>(work: () => Promise<T>): Promise<T> => {
    if (!globalThis.navigator?.locks) throw new Error("This browser cannot lock the key journal. Use a browser with Web Locks support over HTTPS or localhost.");
    return globalThis.navigator.locks.request(name.toLowerCase(), { mode: "exclusive" }, work);
  };
}

export type SerializedUserOperation = Record<string, string | undefined>;

export function serializeUserOperation(op: UserOperation<"0.7">): SerializedUserOperation {
  const out: SerializedUserOperation = {};
  for (const [k, v] of Object.entries(op)) {
    if (v === undefined) continue;
    out[k] = typeof v === "bigint" ? `${v}n` : String(v);
  }
  return out;
}

export function deserializeUserOperation(s: SerializedUserOperation): UserOperation<"0.7"> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) {
    if (v === undefined) continue;
    out[k] = /^\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v;
  }
  return out as UserOperation<"0.7">;
}
