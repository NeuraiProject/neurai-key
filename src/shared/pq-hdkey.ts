import { utf8ToBytes } from "@noble/hashes/utils.js";
import { ml_dsa44 } from "@noble/post-quantum/ml-dsa.js";
import { base58CheckDecode, base58CheckEncode, concatBytes, HARDENED_OFFSET, hash160, hmacSha512, uint32ToBytesBE } from "./bytes.js";

const PQ_SEED_KEY = utf8ToBytes("Neurai PQ seed");
const PQ_PUBLIC_KEY_HEADER = 0x05;
// 74-byte layout, padded to match BIP32 xprv so base58check yields "xpqp..."/"tpqp...":
// depth(1) + fingerprint(4) + child(4) + chaincode(32) + padding(1=0x00) + pq_seed(32)
export const BIP32_PQ_EXTKEY_SIZE = 74;

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

  encode(): Uint8Array {
    const out = new Uint8Array(BIP32_PQ_EXTKEY_SIZE);
    out[0] = this.depth & 0xff;
    out.set(this.parentFingerprint, 1);
    out[5] = (this.index >>> 24) & 0xff;
    out[6] = (this.index >>> 16) & 0xff;
    out[7] = (this.index >>> 8) & 0xff;
    out[8] = this.index & 0xff;
    out.set(this.chainCode, 9);
    out[41] = 0x00; // padding byte (aligns layout with BIP32 xprv)
    out.set(this.pqSeed, 42);
    return out;
  }

  encodeBase58Check(version: number): string {
    const versionBytes = Uint8Array.from([
      (version >>> 24) & 0xff,
      (version >>> 16) & 0xff,
      (version >>> 8) & 0xff,
      version & 0xff,
    ]);
    return base58CheckEncode(concatBytes(versionBytes, this.encode()));
  }

  static decode(raw: Uint8Array, parentFingerprint?: Uint8Array): PQHDKey {
    if (raw.length !== BIP32_PQ_EXTKEY_SIZE) {
      throw new Error(`PQ extended key payload must be ${BIP32_PQ_EXTKEY_SIZE} bytes`);
    }
    if (raw[41] !== 0x00) {
      throw new Error("PQ extended key padding byte (offset 41) must be 0x00");
    }
    const depth = raw[0];
    const fingerprint = parentFingerprint ?? raw.slice(1, 5);
    const index = ((raw[5] << 24) | (raw[6] << 16) | (raw[7] << 8) | raw[8]) >>> 0;
    const chainCode = raw.slice(9, 41);
    const pqSeed = raw.slice(42, 74);
    return new PQHDKey(depth, index, Uint8Array.from(fingerprint.slice(0, 4)), chainCode, pqSeed);
  }

  static decodeBase58Check(extKey: string, expectedVersion: number): PQHDKey {
    const payload = base58CheckDecode(extKey);
    if (payload.length !== 4 + BIP32_PQ_EXTKEY_SIZE) {
      throw new Error("Invalid PQ extended key length");
    }
    const version = ((payload[0] << 24) | (payload[1] << 16) | (payload[2] << 8) | payload[3]) >>> 0;
    if (version !== (expectedVersion >>> 0)) {
      throw new Error(`PQ extended key version mismatch (expected 0x${expectedVersion.toString(16)}, got 0x${version.toString(16)})`);
    }
    return PQHDKey.decode(payload.slice(4));
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
