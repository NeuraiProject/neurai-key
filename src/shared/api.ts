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
import { ml_dsa44 } from "@noble/post-quantum/ml-dsa.js";
import { bytesToHex, ensureBytes, mnemonicToSeedBytes } from "./bytes.js";
import { addressObjectFromWIF, normalizePublicKey, pqPublicKeyToAddressBytes, privateKeyToAddressObject, publicKeyHexFromWIF, publicKeyToAddressBytes } from "./address.js";
import { HDKey } from "./hdkey.js";
import { getNetwork, getPQNetwork, type IAddressObject, type IPQAddressObject, type Network, type PQNetwork } from "./networks.js";

export type { IAddressObject, IPQAddressObject, Network, PQNetwork };

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

export function getPQHDKey(network: PQNetwork, mnemonic: string, passphrase = ""): HDKey {
  const chain = getPQNetwork(network);
  const seed = mnemonicToSeedBytes(mnemonicToSeedSync, mnemonic, passphrase);
  return HDKey.fromMasterSeed(seed, chain.bip32);
}

export function getPQAddressByPath(network: PQNetwork, hdKey: HDKey, path: string): IPQAddressObject {
  const chain = getPQNetwork(network);
  const derived = hdKey.derive(path);
  if (!derived.privateKey) {
    throw new Error("Could not derive private key for path");
  }

  const seed32 = Uint8Array.from(derived.privateKey);
  const { publicKey, secretKey } = ml_dsa44.keygen(seed32);

  return {
    address: pqPublicKeyToAddressBytes(publicKey, chain),
    path,
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(secretKey),
    seedKey: bytesToHex(seed32),
  };
}

export function getPQAddress(
  network: PQNetwork,
  mnemonic: string,
  account: number,
  index: number,
  passphrase = "",
): IPQAddressObject {
  const chain = getPQNetwork(network);
  const hdKey = getPQHDKey(network, mnemonic, passphrase);
  const path = `m/${chain.purpose}'/${chain.coinType}'/${account}'/${chain.changeIndex}/${index}`;
  return getPQAddressByPath(network, hdKey, path);
}

export function pqPublicKeyToAddress(network: PQNetwork, publicKey: Uint8Array | string): string {
  const keyBytes = ensureBytes(publicKey);
  if (keyBytes.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }
  return pqPublicKeyToAddressBytes(keyBytes, getPQNetwork(network));
}

export function generatePQAddressObject(network: PQNetwork = "xna-pq", passphrase = ""): IPQAddressObject {
  const mnemonic = generateMnemonic();
  const addressObj = getPQAddress(network, mnemonic, 0, 0, passphrase);
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
  pqPublicKeyToAddress,
  generatePQAddressObject,
};

export default NeuraiKey;
