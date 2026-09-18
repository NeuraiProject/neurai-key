import type {
  AuthScriptNetwork,
  ECDSANetwork,
  IAddressObject,
  IECDSAAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  IPQAuthScriptAddressObject,
  PQNetwork,
} from "../../types.js";
import { addressTypes } from "../../coins/address-types.js";
import { chainParams } from "../../coins/chain-params.js";

export type Network = "xna" | "xna-test" | "xna-legacy" | "xna-legacy-test";

export interface Bip32Versions {
  private: number;
  public: number;
}

export interface AddressVersions {
  bip32: Bip32Versions;
  bip44: number;
  private: number;
  public: number;
  scripthash: number;
}

export interface CurrentNetworkConfig {
  versions: AddressVersions;
}

// PQ address (strict AuthScript witness v2): ML-DSA-44 key from the native PQ tree.
export interface PQNetworkConfig {
  hrp: string;
  witnessVersion: number;
  purpose: number;
  coinType: number;
  changeIndex: number;
  pqExtPrivVersion: number;
}

// ECDSA address (strict AuthScript witness v3): compressed secp256k1 key from its own BIP32 branch.
export interface ECDSANetworkConfig {
  hrp: string;
  witnessVersion: number;
  purpose: number;
  coinType: number;
  changeIndex: number;
  bip32: Bip32Versions;
  private: number;
}

// Generic AuthScript (witness v1): any authType and witnessScript, for contracts.
export interface AuthScriptNetworkConfig {
  hrp: string;
  witnessVersion: number;
  pqNetwork: PQNetwork; // authType 0x01 keys derive from this PQ tree
}

// Library network ids -> address type (coins/address-types.ts) + chain (coins/chain-params.ts).
// Regtest uses the testnet ids: it shares every prefix with testnet.

type Chain = "mainnet" | "testnet";

const EXTERNAL_BRANCH = 0;

function base58Versions(type: typeof addressTypes.legacy | typeof addressTypes.legacyCoin0, chain: Chain): CurrentNetworkConfig {
  const params = chainParams[chain];
  return {
    versions: {
      bip32: params.bip32,
      bip44: type.coinType[chain],
      private: params.base58.wif,
      public: params.base58.pubKeyHash,
      scripthash: params.base58.scriptHash,
    },
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

function ecdsaConfig(chain: Chain): ECDSANetworkConfig {
  const { ecdsa } = addressTypes;
  return {
    hrp: ecdsa.hrp[chain],
    witnessVersion: ecdsa.witnessVersion,
    purpose: ecdsa.purpose,
    coinType: ecdsa.coinType[chain],
    changeIndex: EXTERNAL_BRANCH,
    bip32: chainParams[chain].bip32,
    private: chainParams[chain].base58.wif,
  };
}

function authScriptConfig(chain: Chain, pqNetwork: PQNetwork): AuthScriptNetworkConfig {
  const { authscript } = addressTypes;
  return {
    hrp: authscript.hrp[chain],
    witnessVersion: authscript.witnessVersion,
    pqNetwork,
  };
}

const currentNetworks: Record<Network, CurrentNetworkConfig> = {
  xna: base58Versions(addressTypes.legacy, "mainnet"),
  "xna-test": base58Versions(addressTypes.legacy, "testnet"),
  "xna-legacy": base58Versions(addressTypes.legacyCoin0, "mainnet"),
  "xna-legacy-test": base58Versions(addressTypes.legacyCoin0, "testnet"),
};

const pqNetworks: Record<PQNetwork, PQNetworkConfig> = {
  "xna-pq": pqConfig("mainnet"),
  "xna-pq-test": pqConfig("testnet"),
};

const ecdsaNetworks: Record<ECDSANetwork, ECDSANetworkConfig> = {
  "xna-ecdsa": ecdsaConfig("mainnet"),
  "xna-ecdsa-test": ecdsaConfig("testnet"),
};

const authScriptNetworks: Record<AuthScriptNetwork, AuthScriptNetworkConfig> = {
  "xna-authscript": authScriptConfig("mainnet", "xna-pq"),
  "xna-authscript-test": authScriptConfig("testnet", "xna-pq-test"),
};

export function getNetwork(name: Network): AddressVersions {
  const network = currentNetworks[name];
  if (!network) {
    throw new Error(`network must be of value ${Object.keys(currentNetworks).toString()}`);
  }
  return network.versions;
}

export function getPQNetwork(name: PQNetwork): PQNetworkConfig {
  const network = pqNetworks[name];
  if (!network) {
    throw new Error("PQ network must be 'xna-pq' or 'xna-pq-test'");
  }
  return network;
}

export function getECDSANetwork(name: ECDSANetwork): ECDSANetworkConfig {
  const network = ecdsaNetworks[name];
  if (!network) {
    throw new Error("ECDSA network must be 'xna-ecdsa' or 'xna-ecdsa-test'");
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
  ECDSANetwork,
  IAddressObject,
  IECDSAAddressObject,
  ILegacyAuthScriptAddressObject,
  INoAuthAddressObject,
  IPQAddressObject,
  IPQAuthScriptAddressObject,
  PQNetwork,
};
