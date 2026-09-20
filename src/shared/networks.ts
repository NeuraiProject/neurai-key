import type {
  AuthScriptNetwork,
  IAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  IPQAuthScriptAddressObject,
  Network,
  PQNetwork,
} from "../../types.js";
import { addressTypes } from "../../coins/address-types.js";
import { chainParams } from "../../coins/chain-params.js";

export interface Bip32Versions {
  private: number;
  public: number;
}

export interface AddressVersions {
  bip32: Bip32Versions;
  bip44: number; // coin type
  private: number;
  public: number;
  scripthash: number;
}

export interface Bech32Params {
  hrp: string;
  witnessVersion: number;
}

// secp256k1 network: Legacy Base58 (no bech32) or ECDSA Bech32m witness v3.
export interface Secp256k1NetworkConfig {
  versions: AddressVersions;
  purpose: number;
  bech32?: Bech32Params;
}

// PQ address (strict AuthScript witness v2): ML-DSA-44 key from the native PQ tree.
export interface PQNetworkConfig extends Bech32Params {
  purpose: number;
  coinType: number;
  changeIndex: number;
  pqExtPrivVersion: number;
}

// Generic AuthScript (witness v1): any authType and witnessScript, for contracts.
export interface AuthScriptNetworkConfig extends Bech32Params {
  pqNetwork: PQNetwork; // authType 0x01 keys derive from this PQ tree
  wifVersion: number; // authType 0x02 keys must come from a WIF of this chain
}

// Library network ids -> address type (coins/address-types.ts) + chain (coins/chain-params.ts).
// Regtest uses the testnet ids: it shares every prefix with testnet.

type Chain = "mainnet" | "testnet";

const EXTERNAL_BRANCH = 0;

function secp256k1Config(
  type: typeof addressTypes.legacy | typeof addressTypes.oldLegacy | typeof addressTypes.ecdsa,
  chain: Chain,
): Secp256k1NetworkConfig {
  const params = chainParams[chain];
  return {
    versions: {
      bip32: params.bip32,
      bip44: type.coinType[chain],
      private: params.base58.wif,
      public: params.base58.pubKeyHash,
      scripthash: params.base58.scriptHash,
    },
    purpose: type.purpose,
    bech32: type.encoding === "bech32m" ? { hrp: type.hrp[chain], witnessVersion: type.witnessVersion } : undefined,
  };
}

function pqConfig(chain: Chain): PQNetworkConfig {
  const { pq } = addressTypes;
  return {
    hrp: pq.hrp[chain],
    witnessVersion: pq.witnessVersion,
    purpose: pq.purpose,
    coinType: pq.coinType[chain],
    changeIndex: EXTERNAL_BRANCH,
    pqExtPrivVersion: pq.extendedPrivateKey[chain],
  };
}

function authScriptConfig(chain: Chain, pqNetwork: PQNetwork): AuthScriptNetworkConfig {
  const { authscript } = addressTypes;
  return {
    hrp: authscript.hrp[chain],
    witnessVersion: authscript.witnessVersion,
    pqNetwork,
    wifVersion: chainParams[chain].base58.wif,
  };
}

const secp256k1Networks: Record<Network, Secp256k1NetworkConfig> = {
  xna: secp256k1Config(addressTypes.ecdsa, "mainnet"),
  "xna-test": secp256k1Config(addressTypes.ecdsa, "testnet"),
  "xna-legacy": secp256k1Config(addressTypes.legacy, "mainnet"),
  "xna-legacy-test": secp256k1Config(addressTypes.legacy, "testnet"),
  "xna-old-legacy": secp256k1Config(addressTypes.oldLegacy, "mainnet"),
};

const pqNetworks: Record<PQNetwork, PQNetworkConfig> = {
  "xna-pq": pqConfig("mainnet"),
  "xna-pq-test": pqConfig("testnet"),
};

const authScriptNetworks: Record<AuthScriptNetwork, AuthScriptNetworkConfig> = {
  "xna-authscript": authScriptConfig("mainnet", "xna-pq"),
  "xna-authscript-test": authScriptConfig("testnet", "xna-pq-test"),
};

export function getNetwork(name: Network): Secp256k1NetworkConfig {
  const network = secp256k1Networks[name];
  if (!network) {
    throw new Error(`network must be of value ${Object.keys(secp256k1Networks).toString()}`);
  }
  return network;
}

export function getPQNetwork(name: PQNetwork): PQNetworkConfig {
  const network = pqNetworks[name];
  if (!network) {
    throw new Error("PQ network must be 'xna-pq' or 'xna-pq-test'");
  }
  return network;
}

export function getAuthScriptNetwork(name: AuthScriptNetwork): AuthScriptNetworkConfig {
  const network = authScriptNetworks[name];
  if (!network) {
    throw new Error("AuthScript network must be 'xna-authscript' or 'xna-authscript-test'");
  }
  return network;
}

export type {
  AuthScriptNetwork,
  IAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  IPQAuthScriptAddressObject,
  Network,
  PQNetwork,
};
