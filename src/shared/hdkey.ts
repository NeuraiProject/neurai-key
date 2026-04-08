import { secp256k1 } from "@noble/curves/secp256k1.js";
import { base58CheckEncode, bigIntMod, BITCOIN_SEED_KEY, bytesToHex, bytesToNumberBE, concatBytes, HARDENED_OFFSET, hash160, hmacSha512, isValidPrivateKey, numberToBytesBE, SECP256K1_ORDER, uint32ToBytesBE } from "./bytes.js";
import type { Bip32Versions } from "./networks.js";

function ensureValidTweak(tweak: Uint8Array): bigint {
  const tweakValue = bytesToNumberBE(tweak);
  if (tweakValue === 0n || tweakValue >= SECP256K1_ORDER) {
    throw new Error("Invalid BIP32 tweak");
  }
  return tweakValue;
}

function serializeExtendedKey(version: number, depth: number, parentFingerprint: number, index: number, chainCode: Uint8Array, keyData: Uint8Array): Uint8Array {
  return concatBytes(
    uint32ToBytesBE(version),
    Uint8Array.from([depth]),
    uint32ToBytesBE(parentFingerprint),
    uint32ToBytesBE(index),
    chainCode,
    keyData,
  );
}

export class HDKey {
  versions: Bip32Versions;
  depth: number;
  index: number;
  chainCode: Uint8Array;
  parentFingerprint: number;
  privateKey?: Uint8Array;
  publicKey: Uint8Array;

  constructor(versions: Bip32Versions, chainCode: Uint8Array, publicKey: Uint8Array, privateKey?: Uint8Array, depth = 0, index = 0, parentFingerprint = 0) {
    this.versions = versions;
    this.depth = depth;
    this.index = index;
    this.chainCode = chainCode;
    this.parentFingerprint = parentFingerprint;
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  static fromMasterSeed(seed: Uint8Array, versions: Bip32Versions): HDKey {
    const I = hmacSha512(BITCOIN_SEED_KEY, seed);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);

    if (!isValidPrivateKey(IL)) {
      throw new Error("Invalid master seed");
    }

    const publicKey = secp256k1.getPublicKey(IL, true);
    return new HDKey(versions, IR, publicKey, IL);
  }

  get fingerprint(): number {
    return new DataView(hash160(this.publicKey).buffer, hash160(this.publicKey).byteOffset, 4).getUint32(0, false);
  }

  get privateExtendedKey(): string | null {
    if (!this.privateKey) {
      return null;
    }
    const keyData = concatBytes(Uint8Array.from([0x00]), this.privateKey);
    return base58CheckEncode(serializeExtendedKey(this.versions.private, this.depth, this.parentFingerprint, this.index, this.chainCode, keyData));
  }

  get publicExtendedKey(): string {
    return base58CheckEncode(serializeExtendedKey(this.versions.public, this.depth, this.parentFingerprint, this.index, this.chainCode, this.publicKey));
  }

  derive(path: string): HDKey {
    if (path === "m" || path === "M" || path === "m'" || path === "M'") {
      return this;
    }

    const entries = path.split("/");
    let current = this as HDKey;

    entries.forEach((entry, index) => {
      if (index === 0) {
        if (!/^[mM]{1}/.test(entry)) {
          throw new Error('Path must start with "m" or "M"');
        }
        return;
      }

      const hardened = entry.endsWith("'");
      const childIndex = Number.parseInt(entry, 10);
      if (!Number.isFinite(childIndex) || childIndex >= HARDENED_OFFSET) {
        throw new Error("Invalid index");
      }

      current = current.deriveChild(hardened ? childIndex + HARDENED_OFFSET : childIndex);
    });

    return current;
  }

  deriveChild(index: number): HDKey {
    const hardened = index >= HARDENED_OFFSET;
    const indexBytes = uint32ToBytesBE(index);
    const data = hardened
      ? (() => {
        if (!this.privateKey) {
          throw new Error("Could not derive hardened child key");
        }
        return concatBytes(Uint8Array.from([0x00]), this.privateKey, indexBytes);
      })()
      : concatBytes(this.publicKey, indexBytes);

    const I = hmacSha512(this.chainCode, data);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    let tweak: bigint;

    try {
      tweak = ensureValidTweak(IL);
    } catch {
      return this.deriveChild(index + 1);
    }

    if (this.privateKey) {
      const childKey = bigIntMod(bytesToNumberBE(this.privateKey) + tweak, SECP256K1_ORDER);
      if (childKey === 0n) {
        return this.deriveChild(index + 1);
      }
      const privateKey = numberToBytesBE(childKey, 32);
      const publicKey = secp256k1.getPublicKey(privateKey, true);
      return new HDKey(this.versions, IR, publicKey, privateKey, this.depth + 1, index, this.fingerprint);
    }

    const tweakPoint = secp256k1.Point.BASE.multiply(tweak);
    const parentPoint = secp256k1.Point.fromHex(bytesToHex(this.publicKey));
    const childPoint = tweakPoint.add(parentPoint);
    if (childPoint.equals(secp256k1.Point.ZERO)) {
      return this.deriveChild(index + 1);
    }

    return new HDKey(this.versions, IR, childPoint.toBytes(true), undefined, this.depth + 1, index, this.fingerprint);
  }
}
