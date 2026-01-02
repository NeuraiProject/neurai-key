/**
 * Neurai Legacy (XNA-LEGACY) chain configuration data
 * This replaces the dependency on @hyperbitjs/chains with only the data needed for Neurai Legacy
 */

const xnaLegacy = {
  mainnet: {
    name: "Neurai",
    unit: "XNA",
    symbol: "xna",
    decimalPlaces: 100000000,
    messagePrefix: "Neurai Signed Message:\n",
    confirmations: 6,
    website: "https://neurai.org/",
    projectUrl: "https://github.com/NeuraiProject",
    id: "94C49B3B-2C88-4408-B566-3D277C596778",
    network: "mainnet",
    hashGenesisBlock: "00000044d33c0c0ba019be5c0249730424a69cb4c222153322f68c6104484806",
    port: 19000,
    portRpc: 19001,
    protocol: {
      magic: 1381320014
    },
    seedsDns: [
      "seed1.neurai.org",
      "seed2.neurai.org",
      "neurai-ipv4.neuraiexplorer.com"
    ],
    versions: {
      bip32: {
        private: 76066276,
        public: 76067358
      },
      bip44: 0,
      private: 128,
      public: 53,
      scripthash: 117
    }
  },
  testnet: {
    name: "Neurai",
    unit: "XNA",
    symbol: "xna",
    decimalPlaces: 100000000,
    messagePrefix: "Neurai Signed Message:\n",
    confirmations: 6,
    website: "https://neurai.org/",
    projectUrl: "https://github.com/NeuraiProject",
    id: "1EB2ACBA-E8E0-4970-BB20-37DA4B70F6A6",
    network: "testnet",
    hashGenesisBlock: "0000006af8b8297448605b0283473ec712f9768f81cc7eae6269b875dee3b0cf",
    port: 19100,
    portRpc: 19101,
    protocol: {
      magic: 1313166674
    },
    seedsDns: [
      "testnet1.neuracrypt.org",
      "testnet2.neuracrypt.org",
      "testnet3.neuracrypt.org"
    ],
    versions: {
      bip32: {
        private: 70615956,
        public: 70617039
      },
      bip44: 1,
      private: 239,
      public: 127,
      scripthash: 196
    }
  }
};

const chains = {
  "xna-legacy": xnaLegacy
};

module.exports = {
  xnaLegacy,
  chains
};
