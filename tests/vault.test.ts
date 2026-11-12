import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  STORAGE_KEY,
  createVault,
  deriveWalletAddress,
  generateRecoveryPhrase,
  getWalletAccount,
  normalizeMnemonic,
  parseVaultBackup,
  readStoredVault,
  removeStoredVault,
  serializeVault,
  storeVault,
  unlockVault,
  validateRecoveryPhrase,
  type VaultRecord,
} from "../lib/wallet/vault";

// Public Hardhat development mnemonic. Never funded or used outside these tests.
const PUBLIC_TEST_PHRASE = "test test test test test test test test test test test junk";
const PUBLIC_TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const PASSWORD = "Qozmo tests only 2026!";

describe("EVM derivation", () => {
  it("derives the standard BIP-44 Ethereum account from a known fixture", () => {
    assert.equal(deriveWalletAddress(PUBLIC_TEST_PHRASE), PUBLIC_TEST_ADDRESS);
    assert.equal(getWalletAccount({ mnemonic: PUBLIC_TEST_PHRASE }).address, PUBLIC_TEST_ADDRESS);
  });

  it("generates a checksum-valid 24-word recovery phrase", () => {
    const first = generateRecoveryPhrase();
    const second = generateRecoveryPhrase();
    assert.equal(first.split(" ").length, 24);
    assert.equal(validateRecoveryPhrase(first), true);
    assert.equal(validateRecoveryPhrase(second), true);
    assert.notEqual(first, second);
  });

  it("normalizes imported phrases but rejects invalid checksums and word counts", () => {
    const spaced = `  ${PUBLIC_TEST_PHRASE.toUpperCase().replaceAll(" ", " \n ")}  `;
    assert.equal(normalizeMnemonic(spaced), PUBLIC_TEST_PHRASE);
    assert.equal(validateRecoveryPhrase(spaced), true);
    assert.equal(validateRecoveryPhrase(Array(12).fill("test").join(" ")), false);
    assert.equal(validateRecoveryPhrase("test test junk"), false);
    assert.equal(validateRecoveryPhrase("unknown ".repeat(24)), false);
    assert.throws(() => deriveWalletAddress("not a recovery phrase"), /invalid/i);
  });
});

