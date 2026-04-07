//Gives us meta data about coins/chains
import { chains } from "./coins/xna.js";
import { chains as legacyChains } from "./coins/xna-legacy.js";
import { pqChains } from "./coins/xna-pq.js";

//bip39 from mnemonic to seed
import * as bip39 from "bip39";

import { createHash } from "crypto";
const CoinKey = require("coinkey");

//From seed to key
const HDKey = require("hdkey");
import { IAddressObject, IPQAddressObject, PQNetwork } from "./types";
const bs58check = require("bs58check");

//PostQuantum ML-DSA-44
const { ml_dsa44 } = require("@noble/post-quantum/ml-dsa.js");
const { bech32m } = require("bech32");

//Could not declare Network as enum, something wrong with parcel bundler
export type Network = "xna" | "xna-test" | "xna-legacy" | "xna-legacy-test";

function getNetwork(name: Network) {
  const c = name.toLowerCase() as Network; //Just to be sure
  const chainData = chains as any;
  const legacyChainData = legacyChains as any;
  const map: Record<Network, any> = {
    xna: chainData.xna.mainnet.versions,
    "xna-test": chainData.xna.testnet?.versions,
    "xna-legacy": legacyChainData["xna-legacy"].mainnet.versions,
    "xna-legacy-test": legacyChainData["xna-legacy"].testnet?.versions,
  };

  const network = map[c];
  if (!network) {
    throw new Error("network must be of value " + Object.keys(map).toString());
  }
  return network;
}
/**
 *
 * @param network
 * @returns the coin type for the network (blockchain), for example Neurai has coin type 175
 */
export function getCoinType(network: Network) {
  const chain = getNetwork(network);
  return chain.bip44;
}
/**
 * @param network - should have value "xna", "xna-test", "evr" or "evr-test"
 * @param mnemonic - your mnemonic
 * @param account - accounts in BIP44 starts from 0, 0 is the default account
 * @param position - starts from 0
 * @param passphrase - optional BIP39 passphrase (25th word) for additional security
 */
export function getAddressPair(
  network: Network,
  mnemonic: string,
  account: number,
  position: number,
  passphrase: string = ""
) {
  const hdKey = getHDKey(network, mnemonic, passphrase);
  const coin_type = getCoinType(network);

  //https://github.com/satoshilabs/slips/blob/master/slip-0044.md

  //Syntax of BIP44
  //m / purpose' / coin_type' / account' / change / address_index
  const externalPath = `m/44'/${coin_type}'/${account}'/0/${position}`;
  const externalAddress = getAddressByPath(network, hdKey, externalPath);

  //change address
  const internalPath = `m/44'/${coin_type}'/${account}'/1/${position}`;
  const internalAddress = getAddressByPath(network, hdKey, internalPath);
  return {
    internal: internalAddress,
    external: externalAddress,
    position,
  };
}

export function getHDKey(network: Network, mnemonic: string, passphrase: string = ""): any {
  const chain = getNetwork(network);
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase).toString("hex");
  //From the seed, get a hdKey, can we use CoinKey instead?
  const hdKey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"), chain.bip32);
  return hdKey;
}

export function getAddressByPath(
  network: Network,
  hdKey: any,
  path: string
): IAddressObject {
  const chain = getNetwork(network);
  const derived = hdKey.derive(path);
  var ck2 = new CoinKey(derived.privateKey, chain);

  return {
    address: ck2.publicAddress,
    path: path,
    publicKey: ck2.publicKey.toString("hex"),
    privateKey: ck2.privateKey.toString("hex"),
    WIF: ck2.privateWif,
  };
}

export function generateMnemonic() {
  return bip39.generateMnemonic();
}

export function isMnemonicValid(mnemonic: string) {
  //Check all languages
  const wordlists = Object.values(bip39.wordlists);

  //If mnemonic is valid in any language, return true, otherwise false
  for (const wordlist of wordlists) {
    const v = bip39.validateMnemonic(mnemonic, wordlist);
    if (v === true) {
      return true;
    }
  }
  return false;
}
/**
 *
 * @param privateKeyWIF
 * @param network  should be "xna" or "xna-test"
 * @returns object {address, privateKey (hex), WIF}
 */

export function getAddressByWIF(network: Network, privateKeyWIF: string) {
  const coinKey = CoinKey.fromWif(privateKeyWIF);
  coinKey.versions = getNetwork(network);

  return {
    address: coinKey.publicAddress,
    privateKey: coinKey.privateKey.toString("hex"),
    WIF: coinKey.privateWif,
  };
}

/**
 * @param privateKeyWIF
 * @param network should be "xna" or "xna-test"
 * @returns the compressed public key as a hex string
 */
export function getPubkeyByWIF(network: Network, privateKeyWIF: string): string {
  const coinKey = CoinKey.fromWif(privateKeyWIF);
  coinKey.versions = getNetwork(network);

  return coinKey.publicKey.toString("hex");
}

export const entropyToMnemonic = bip39.entropyToMnemonic;

export function generateAddressObject(
  network: Network = "xna",
  passphrase: string = ""
): IAddressObject {
  const mnemonic = generateMnemonic();
  const account = 0;
  const position = 0;
  const addressPair = getAddressPair(network, mnemonic, account, position, passphrase);
  const addressObject = addressPair.external;

  const result = {
    ...addressObject,
    mnemonic,
    network,
  };
  return result;
}

