import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bech32m } from "bech32";
import { base58CheckDecode, base58CheckEncode, bytesToHex, concatBytes, ensureBytes, hash160, sha256Hash, taggedHash } from "./bytes.js";
import type { AddressVersions, AuthScriptNetworkConfig, Bech32Params, PQNetworkConfig, Secp256k1NetworkConfig } from "./networks.js";
import type { AuthScriptOptions, AuthType } from "../../types.js";

const AUTHSCRIPT_TAG = "NeuraiAuthScript";
// Witness versions double as the commitment preimage lead byte.
const AUTHSCRIPT_VERSION = 0x01; // generic AuthScript
const PQ_WITNESS_VERSION = 0x02; // strict PQ
const ECDSA_WITNESS_VERSION = 0x03; // strict ECDSA
const NOAUTH_TYPE = 0x00;
const PQ_AUTH_TYPE = 0x01;
const LEGACY_AUTH_TYPE = 0x02;
const PQ_PUBLIC_KEY_HEADER = Uint8Array.from([0x05]);
const DEFAULT_WITNESS_SCRIPT = Uint8Array.from([0x51]);

export function encodeWIF(privateKey: Uint8Array, version: number, compressed = true): string {
  const payload = compressed
    ? concatBytes(Uint8Array.from([version]), privateKey, Uint8Array.from([0x01]))
    : concatBytes(Uint8Array.from([version]), privateKey);

  return base58CheckEncode(payload);
}

export function decodeWIF(wif: string): { privateKey: Uint8Array; version: number; compressed: boolean } {
  const payload = base58CheckDecode(wif);
  if (payload.length !== 33 && payload.length !== 34) {
    throw new Error("Invalid WIF length");
  }

  const version = payload[0];
  const compressed = payload.length === 34;

  if (compressed && payload[payload.length - 1] !== 0x01) {
    throw new Error("Invalid compressed WIF payload");
  }

  return {
    version,
    privateKey: payload.slice(1, 33),
    compressed,
  };
}

export function getCompressedPublicKey(privateKey: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(privateKey, true);
}

export function publicKeyToAddressBytes(publicKey: Uint8Array, versions: AddressVersions): string {
  return base58CheckEncode(concatBytes(Uint8Array.from([versions.public]), hash160(publicKey)));
}

export function privateKeyToAddressObject(privateKey: Uint8Array, versions: AddressVersions, path: string) {
  const publicKey = getCompressedPublicKey(privateKey);
  return {
    address: publicKeyToAddressBytes(publicKey, versions),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(privateKey),
    WIF: encodeWIF(privateKey, versions.private),
  };
}

export function addressObjectFromWIF(wif: string, versions: AddressVersions) {
  const decoded = decodeWIF(wif);
  const publicKey = decoded.compressed
    ? secp256k1.getPublicKey(decoded.privateKey, true)
    : secp256k1.getPublicKey(decoded.privateKey, false);

  return {
    address: publicKeyToAddressBytes(publicKey, versions),
    privateKey: bytesToHex(decoded.privateKey),
    WIF: encodeWIF(decoded.privateKey, versions.private, decoded.compressed),
  };
}

export function publicKeyHexFromWIF(wif: string, compressed = true): string {
  const decoded = decodeWIF(wif);
  return bytesToHex(secp256k1.getPublicKey(decoded.privateKey, compressed && decoded.compressed));
}

export function bech32mEncode(hrp: string, witnessVersion: number, hash: Uint8Array): string {
  return bech32m.encode(hrp, [witnessVersion, ...bech32m.toWords(hash)]);
}

// Not provided (undefined / null): default OP_TRUE. A provided script must be
// non-empty, so an empty value is never silently replaced by OP_TRUE.
export function normalizeWitnessScript(input?: Uint8Array | string | null): Uint8Array {
  if (input === undefined || input === null) {
    return Uint8Array.from(DEFAULT_WITNESS_SCRIPT);
  }
  const script = ensureBytes(input);
  if (script.length === 0) {
    throw new Error("witnessScript must not be empty");
  }
  return script;
}

