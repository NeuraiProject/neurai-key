/**
 * Neurai chain parameters, one entry per network.
 * Mirrors the node's src/chainparams.cpp and src/chainparamsbase.cpp (Neurai 2.0.0).
 * Address-type specific values (HRPs, derivation paths) are in address-types.ts.
 */

export interface ChainParams {
  network: "mainnet" | "testnet" | "regtest";
  name: string;
  unit: string;
  symbol: string;
  decimalPlaces: number;
  messagePrefix: string;
  confirmations: number;
  website: string;
  projectUrl: string;
  id?: string;
  hashGenesisBlock: string;
  port: number;
  portRpc: number;
  magic: number; // pchMessageStart read as little-endian uint32
  seedsDns: string[];
  base58: {
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
  };
  bip32: {
    private: number;
    public: number;
  };
}

const neurai = {
  name: "Neurai",
  unit: "XNA",
  symbol: "xna",
  decimalPlaces: 100000000,
  messagePrefix: "Neurai Signed Message:\n",
  confirmations: 6,
  website: "https://neurai.org/",
  projectUrl: "https://github.com/NeuraiProject",
};

const mainnet: ChainParams = {
  ...neurai,
  network: "mainnet",
  id: "94C49B3B-2C88-4408-B566-3D277C596778",
  hashGenesisBlock: "00000044d33c0c0ba019be5c0249730424a69cb4c222153322f68c6104484806",
  port: 19000,
  portRpc: 19001,
  magic: 1381320014, // "NEUR"
  seedsDns: [
    "dns.neurai.org",
    "neurai.satopool.com",
    "seed1.neurai.org",
    "seed2.neurai.org",
    "seed3.neurai.org",
    "neurai-ipv6.neuraiexplorer.com",
    "neurai-ipv4.neuraiexplorer.com",
    "main-seed.neurai.top",
    "node.neurai.org",
  ],
  base58: {
    pubKeyHash: 53, // N...
    scriptHash: 117,
    wif: 128,
  },
  bip32: {
    private: 0x0488ade4, // xprv
    public: 0x0488b21e, // xpub
  },
};

const testnet: ChainParams = {
  ...neurai,
  network: "testnet",
  id: "1EB2ACBA-E8E0-4970-BB20-37DA4B70F6A6",
  // Not asserted in chainparams.cpp: the node mines it deterministically at startup
  // (time 1774828800, nonce 1045805). Value taken from a Neurai 2.0.0 node.
  hashGenesisBlock: "0000009697907b2aa409d4b1f10da0fa14f5a52a2e31faf3886c0444b3c85e84",
  port: 19100,
  portRpc: 19101,
  magic: 1313166674, // "RUEN"
  seedsDns: [
    "testnet1.neurai.org",
    "testnet2.neurai.org",
    "testnet3.neurai.org",
    "seed-testnet.neurai.org",
    "testnet.neurai.top",
  ],
  base58: {
    pubKeyHash: 127, // t...
    scriptHash: 196,
    wif: 239,
  },
  bip32: {
    private: 0x04358394, // tprv
    public: 0x043587cf, // tpub
  },
};

// Regtest shares magic and every address/key prefix with testnet; only ports and genesis differ.
const regtest: ChainParams = {
  ...testnet,
  network: "regtest",
  id: undefined,
  hashGenesisBlock: "5241e503402b81548ea32dbfd7b670829b30fb83220a92ad9804ad893ecdce71",
  port: 19200,
  portRpc: 19201,
  seedsDns: [],
};

export const chainParams = { mainnet, testnet, regtest };