describe("encrypted wallet vault", () => {
  let vault: VaultRecord;
  before(async () => {
    vault = await createVault({ name: "Test vault", password: PASSWORD, mnemonic: PUBLIC_TEST_PHRASE, backupConfirmed: true });
  });

  it("round-trips a secret while exporting only encrypted material and public metadata", async () => {
    const serialized = serializeVault(vault);
    assert.equal(serialized.includes(PUBLIC_TEST_PHRASE), false);
    assert.equal(serialized.includes(PASSWORD), false);
    assert.equal(serialized.includes('"mnemonic"'), false);
    assert.equal(serialized.includes('"privateKey"'), false);
    assert.equal(vault.address, PUBLIC_TEST_ADDRESS);
    assert.deepEqual(parseVaultBackup(serialized), vault);
    assert.deepEqual(await unlockVault(parseVaultBackup(serialized), PASSWORD), { mnemonic: PUBLIC_TEST_PHRASE });
    assert.equal(Buffer.from(vault.salt, "base64").length, 16);
    assert.equal(Buffer.from(vault.iv, "base64").length, 12);
    assert.equal(vault.kdf.iterations, 600_000);
  });

  it("uses distinct salts, IVs, identifiers, and ciphertext for repeated encryption", async () => {
    const second = await createVault({ name: "Test vault", password: PASSWORD, mnemonic: PUBLIC_TEST_PHRASE, backupConfirmed: true });
    assert.notEqual(second.salt, vault.salt);
    assert.notEqual(second.iv, vault.iv);
    assert.notEqual(second.id, vault.id);
    assert.notEqual(second.ciphertext, vault.ciphertext);
    assert.equal(second.address, vault.address);
  });

  it("rejects wrong passwords and ciphertext corruption with the same generic error", async () => {
    const bytes = Buffer.from(vault.ciphertext, "base64");
    bytes[10] ^= 1;
    const modified = { ...vault, ciphertext: bytes.toString("base64") };
    const message = "Unable to unlock this wallet. Check the password and backup file.";
    await assert.rejects(unlockVault(vault, "An incorrect password!"), { message });
    await assert.rejects(unlockVault(modified, PASSWORD), { message });
  });

  it("authenticates public wallet metadata as well as the encrypted secret", async () => {
    const mutations: Array<Partial<VaultRecord>> = [
      { name: "Changed name" },
      { address: "0x0000000000000000000000000000000000000001" },
      { id: "94f6170d-f064-416c-8f79-263d5fd7eda0" },
      { createdAt: "2026-01-01T00:00:00.000Z" },
      { backupConfirmed: false },
    ];
    for (const mutation of mutations) {
      await assert.rejects(unlockVault({ ...vault, ...mutation }, PASSWORD), /Unable to unlock/);
    }
  });

  it("rejects malformed backups and modified KDF settings before running an expensive KDF", () => {
    const invalid: unknown[] = [
      null,
      [],
      {},
      { ...vault, version: 2 },
      { ...vault, mnemonic: PUBLIC_TEST_PHRASE },
      { ...vault, cipher: "AES-CBC" },
      { ...vault, kdf: { ...vault.kdf, iterations: 599_999 } },
      { ...vault, kdf: { ...vault.kdf, iterations: 10_000_000_000 } },
      { ...vault, kdf: { ...vault.kdf, hash: "SHA-1" } },
      { ...vault, salt: Buffer.alloc(15).toString("base64") },
      { ...vault, iv: Buffer.alloc(13).toString("base64") },
      { ...vault, ciphertext: "not base64" },
      { ...vault, ciphertext: Buffer.alloc(15).toString("base64") },
      { ...vault, address: "0xdeadbeef" },
      { ...vault, createdAt: "not a date" },
      { ...vault, name: "\n" },
      { ...vault, backupConfirmed: "true" },
    ];
    for (const entry of invalid) {
      assert.throws(() => parseVaultBackup(JSON.stringify(entry)), /Invalid Qozmo backup/);
    }
    assert.throws(() => parseVaultBackup("{"), /Invalid Qozmo backup/);
    assert.throws(() => parseVaultBackup(" ".repeat(16_385)), /Invalid Qozmo backup/);
  });

  it("enforces wallet naming, password length, and mnemonic validation before encryption", async () => {
    const valid = { name: "Test vault", password: PASSWORD, mnemonic: PUBLIC_TEST_PHRASE, backupConfirmed: true };
    await assert.rejects(createVault({ ...valid, password: "short" }), /at least 12/);
    await assert.rejects(createVault({ ...valid, name: " " }), /name between/);
    await assert.rejects(createVault({ ...valid, mnemonic: "invalid words" }), /invalid/);
  });

  describe("local persistence", () => {
    const data = new Map<string, string>();
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const storage: Storage = {
      get length() { return data.size; },
      clear: () => data.clear(),
      getItem: (key) => data.get(key) ?? null,
      key: (index) => Array.from(data.keys())[index] ?? null,
      removeItem: (key) => { data.delete(key); },
      setItem: (key, value) => { data.set(key, value); },
    };
    before(() => {
      Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
    });
    after(() => {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
    });

    it("persists encrypted records, prevents replacement, and removes only its own key", async () => {
      data.clear();
      data.set("unrelated-setting", "kept");
      assert.equal(readStoredVault(), null);
      storeVault(vault);
      storeVault(vault); // Idempotent saves are allowed.
      assert.deepEqual(readStoredVault(), vault);
      assert.equal(data.get(STORAGE_KEY)?.includes(PUBLIC_TEST_PHRASE), false);
      const other = await createVault({ name: "Another wallet", password: PASSWORD, mnemonic: PUBLIC_TEST_PHRASE, backupConfirmed: true });
      assert.throws(() => storeVault(other), /wallet is already saved/);
      assert.deepEqual(readStoredVault(), vault);
      removeStoredVault();
      assert.equal(readStoredVault(), null);
      assert.equal(data.get("unrelated-setting"), "kept");
      storeVault(parseVaultBackup(serializeVault(vault)));
      assert.deepEqual(await unlockVault(readStoredVault()!, PASSWORD), { mnemonic: PUBLIC_TEST_PHRASE });
      removeStoredVault();
    });

    it("reports corrupt storage without silently deleting or overwriting it", () => {
      data.clear();
      data.set(STORAGE_KEY, "corrupt-wallet-file");
      assert.throws(() => readStoredVault(), /saved wallet is unreadable/);
      assert.throws(() => storeVault(vault), /saved wallet is unreadable/);
      assert.equal(data.get(STORAGE_KEY), "corrupt-wallet-file");
    });
  });
});
