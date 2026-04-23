import { utf8ToBytes } from "@noble/hashes/utils.js";
import { ml_dsa44 } from "@noble/post-quantum/ml-dsa.js";
import { concatBytes, HARDENED_OFFSET, hash160, hmacSha512, uint32ToBytesBE } from "./bytes.js";

const PQ_SEED_KEY = utf8ToBytes("Neurai PQ seed");
const PQ_PUBLIC_KEY_HEADER = 0x05;

export class PQHDKey {
  readonly depth: number;
  readonly index: number;
  readonly parentFingerprint: Uint8Array;
  readonly chainCode: Uint8Array;
  readonly pqSeed: Uint8Array;

  private _publicKey?: Uint8Array;
  private _secretKey?: Uint8Array;

  constructor(depth: number, index: number, parentFingerprint: Uint8Array, chainCode: Uint8Array, pqSeed: Uint8Array) {
    this.depth = depth;
    this.index = index;
    this.parentFingerprint = parentFingerprint;
    this.chainCode = chainCode;
    this.pqSeed = pqSeed;
  }

  static fromMasterSeed(seed: Uint8Array): PQHDKey {
    const I = hmacSha512(PQ_SEED_KEY, seed);
    return new PQHDKey(0, 0, new Uint8Array(4), I.slice(32, 64), I.slice(0, 32));
  }

  private ensureKeypair(): void {
    if (!this._publicKey || !this._secretKey) {
      const { publicKey, secretKey } = ml_dsa44.keygen(this.pqSeed);
      this._publicKey = publicKey;
      this._secretKey = secretKey;
    }
  }

  get publicKey(): Uint8Array {
    this.ensureKeypair();
    return this._publicKey!;
  }

  get secretKey(): Uint8Array {
    this.ensureKeypair();
    return this._secretKey!;
  }

  get fingerprint(): Uint8Array {
    return hash160(concatBytes(Uint8Array.from([PQ_PUBLIC_KEY_HEADER]), this.publicKey)).slice(0, 4);
  }

  deriveChild(index: number): PQHDKey {
    if ((index & HARDENED_OFFSET) === 0) {
      throw new Error("PQ-HD (NIP-022) requires hardened derivation at every level");
    }
    const data = concatBytes(
      Uint8Array.from([0x00]),
      this.pqSeed,
      uint32ToBytesBE(index >>> 0),
    );
    const I = hmacSha512(this.chainCode, data);
    return new PQHDKey(this.depth + 1, index >>> 0, this.fingerprint, I.slice(32, 64), I.slice(0, 32));
  }

  derive(path: string): PQHDKey {
    const entries = path.split("/");
    const root = entries[0];
    if (root !== "m" && root !== "M" && root !== "m_pq" && root !== "M_pq") {
      throw new Error('PQ path must start with "m_pq" (or "m")');
    }
    if (entries.length === 1) {
      return this;
    }

    let current: PQHDKey = this;
    for (let i = 1; i < entries.length; i += 1) {
      const entry = entries[i];
      const hardened = entry.endsWith("'");
      if (!hardened) {
        throw new Error(`PQ-HD path requires hardened indices (got "${entry}")`);
      }
      const raw = Number.parseInt(entry.slice(0, -1), 10);
      if (!Number.isFinite(raw) || raw < 0 || raw >= HARDENED_OFFSET) {
        throw new Error(`Invalid PQ-HD index "${entry}"`);
      }
      current = current.deriveChild(raw + HARDENED_OFFSET);
    }
    return current;
  }
}
