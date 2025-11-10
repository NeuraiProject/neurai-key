//Gives us meta data about coins/chains
import { chains } from "@hyperbitjs/chains";

//bip39 from mnemonic to seed
import * as bip39 from "bip39";

import { createHash } from "crypto";
const CoinKey = require("coinkey");

//From seed to key
const HDKey = require("hdkey");
import { IAddressObject } from "./types";
const bs58check = require("bs58check");

//Could not declare Network as enum, something wrong with parcel bundler
export type Network = "xna" | "xna-test";

function getNetwork(name: Network) {
  const c = name.toLowerCase() as Network; //Just to be sure
  const chainData = chains as any;
  const map: Record<Network, any> = {
    xna: chainData.xna.mainnet.versions,
    "xna-test": chainData.xna.testnet?.versions,
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
export default {
  entropyToMnemonic,
  generateAddress,
  generateMnemonic,
  getAddressByPath,
  getAddressByWIF,
  getAddressPair,
  getCoinType,
  getHDKey,
  isMnemonicValid,
  publicKeyToAddress,
};
