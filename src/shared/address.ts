import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bech32m } from "bech32";
import { base58CheckDecode, base58CheckEncode, bytesToHex, concatBytes, ensureBytes, HASH160_PREFIX, hash160 } from "./bytes.js";
import type { AddressVersions, PQNetworkConfig } from "./networks.js";

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

export function pqPublicKeyToAddressBytes(publicKey: Uint8Array, network: PQNetworkConfig): string {
  const serialized = concatBytes(HASH160_PREFIX, publicKey);
  return bech32mEncode(network.hrp, network.witnessVersion, hash160(serialized));
}

export function normalizePublicKey(input: Uint8Array | string): Uint8Array {
  return ensureBytes(input);
}