export function buildAuthDescriptor(authType: AuthType, publicKey: Uint8Array | null): Uint8Array {
  if (authType === NOAUTH_TYPE) {
    return Uint8Array.from([NOAUTH_TYPE]);
  }

  if (!publicKey) {
    throw new Error(`Auth type 0x${authType.toString(16).padStart(2, "0")} requires a public key`);
  }

  if (authType === PQ_AUTH_TYPE) {
    return concatBytes(Uint8Array.from([PQ_AUTH_TYPE]), hash160(concatBytes(PQ_PUBLIC_KEY_HEADER, publicKey)));
  }

  if (authType === LEGACY_AUTH_TYPE) {
    return concatBytes(Uint8Array.from([LEGACY_AUTH_TYPE]), hash160(publicKey));
  }

  throw new Error(`Unsupported authType: 0x${String(authType).padStart(2, "0")}`);
}

export function pqPublicKeyToAuthDescriptor(publicKey: Uint8Array): Uint8Array {
  return buildAuthDescriptor(PQ_AUTH_TYPE, publicKey);
}

export function authScriptCommitmentParts(
  authType: AuthType,
  publicKey: Uint8Array | null,
  options: AuthScriptOptions = {},
  commitmentVersion: number = AUTHSCRIPT_VERSION,
) {
  const witnessScript = normalizeWitnessScript(options.witnessScript);
  const authDescriptor = buildAuthDescriptor(authType, publicKey);
  const witnessScriptHash = sha256Hash(witnessScript);
  const commitment = taggedHash(
    AUTHSCRIPT_TAG,
    concatBytes(
      Uint8Array.from([commitmentVersion]),
      authDescriptor,
      witnessScriptHash,
    ),
  );

  return {
    authDescriptor,
    authType,
    commitment,
    witnessScript,
  };
}

// Generic AuthScript (witness v1): any authType, any witnessScript.

export function authScriptToAddressBytes(
  authType: AuthType,
  publicKey: Uint8Array | null,
  network: AuthScriptNetworkConfig,
  options: AuthScriptOptions = {},
): string {
  return bech32mEncode(network.hrp, network.witnessVersion, authScriptCommitmentParts(authType, publicKey, options).commitment);
}

// PQ (strict witness v2) and ECDSA (strict witness v3): the witness version fixes
// the authType and the witnessScript is always OP_TRUE.

export function pqPublicKeyToCommitmentParts(publicKey: Uint8Array) {
  return authScriptCommitmentParts(PQ_AUTH_TYPE, publicKey, {}, PQ_WITNESS_VERSION);
}

export function pqPublicKeyToAddressBytes(publicKey: Uint8Array, network: PQNetworkConfig): string {
  return bech32mEncode(network.hrp, network.witnessVersion, pqPublicKeyToCommitmentParts(publicKey).commitment);
}

export function ecdsaPublicKeyToCommitmentParts(publicKey: Uint8Array) {
  assertCompressedPublicKey(publicKey);
  return authScriptCommitmentParts(LEGACY_AUTH_TYPE, publicKey, {}, ECDSA_WITNESS_VERSION);
}

export function ecdsaPublicKeyToAddressBytes(publicKey: Uint8Array, bech32: Bech32Params): string {
  return bech32mEncode(bech32.hrp, bech32.witnessVersion, ecdsaPublicKeyToCommitmentParts(publicKey).commitment);
}

// Address of a secp256k1 public key: ECDSA witness v3 when the network has bech32
// params ("xna" / "xna-test"), Legacy Base58 otherwise.
export function secp256k1PublicKeyToAddressBytes(publicKey: Uint8Array, network: Secp256k1NetworkConfig): string {
  return network.bech32
    ? ecdsaPublicKeyToAddressBytes(publicKey, network.bech32)
    : publicKeyToAddressBytes(publicKey, network.versions);
}

// A key off the curve would give an address nobody can spend from.
export function assertValidSecp256k1PublicKey(publicKey: Uint8Array): void {
  try {
    secp256k1.Point.fromBytes(publicKey).assertValidity();
  } catch {
    throw new Error("Public key is not a valid secp256k1 point");
  }
}

// The node has no ECDSA (witness v3) destination for uncompressed keys.
export function assertCompressedPublicKey(publicKey: Uint8Array): void {
  if (publicKey.length !== 33 || (publicKey[0] !== 0x02 && publicKey[0] !== 0x03)) {
    throw new Error("ECDSA (witness v3) addresses require a 33-byte compressed secp256k1 public key");
  }
  assertValidSecp256k1PublicKey(publicKey);
}

export function normalizePublicKey(input: Uint8Array | string): Uint8Array {
  return ensureBytes(input);
}
