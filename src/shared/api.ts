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
  authScriptCommitmentParts,
  legacyAuthScriptToAddressBytes,
  noAuthToAddressBytes,
  normalizePublicKey,
  normalizeWitnessScript,
  pqPublicKeyToAddressBytes,
  pqPublicKeyToAuthDescriptor,
  pqPublicKeyToCommitment,
  pqPublicKeyToCommitmentParts,
  privateKeyToAddressObject,
  publicKeyHexFromWIF,
  publicKeyToAddressBytes,
} from "./address.js";
import { HDKey } from "./hdkey.js";
import { PQHDKey } from "./pq-hdkey.js";
import {
  getNetwork,
  getPQNetwork,
  type IAddressObject,
  type ILegacyAuthScriptAddressObject,
  type INoAuthAddressObject,
  type IPQAddressObject,
  type Network,
  type PQNetwork,
} from "./networks.js";
import type { AuthScriptOptions, PQAddressOptions } from "../../types.js";

export type {
  IAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  Network,
  AuthScriptOptions,
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

export function getCoinType(network: Network) {
  return getNetwork(network).bip44;
}

export function getAddressPair(
  network: Network,
  mnemonic: string,
  account: number,
  position: number,
  passphrase = "",
) {
  const hdKey = getHDKey(network, mnemonic, passphrase);
  const coinType = getCoinType(network);
  const externalPath = `m/44'/${coinType}'/${account}'/0/${position}`;
  const internalPath = `m/44'/${coinType}'/${account}'/1/${position}`;

  return {
    internal: getAddressByPath(network, hdKey, internalPath),
    external: getAddressByPath(network, hdKey, externalPath),
    position,
  };
}

export function getHDKey(network: Network, mnemonic: string, passphrase = ""): HDKey {
  const chain = getNetwork(network);
  const seed = mnemonicToSeedBytes(mnemonicToSeedSync, mnemonic, passphrase);
  return HDKey.fromMasterSeed(seed, chain.bip32);
}

export function getAddressByPath(network: Network, hdKey: HDKey, path: string): IAddressObject {
  const chain = getNetwork(network);
  const derived = hdKey.derive(path);
  if (!derived.privateKey) {
    throw new Error("Could not derive private key for path");
  }
  return privateKeyToAddressObject(derived.privateKey, chain, path);
}

export function generateMnemonic() {
  return bip39GenerateMnemonic(englishWordlist);
}

export function isMnemonicValid(mnemonic: string) {
  return mnemonicWordlists.some((wordlist) => bip39ValidateMnemonic(mnemonic, wordlist));
}

export function getAddressByWIF(network: Network, privateKeyWIF: string) {
  return addressObjectFromWIF(privateKeyWIF, getNetwork(network));
}

export function getPubkeyByWIF(_network: Network, privateKeyWIF: string): string {
  return publicKeyHexFromWIF(privateKeyWIF);
}

export function entropyToMnemonic(entropy: Uint8Array | string): string {
  const normalized = typeof entropy === "string" ? ensureBytes(entropy) : entropy;
  return bip39EntropyToMnemonic(normalized, englishWordlist);
}

export function generateAddressObject(network: Network = "xna", passphrase = ""): IAddressObject {
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
  if (keyBytes.length !== 33 && keyBytes.length !== 65) {
    throw new Error("Public key must be 33 or 65 bytes");
  }
  return publicKeyToAddressBytes(keyBytes, getNetwork(network));
}

export function generateAddress(network: Network = "xna") {
  return generateAddressObject(network);
}

export function getPQHDKey(_network: PQNetwork, mnemonic: string, passphrase = ""): PQHDKey {
  const seed = mnemonicToSeedBytes(mnemonicToSeedSync, mnemonic, passphrase);
  return PQHDKey.fromMasterSeed(seed);
}

export function getPQAddressByPath(network: PQNetwork, hdKey: PQHDKey, path: string, options: PQAddressOptions = {}): IPQAddressObject {
  const chain = getPQNetwork(network);
  const derived = hdKey.derive(path);
  const publicKey = derived.publicKey;
  const secretKey = derived.secretKey;
  const authScript = pqPublicKeyToCommitmentParts(publicKey, options);

  return {
    address: pqPublicKeyToAddressBytes(publicKey, chain, options),
    authType: 0x01,
    authDescriptor: bytesToHex(authScript.authDescriptor),
    commitment: bytesToHex(authScript.commitment),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(secretKey),
    seedKey: bytesToHex(derived.pqSeed),
    witnessScript: bytesToHex(authScript.witnessScript),
  };
}

export function getNoAuthAddress(network: PQNetwork, options: AuthScriptOptions = {}): INoAuthAddressObject {
  const chain = getPQNetwork(network);
  const parts = authScriptCommitmentParts(0x00, null, options);

  return {
    address: noAuthToAddressBytes(chain, options),
    authType: 0x00,
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getLegacyAuthScriptAddress(
  network: PQNetwork,
  legacyNetwork: Network,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
  options: AuthScriptOptions = {},
): ILegacyAuthScriptAddressObject {
  const pqChain = getPQNetwork(network);
  const legacyChain = getNetwork(legacyNetwork);
  const coinType = legacyChain.bip44;
  const hdKey = getHDKey(legacyNetwork, mnemonic, passphrase);
  const path = `m/44'/${coinType}'/${account}'/0/${index}`;
  const derived = hdKey.derive(path);

  if (!derived.privateKey) {
    throw new Error("Could not derive private key for path");
  }

  const legacyObject = privateKeyToAddressObject(derived.privateKey, legacyChain, path);
  const publicKeyBytes = ensureBytes(legacyObject.publicKey);
  const parts = authScriptCommitmentParts(0x02, publicKeyBytes, options);

  return {
    address: legacyAuthScriptToAddressBytes(publicKeyBytes, pqChain, options),
    path,
    publicKey: legacyObject.publicKey,
    privateKey: legacyObject.privateKey,
    WIF: legacyObject.WIF,
    authType: 0x02,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getLegacyAuthScriptAddressByWIF(
  network: PQNetwork,
  wif: string,
  options: AuthScriptOptions = {},
): ILegacyAuthScriptAddressObject {
  const pqChain = getPQNetwork(network);
  const publicKeyHex = publicKeyHexFromWIF(wif);
  const publicKeyBytes = ensureBytes(publicKeyHex);
  const parts = authScriptCommitmentParts(0x02, publicKeyBytes, options);

  return {
    address: legacyAuthScriptToAddressBytes(publicKeyBytes, pqChain, options),
    publicKey: publicKeyHex,
    privateKey: "",
    WIF: wif,
    authType: 0x02,
    authDescriptor: bytesToHex(parts.authDescriptor),
    commitment: bytesToHex(parts.commitment),
    witnessScript: bytesToHex(parts.witnessScript),
  };
}

export function getPQAddress(
  network: PQNetwork,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
  options: PQAddressOptions = {},
): IPQAddressObject {
  const chain = getPQNetwork(network);
  const hdKey = getPQHDKey(network, mnemonic, passphrase);
  const path = `m_pq/${chain.purpose}'/${chain.coinType}'/${account}'/${chain.changeIndex}'/${index}'`;
  return getPQAddressByPath(network, hdKey, path, options);
}

export function pqPublicKeyToAddress(network: PQNetwork, publicKey: Uint8Array | string, options: PQAddressOptions = {}): string {
  const keyBytes = ensureBytes(publicKey);
  if (keyBytes.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }
  normalizeWitnessScript(options.witnessScript);
  return pqPublicKeyToAddressBytes(keyBytes, getPQNetwork(network), options);
}

export function pqPublicKeyToCommitmentHex(publicKey: Uint8Array | string, options: PQAddressOptions = {}): string {
  const keyBytes = ensureBytes(publicKey);
  if (keyBytes.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }

  return bytesToHex(pqPublicKeyToCommitment(keyBytes, options));
}

export function pqPublicKeyToAuthDescriptorHex(publicKey: Uint8Array | string): string {
  const keyBytes = ensureBytes(publicKey);
  if (keyBytes.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }

  return bytesToHex(pqPublicKeyToAuthDescriptor(keyBytes));
}

export function generatePQAddressObject(network: PQNetwork = "xna-pq", passphrase = "", options: PQAddressOptions = {}): IPQAddressObject {
  const mnemonic = generateMnemonic();
  const addressObj = getPQAddress(network, mnemonic, 0, 0, passphrase, options);
  return {
    ...addressObj,
    mnemonic,
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
  getNoAuthAddress,
  getLegacyAuthScriptAddress,
  getLegacyAuthScriptAddressByWIF,
  pqPublicKeyToAddress,
  pqPublicKeyToAuthDescriptorHex,
  pqPublicKeyToCommitmentHex,
  generatePQAddressObject,
};

export default NeuraiKey;
