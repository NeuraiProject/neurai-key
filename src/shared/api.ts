import {
  entropyToMnemonic as bip39EntropyToMnemonic,
  generateMnemonic as bip39GenerateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic as bip39ValidateMnemonic,
} from "@scure/bip39";
import { wordlist as czechWordlist } from "@scure/bip39/wordlists/czech.js";
import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english.js";
import { wordlist as frenchWordlist } from "@scure/bip39/wordlists/french.js";
import { wordlist as italianWordlist } from "@scure/bip39/wordlists/italian.js";
import { wordlist as japaneseWordlist } from "@scure/bip39/wordlists/japanese.js";
import { wordlist as koreanWordlist } from "@scure/bip39/wordlists/korean.js";
import { wordlist as portugueseWordlist } from "@scure/bip39/wordlists/portuguese.js";
import { wordlist as spanishWordlist } from "@scure/bip39/wordlists/spanish.js";
import { wordlist as simplifiedChineseWordlist } from "@scure/bip39/wordlists/simplified-chinese.js";
import { bytesToHex, ensureBytes, mnemonicToSeedBytes } from "./bytes.js";
import {
  addressObjectFromWIF,
  assertValidSecp256k1PublicKey,
  authScriptCommitmentParts,
  authScriptToAddressBytes,
  decodeWIF,
  ecdsaPublicKeyToAddressBytes,
  ecdsaPublicKeyToCommitmentParts,
  secp256k1PublicKeyToAddressBytes,
  encodeWIF,
  getCompressedPublicKey,
  normalizePublicKey,
  normalizeWitnessScript,
  pqPublicKeyToAddressBytes,
  pqPublicKeyToAuthDescriptor,
  pqPublicKeyToCommitmentParts,
  publicKeyHexFromWIF,
} from "./address.js";
import { HDKey } from "./hdkey.js";
import { BIP32_PQ_EXTKEY_SIZE, PQHDKey } from "./pq-hdkey.js";

export { BIP32_PQ_EXTKEY_SIZE, HDKey, PQHDKey };
import {
  getAuthScriptNetwork,
  getNetwork,
  getPQNetwork,
  type AuthScriptNetwork,
  type IAddressObject,
  type ILegacyAuthScriptAddressObject,
  type INoAuthAddressObject,
  type IPQAddressObject,
  type IPQAuthScriptAddressObject,
  type Network,
  type PQNetwork,
  type Secp256k1NetworkConfig,
} from "./networks.js";
import type { AuthScriptOptions, NoAuthOptions, PQAddressOptions } from "../../types.js";

export type {
  AuthScriptNetwork,
  IAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  IPQAuthScriptAddressObject,
  Network,
  AuthScriptOptions,
  NoAuthOptions,
  PQAddressOptions,
  PQNetwork,
};

const mnemonicWordlists = [
  czechWordlist,
  englishWordlist,
  spanishWordlist,
  frenchWordlist,
  italianWordlist,
  japaneseWordlist,
  koreanWordlist,
  portugueseWordlist,
  simplifiedChineseWordlist,
];

// Account and index become BIP32 path segments: integers below the hardened offset.
function assertPathIndex(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value >= 0x80000000) {
    throw new Error(`${name} must be an integer between 0 and 2147483647 (got ${value})`);
  }
}

// ---------------------------------------------------------------------------
// secp256k1 addresses. The network selects the address type:
//   "xna" / "xna-test":               ECDSA, Bech32m witness v3, m/84'/coin'
//   "xna-legacy" / "xna-legacy-test": Legacy Base58, m/44'/1900' (testnet m/44'/1')
//   "xna-old-legacy":                 Legacy Base58, m/44'/0' (mainnet only)
// ---------------------------------------------------------------------------

