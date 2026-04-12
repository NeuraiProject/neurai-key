import { IAddressObject, ILegacyAuthScriptAddressObject, INoAuthAddressObject, IPQAddressObject, PQNetwork } from "../../types.js";

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

export interface PQNetworkConfig {
  hrp: string;
  witnessVersion: number;
  purpose: number;
  coinType: number;
  changeIndex: number;
  bip32: Bip32Versions;
}

const currentNetworks: Record<Network, CurrentNetworkConfig> = {
  xna: {
    versions: {
      bip32: { private: 76066276, public: 76067358 },
      bip44: 1900,
      private: 128,
      public: 53,
      scripthash: 117,
    },
  },
  "xna-test": {
    versions: {
      bip32: { private: 70615956, public: 70617039 },
      bip44: 1,
      private: 239,
      public: 127,
      scripthash: 196,
    },
  },
  "xna-legacy": {
    versions: {
      bip32: { private: 76066276, public: 76067358 },
      bip44: 0,
      private: 128,
      public: 53,
      scripthash: 117,
    },
  },
  "xna-legacy-test": {
    versions: {
      bip32: { private: 70615956, public: 70617039 },
      bip44: 1,
      private: 239,
      public: 127,
      scripthash: 196,
    },
  },
};

const pqNetworks: Record<PQNetwork, PQNetworkConfig> = {
  "xna-pq": {
    hrp: "nq",
    witnessVersion: 1,
    purpose: 100,
    coinType: 1900,
    changeIndex: 0,
    bip32: { private: 76066276, public: 76067358 },
  },
  "xna-pq-test": {
    hrp: "tnq",
    witnessVersion: 1,
    purpose: 100,
    coinType: 1,
    changeIndex: 0,
    bip32: { private: 70615956, public: 70617039 },
  },
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

export type { IAddressObject, ILegacyAuthScriptAddressObject, INoAuthAddressObject, IPQAddressObject, PQNetwork };
