import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bech32m } from "bech32";
import { base58CheckDecode, base58CheckEncode, bytesToHex, concatBytes, ensureBytes, hash160, sha256Hash, taggedHash } from "./bytes.js";
import type { AddressVersions, PQNetworkConfig } from "./networks.js";
import type { AuthScriptOptions, AuthType, PQAddressOptions } from "../../types.js";

const AUTHSCRIPT_TAG = "NeuraiAuthScript";
const AUTHSCRIPT_VERSION = 0x01;
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

export function normalizeWitnessScript(input?: Uint8Array | string): Uint8Array {
  return input ? ensureBytes(input) : Uint8Array.from(DEFAULT_WITNESS_SCRIPT);
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

export function pqPublicKeyToCommitment(publicKey: Uint8Array, options: PQAddressOptions = {}): Uint8Array {
  return pqPublicKeyToCommitmentParts(publicKey, options).commitment;
}

export function authScriptCommitmentParts(
  authType: AuthType,
  publicKey: Uint8Array | null,
  options: AuthScriptOptions = {},
) {
  const witnessScript = normalizeWitnessScript(options.witnessScript);
  const authDescriptor = buildAuthDescriptor(authType, publicKey);
  const witnessScriptHash = sha256Hash(witnessScript);
  const commitment = taggedHash(
    AUTHSCRIPT_TAG,
    concatBytes(
      Uint8Array.from([AUTHSCRIPT_VERSION]),
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

export function pqPublicKeyToCommitmentParts(publicKey: Uint8Array, options: PQAddressOptions = {}) {
  return authScriptCommitmentParts(PQ_AUTH_TYPE, publicKey, options);
}

export function pqPublicKeyToAddressBytes(publicKey: Uint8Array, network: PQNetworkConfig, options: PQAddressOptions = {}): string {
  return bech32mEncode(network.hrp, network.witnessVersion, pqPublicKeyToCommitment(publicKey, options));
}

export function noAuthToAddressBytes(network: PQNetworkConfig, options: AuthScriptOptions = {}): string {
  return bech32mEncode(network.hrp, network.witnessVersion, authScriptCommitmentParts(NOAUTH_TYPE, null, options).commitment);
}

export function legacyAuthScriptToAddressBytes(
  publicKey: Uint8Array,
  network: PQNetworkConfig,
  options: AuthScriptOptions = {},
): string {
  return bech32mEncode(
    network.hrp,
    network.witnessVersion,
    authScriptCommitmentParts(LEGACY_AUTH_TYPE, publicKey, options).commitment,
  );
}

export function normalizePublicKey(input: Uint8Array | string): Uint8Array {
  return ensureBytes(input);
}