function ecdsaWitnessFields(publicKey: Uint8Array) {
  const parts = ecdsaPublicKeyToCommitmentParts(publicKey);
  return {
    witnessVersion: 0x03 as const,
    authType: 0x02 as const,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

function secp256k1AddressObject(chain: Secp256k1NetworkConfig, privateKey: Uint8Array, path: string): IAddressObject {
  const publicKey = getCompressedPublicKey(privateKey);
  return {
    address: secp256k1PublicKeyToAddressBytes(publicKey, chain),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(privateKey),
    WIF: encodeWIF(privateKey, chain.versions.private),
    ...(chain.bech32 ? ecdsaWitnessFields(publicKey) : {}),
  };
}

export function getCoinType(network: Network) {
  return getNetwork(network).versions.bip44;
}

export function getAddressPair(
  network: Network,
  mnemonic: string,
  account: number,
  position: number,
  passphrase = "",
) {
  assertPathIndex("account", account);
  assertPathIndex("position", position);
  const chain = getNetwork(network);
  const hdKey = getHDKey(network, mnemonic, passphrase);
  const accountPath = `m/${chain.purpose}'/${chain.versions.bip44}'/${account}'`;
  const externalPath = `${accountPath}/0/${position}`;
  const internalPath = `${accountPath}/1/${position}`;

  return {
    internal: getAddressByPath(network, hdKey, internalPath),
    external: getAddressByPath(network, hdKey, externalPath),
    position,
  };
}

export function getHDKey(network: Network, mnemonic: string, passphrase = ""): HDKey {
  const chain = getNetwork(network);
  const seed = mnemonicToSeedBytes(mnemonicToSeedSync, mnemonic, passphrase);
  return HDKey.fromMasterSeed(seed, chain.versions.bip32);
}

export function getAddressByPath(network: Network, hdKey: HDKey, path: string): IAddressObject {
  const chain = getNetwork(network);
  const derived = hdKey.derive(path);
  if (!derived.privateKey) {
    throw new Error("Could not derive private key for path");
  }
  return secp256k1AddressObject(chain, derived.privateKey, path);
}

export function generateMnemonic() {
  return bip39GenerateMnemonic(englishWordlist);
}

export function isMnemonicValid(mnemonic: string) {
  return mnemonicWordlists.some((wordlist) => bip39ValidateMnemonic(mnemonic, wordlist));
}

export function getAddressByWIF(network: Network, privateKeyWIF: string) {
  const chain = getNetwork(network);
  if (!chain.bech32) {
    return addressObjectFromWIF(privateKeyWIF, chain.versions);
  }

  const decoded = decodeWIF(privateKeyWIF);
  if (!decoded.compressed) {
    throw new Error("ECDSA (witness v3) addresses require a compressed WIF");
  }
  const publicKey = getCompressedPublicKey(decoded.privateKey);
  return {
    address: ecdsaPublicKeyToAddressBytes(publicKey, chain.bech32),
    privateKey: bytesToHex(decoded.privateKey),
    WIF: encodeWIF(decoded.privateKey, chain.versions.private),
    ...ecdsaWitnessFields(publicKey),
  };
}

export function getPubkeyByWIF(_network: Network, privateKeyWIF: string): string {
  return publicKeyHexFromWIF(privateKeyWIF);
}

export function entropyToMnemonic(entropy: Uint8Array | string): string {
  const normalized = typeof entropy === "string" ? ensureBytes(entropy) : entropy;
  return bip39EntropyToMnemonic(normalized, englishWordlist);
}

// Default stays Legacy: ECDSA witness v3 is not active on mainnet/testnet yet.
export function generateAddressObject(network: Network = "xna-legacy", passphrase = ""): IAddressObject {
  const mnemonic = generateMnemonic();
  const addressObject = getAddressPair(network, mnemonic, 0, 0, passphrase).external;
  return {
    ...addressObject,
    mnemonic,
    network,
  };
}

export function publicKeyToAddress(network: Network, publicKey: Uint8Array | string): string {
  const keyBytes = normalizePublicKey(publicKey);
  const chain = getNetwork(network);
  if (!chain.bech32 && keyBytes.length !== 33 && keyBytes.length !== 65) {
    throw new Error("Public key must be 33 or 65 bytes");
  }
  assertValidSecp256k1PublicKey(keyBytes);
  return secp256k1PublicKeyToAddressBytes(keyBytes, chain);
}

export function generateAddress(network: Network = "xna-legacy") {
  return generateAddressObject(network);
}

// ---------------------------------------------------------------------------
// PQ addresses: strict AuthScript witness v2 (pq1z... / tpq1z...).
// ML-DSA-44 key from the native PQ tree, fixed OP_TRUE witnessScript.
// ---------------------------------------------------------------------------

// 4.x PQ functions took AuthScript options. PQ (witness v2) has a fixed OP_TRUE
// witnessScript, so reject them instead of silently dropping a contract script.
function rejectRemovedPQOptions(fn: string, replacement: string, options: unknown): void {
  if (options !== undefined) {
    throw new Error(
      `${fn}() no longer accepts AuthScript options: PQ addresses (witness v2) use a fixed OP_TRUE witnessScript. ` +
        `Use ${replacement}() with an "xna-authscript" network for a custom witnessScript.`,
    );
  }
}

function assertPQPublicKey(keyBytes: Uint8Array): void {
  if (keyBytes.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }
}

export function getPQHDKey(_network: PQNetwork, mnemonic: string, passphrase = ""): PQHDKey {
  const seed = mnemonicToSeedBytes(mnemonicToSeedSync, mnemonic, passphrase);
  return PQHDKey.fromMasterSeed(seed);
}

export function pqExtendedPrivateKey(network: PQNetwork, hdKey: PQHDKey): string {
  return hdKey.encodeBase58Check(getPQNetwork(network).pqExtPrivVersion);
}

export function pqHDKeyFromExtended(network: PQNetwork, extKey: string): PQHDKey {
  return PQHDKey.decodeBase58Check(extKey, getPQNetwork(network).pqExtPrivVersion);
}

export function getPQAddressByPath(
  network: PQNetwork,
  hdKey: PQHDKey,
  path: string,
  removedOptions?: never,
): IPQAddressObject {
  rejectRemovedPQOptions("getPQAddressByPath", "getPQAuthScriptAddressByPath", removedOptions);
  const chain = getPQNetwork(network);
  const derived = hdKey.derive(path);
  const publicKey = derived.publicKey;
  const parts = pqPublicKeyToCommitmentParts(publicKey);

  return {
    address: pqPublicKeyToAddressBytes(publicKey, chain),
    witnessVersion: 0x02,
    authType: 0x01,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(derived.secretKey),
    seedKey: bytesToHex(derived.pqSeed),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

function pqDefaultPath(network: PQNetwork, account: number, index: number): string {
  assertPathIndex("account", account);
  assertPathIndex("index", index);
  const chain = getPQNetwork(network);
  return `m_pq/${chain.purpose}'/${chain.coinType}'/${account}'/${chain.changeIndex}'/${index}'`;
}

export function getPQAddress(
  network: PQNetwork,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
  removedOptions?: never,
): IPQAddressObject {
  rejectRemovedPQOptions("getPQAddress", "getPQAuthScriptAddress", removedOptions);
  const hdKey = getPQHDKey(network, mnemonic, passphrase);
  return getPQAddressByPath(network, hdKey, pqDefaultPath(network, account, index));
}

export function pqPublicKeyToAddress(network: PQNetwork, publicKey: Uint8Array | string, removedOptions?: never): string {
  rejectRemovedPQOptions("pqPublicKeyToAddress", "pqPublicKeyToAuthScriptAddress", removedOptions);
  const keyBytes = ensureBytes(publicKey);
  assertPQPublicKey(keyBytes);
  return pqPublicKeyToAddressBytes(keyBytes, getPQNetwork(network));
}

export function pqPublicKeyToCommitmentHex(publicKey: Uint8Array | string, removedOptions?: never): string {
  rejectRemovedPQOptions("pqPublicKeyToCommitmentHex", "pqPublicKeyToAuthScriptCommitmentHex", removedOptions);
  const keyBytes = ensureBytes(publicKey);
  assertPQPublicKey(keyBytes);
  return bytesToHex(pqPublicKeyToCommitmentParts(keyBytes).commitment);
}

export function pqPublicKeyToAuthDescriptorHex(publicKey: Uint8Array | string): string {
  const keyBytes = ensureBytes(publicKey);
  assertPQPublicKey(keyBytes);
  return bytesToHex(pqPublicKeyToAuthDescriptor(keyBytes));
}

export function generatePQAddressObject(
  network: PQNetwork = "xna-pq",
  passphrase = "",
  removedOptions?: never,
): IPQAddressObject {
  rejectRemovedPQOptions("generatePQAddressObject", "getPQAuthScriptAddress", removedOptions);
  const mnemonic = generateMnemonic();
  return {
    ...getPQAddress(network, mnemonic, 0, 0, passphrase),
    mnemonic,
  };
}

// ---------------------------------------------------------------------------
// Generic AuthScript: witness v1 (nc1p... / tnc1p...). Any authType and any
// witnessScript; used for contracts.
// ---------------------------------------------------------------------------

export function getPQAuthScriptAddressByPath(
  network: AuthScriptNetwork,
  hdKey: PQHDKey,
  path: string,
  options: AuthScriptOptions = {},
): IPQAuthScriptAddressObject {
  const chain = getAuthScriptNetwork(network);
  const derived = hdKey.derive(path);
  const publicKey = derived.publicKey;
  const parts = authScriptCommitmentParts(0x01, publicKey, options);

  return {
    address: authScriptToAddressBytes(0x01, publicKey, chain, options),
    witnessVersion: 0x01,
    authType: 0x01,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(derived.secretKey),
    seedKey: bytesToHex(derived.pqSeed),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getPQAuthScriptAddress(
  network: AuthScriptNetwork,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
  options: AuthScriptOptions = {},
): IPQAuthScriptAddressObject {
  const pqNetwork = getAuthScriptNetwork(network).pqNetwork;
  const hdKey = getPQHDKey(pqNetwork, mnemonic, passphrase);
  return getPQAuthScriptAddressByPath(network, hdKey, pqDefaultPath(pqNetwork, account, index), options);
}

export function pqPublicKeyToAuthScriptAddress(
  network: AuthScriptNetwork,
  publicKey: Uint8Array | string,
  options: AuthScriptOptions = {},
): string {
  const keyBytes = ensureBytes(publicKey);
  assertPQPublicKey(keyBytes);
  normalizeWitnessScript(options.witnessScript);
  return authScriptToAddressBytes(0x01, keyBytes, getAuthScriptNetwork(network), options);
}

export function pqPublicKeyToAuthScriptCommitmentHex(publicKey: Uint8Array | string, options: AuthScriptOptions = {}): string {
  const keyBytes = ensureBytes(publicKey);
  assertPQPublicKey(keyBytes);
  return bytesToHex(authScriptCommitmentParts(0x01, keyBytes, options).commitment);
}

// NoAuth has no key, so the witnessScript alone decides who can spend: never
// default it. The library only checks that a script is given, not that it is safe.
export function getNoAuthAddress(network: AuthScriptNetwork, options: NoAuthOptions): INoAuthAddressObject {
  const chain = getAuthScriptNetwork(network);
  if (options?.witnessScript === undefined || options?.witnessScript === null) {
    throw new Error(
      "getNoAuthAddress() requires an explicit witnessScript: a NoAuth address has no key, " +
        "so the script alone defines who can spend it",
    );
  }
  const parts = authScriptCommitmentParts(0x00, null, options);

  return {
    address: authScriptToAddressBytes(0x00, null, chain, options),
    witnessVersion: 0x01,
    authType: 0x00,
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getLegacyAuthScriptAddress(
  network: AuthScriptNetwork,
  keyNetwork: Network,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
  options: AuthScriptOptions = {},
): ILegacyAuthScriptAddressObject {
  assertPathIndex("account", account);
  assertPathIndex("index", index);
  // The secp256k1 key is the one keyNetwork derives at this account/index.
  const chain = getAuthScriptNetwork(network);
  const keyChain = getNetwork(keyNetwork);
  const hdKey = getHDKey(keyNetwork, mnemonic, passphrase);
  const path = `m/${keyChain.purpose}'/${keyChain.versions.bip44}'/${account}'/0/${index}`;
  const derived = hdKey.derive(path);

  if (!derived.privateKey) {
    throw new Error("Could not derive private key for path");
  }

  const publicKeyBytes = getCompressedPublicKey(derived.privateKey);
  const parts = authScriptCommitmentParts(0x02, publicKeyBytes, options);

  return {
    address: authScriptToAddressBytes(0x02, publicKeyBytes, chain, options),
    path,
    publicKey: bytesToHex(publicKeyBytes),
    privateKey: bytesToHex(derived.privateKey),
    WIF: encodeWIF(derived.privateKey, keyChain.versions.private),
    witnessVersion: 0x01,
    authType: 0x02,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getLegacyAuthScriptAddressByWIF(
  network: AuthScriptNetwork,
  wif: string,
  options: AuthScriptOptions = {},
): ILegacyAuthScriptAddressObject {
  const chain = getAuthScriptNetwork(network);
  const publicKeyHex = publicKeyHexFromWIF(wif);
  const publicKeyBytes = ensureBytes(publicKeyHex);
  const parts = authScriptCommitmentParts(0x02, publicKeyBytes, options);

  return {
    address: authScriptToAddressBytes(0x02, publicKeyBytes, chain, options),
    publicKey: publicKeyHex,
    privateKey: "",
    WIF: wif,
    witnessVersion: 0x01,
    authType: 0x02,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

const NeuraiKey = {
  entropyToMnemonic,
  generateAddress,
  generateAddressObject,
  generateMnemonic,
  getAddressByPath,
  getAddressByWIF,
  getPubkeyByWIF,
  getAddressPair,
  getCoinType,
  getHDKey,
  isMnemonicValid,
  publicKeyToAddress,
  getPQAddress,
  getPQAddressByPath,
  getPQHDKey,
  pqExtendedPrivateKey,
  pqHDKeyFromExtended,
  pqPublicKeyToAddress,
  pqPublicKeyToAuthDescriptorHex,
  pqPublicKeyToCommitmentHex,
  generatePQAddressObject,
  getPQAuthScriptAddress,
  getPQAuthScriptAddressByPath,
  pqPublicKeyToAuthScriptAddress,
  pqPublicKeyToAuthScriptCommitmentHex,
  getNoAuthAddress,
  getLegacyAuthScriptAddress,
  getLegacyAuthScriptAddressByWIF,
};

export default NeuraiKey;
