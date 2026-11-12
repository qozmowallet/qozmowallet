import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { bytesToHex, hexToBytes, isHex, type Hex } from "viem";

/**
 * A Winternitz seed is 32 random bytes, which is exactly the entropy of a 24-word BIP-39
 * mnemonic. So the mnemonic is simply another spelling of the same seed: no derivation, and
 * wallets created before mnemonics existed keep working.
 */
export function seedToMnemonic(seed: Hex): string {
  const bytes = hexToBytes(seed);
  if (bytes.length !== 32) throw new Error("seed must be 32 bytes");
  return entropyToMnemonic(bytes, wordlist);
}

export function mnemonicToSeed(mnemonic: string): Hex {
  const words = normalizeMnemonic(mnemonic);
  if (words.split(" ").length !== 24) throw new Error("Expected 24 words");
  if (!validateMnemonic(words, wordlist)) throw new Error("Invalid recovery phrase (a word or the checksum is wrong)");
  return bytesToHex(mnemonicToEntropy(words, wordlist));
}

/** Accepts either a 24-word recovery phrase or the 0x-prefixed 32-byte hex seed. */
export function parseSeed(input: string): Hex {
  const trimmed = input.trim();
  if (isHex(trimmed)) {
    if (trimmed.length !== 66) throw new Error("A hex seed is 0x followed by 64 characters");
    return trimmed.toLowerCase() as Hex;
  }
  return mnemonicToSeed(trimmed);
}

function normalizeMnemonic(m: string): string {
  return m.trim().toLowerCase().split(/\s+/).join(" ");
}