export function publicKeyToAddress(
  network: Network,
  publicKey: Buffer | string
): string {
  const chain = getNetwork(network);
  const keyBuffer = Buffer.isBuffer(publicKey)
    ? publicKey
    : Buffer.from(publicKey, "hex");

  if (keyBuffer.length !== 33 && keyBuffer.length !== 65) {
    throw new Error("Public key must be 33 or 65 bytes");
  }

  const sha256Hash = createHash("sha256").update(keyBuffer).digest();
  const ripemd160Hash = createHash("ripemd160").update(sha256Hash).digest();
  const payload = Buffer.concat([
    Buffer.from([chain.public]),
    ripemd160Hash,
  ]);

  return bs58check.encode(payload);
}

/**
 * Generates a random Address Object
 *
 * @deprecated use generateAddressObject
 * @param network
 * @returns
 */
export function generateAddress(network: Network = "xna") {
  return generateAddressObject(network);
}
// ==================== PostQuantum ML-DSA-44 ====================

function getPQNetwork(name: PQNetwork) {
  const pqChainData = pqChains as any;
  const network = pqChainData[name];
  if (!network) {
    throw new Error("PQ network must be 'xna-pq' or 'xna-pq-test'");
  }
  return network;
}

function hash160(data: Buffer | Uint8Array): Buffer {
  const sha256Hash = createHash("sha256").update(data).digest();
  return createHash("ripemd160").update(sha256Hash).digest();
}

function bech32mEncode(hrp: string, witnessVersion: number, hash: Buffer): string {
  const words = bech32m.toWords(hash);
  return bech32m.encode(hrp, [witnessVersion, ...words]);
}

export function getPQHDKey(network: PQNetwork, mnemonic: string, passphrase: string = ""): any {
  const chain = getPQNetwork(network);
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase).toString("hex");
  const hdKey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"), chain.bip32);
  return hdKey;
}

export function getPQAddressByPath(
  network: PQNetwork,
  hdKey: any,
  path: string
): IPQAddressObject {
  const chain = getPQNetwork(network);
  const derived = hdKey.derive(path);
  const seed32 = Buffer.from(derived.privateKey);

  const { publicKey, secretKey } = ml_dsa44.keygen(seed32);

  // Serialize pubkey with 0x05 prefix
  const serialized = Buffer.concat([Buffer.from([0x05]), Buffer.from(publicKey)]);
  const addrHash = hash160(serialized);
  const address = bech32mEncode(chain.hrp, chain.witnessVersion, addrHash);

  return {
    address,
    path,
    publicKey: Buffer.from(publicKey).toString("hex"),
    privateKey: Buffer.from(secretKey).toString("hex"),
    seedKey: seed32.toString("hex"),
  };
}

/**
 * Generate a PostQuantum ML-DSA-44 address
 * @param network - "xna-pq" for mainnet, "xna-pq-test" for testnet
 * @param mnemonic - BIP39 mnemonic
 * @param account - account index (default 0)
 * @param index - address index
 * @param passphrase - optional BIP39 passphrase
 */
export function getPQAddress(
  network: PQNetwork,
  mnemonic: string,
  account: number,
  index: number,
  passphrase: string = ""
): IPQAddressObject {
  const chain = getPQNetwork(network);
  const hdKey = getPQHDKey(network, mnemonic, passphrase);
  const path = `m/${chain.purpose}'/${chain.coinType}'/${account}'/${chain.changeIndex}/${index}`;
  return getPQAddressByPath(network, hdKey, path);
}

/**
 * Reconstruct a PostQuantum address from an ML-DSA-44 public key
 * @param network - "xna-pq" or "xna-pq-test"
 * @param publicKey - ML-DSA-44 public key (1312 bytes as Buffer, Uint8Array, or hex string)
 */
export function pqPublicKeyToAddress(
  network: PQNetwork,
  publicKey: Buffer | Uint8Array | string
): string {
  const chain = getPQNetwork(network);
  const keyBuffer = Buffer.isBuffer(publicKey)
    ? publicKey
    : typeof publicKey === "string"
      ? Buffer.from(publicKey, "hex")
      : Buffer.from(publicKey);

  if (keyBuffer.length !== 1312) {
    throw new Error("ML-DSA-44 public key must be 1312 bytes");
  }

  const serialized = Buffer.concat([Buffer.from([0x05]), keyBuffer]);
  const addrHash = hash160(serialized);
  return bech32mEncode(chain.hrp, chain.witnessVersion, addrHash);
}

export function generatePQAddressObject(
  network: PQNetwork = "xna-pq",
  passphrase: string = ""
): IPQAddressObject {
  const mnemonic = generateMnemonic();
  const addressObj = getPQAddress(network, mnemonic, 0, 0, passphrase);
  return {
    ...addressObj,
    mnemonic,
  };
}

export default {
  entropyToMnemonic,
  generateAddress,
  generateMnemonic,
  getAddressByPath,
  getAddressByWIF,
  getPubkeyByWIF,
  getAddressPair,
  getCoinType,
  getHDKey,
  isMnemonicValid,
  publicKeyToAddress,
  // PostQuantum ML-DSA-44
  getPQAddress,
  getPQAddressByPath,
  getPQHDKey,
  pqPublicKeyToAddress,
  generatePQAddressObject,
};
