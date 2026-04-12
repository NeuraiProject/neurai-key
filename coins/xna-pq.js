/**
 * Neurai (XNA) PostQuantum chain configuration data
 * ML-DSA-44 AuthScript addresses using Bech32m encoding with witness version 1
 */

const xnaPQ = {
  mainnet: {
    hrp: "nq",
    witnessVersion: 1,
    purpose: 100,
    coinType: 1900,
    changeIndex: 0,
    bip32: {
      private: 76066276,
      public: 76067358
    }
  },
  testnet: {
    hrp: "tnq",
    witnessVersion: 1,
    purpose: 100,
    coinType: 1,
    changeIndex: 0,
    bip32: {
      private: 70615956,
      public: 70617039
    }
  }
};

const pqChains = {
  "xna-pq": xnaPQ.mainnet,
  "xna-pq-test": xnaPQ.testnet
};

module.exports = {
  xnaPQ,
  pqChains
};
