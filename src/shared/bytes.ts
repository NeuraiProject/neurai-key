import { base58 } from "@scure/base";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { bytesToHex as nobleBytesToHex, concatBytes as nobleConcatBytes, hexToBytes as nobleHexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

export const HARDENED_OFFSET = 0x80000000;
export const SECP256K1_ORDER = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");

export function bytesToHex(bytes: Uint8Array): string {
  return nobleBytesToHex(bytes);
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  return nobleConcatBytes(...arrays);
}

export function hexToBytes(hex: string): Uint8Array {
  return nobleHexToBytes(hex);
}

export function ensureBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === "string" ? hexToBytes(input) : Uint8Array.from(input);
}

export function numberToBytesBE(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let current = value;

  for (let index = length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(current & 0xffn);
    current >>= 8n;
  }

  return bytes;
}

export function bytesToNumberBE(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  return value;
}

export function uint32ToBytesBE(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value, false);
  return bytes;
}

export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

export function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

export function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha512, key, data);
}

export function base58CheckEncode(payload: Uint8Array): string {
  const checksum = doubleSha256(payload).slice(0, 4);
  return base58.encode(concatBytes(payload, checksum));
}

export function base58CheckDecode(value: string): Uint8Array {
  const decoded = Uint8Array.from(base58.decode(value));
  if (decoded.length < 5) {
    throw new Error("Invalid Base58Check payload");
  }

  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const expected = doubleSha256(payload).slice(0, 4);

  for (let index = 0; index < 4; index += 1) {
    if (checksum[index] !== expected[index]) {
      throw new Error("Invalid Base58Check checksum");
    }
  }

  return payload;
}

export function bigIntMod(value: bigint, modulo: bigint): bigint {
  const remainder = value % modulo;
  return remainder >= 0n ? remainder : remainder + modulo;
}

export function isValidPrivateKey(privateKey: Uint8Array): boolean {
  if (privateKey.length !== 32) {
    return false;
  }

  const value = bytesToNumberBE(privateKey);
  return value > 0n && value < SECP256K1_ORDER;
}

export function normalizeString(input: string): string {
  return input.normalize("NFKD");
}

export function mnemonicToSeedBytes(mnemonicToSeedSync: (mnemonic: string, password?: string) => Uint8Array, mnemonic: string, passphrase: string): Uint8Array {
  return Uint8Array.from(mnemonicToSeedSync(mnemonic, passphrase));
}

export const BITCOIN_SEED_KEY = utf8ToBytes("Bitcoin seed");
export const HASH160_PREFIX = Uint8Array.from([0x05]);
