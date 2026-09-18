/**
 * Neurai address types. Each one fixes the encoding, the key and the derivation path.
 * Base58 versions, WIF and BIP32 versions are chain parameters (chain-params.ts).
 * Values are given for mainnet and testnet; regtest uses the testnet values.
 *
 * AuthScript commitment (Bech32m types), with the witness version as lead byte:
 *   tagged_hash("NeuraiAuthScript", witnessVersion || auth_descriptor || SHA256(witnessScript))
 */

type PerNetwork<T> = { mainnet: T; testnet: T };

/**
 * Legacy: Base58Check P2PKH, secp256k1 key.
 * Path: m/44'/coinType'/account'/change/index
 * Library networks: "xna-legacy" / "xna-legacy-test"
 */
const legacy = {
  encoding: "base58",
  key: "secp256k1",
  purpose: 44,
  coinType: { mainnet: 1900, testnet: 1 } as PerNetwork<number>,
} as const;

/**
 * Old legacy: Legacy with the historical coin type 0, kept by the node wallet
 * because exchanges and early wallets use it. Not recommended for new wallets.
 * Path: m/44'/0'/account'/change/index
 * Library network: "xna-old-legacy" (mainnet only: on testnet/regtest the coin
 * type is 1, the same path as legacy, so "xna-legacy-test" covers it)
 */
const oldLegacy = {
  ...legacy,
  coinType: { mainnet: 0, testnet: 1 } as PerNetwork<number>,
} as const;

/**
 * PQ: strict AuthScript, Bech32m witness v2 (pq1z... / tpq1z...).
 * ML-DSA-44 key from the native PQ HD tree (NIP-022), fixed OP_TRUE witnessScript.
 * Auth descriptor: 0x01 || HASH160(0x05 || pq_pubkey)
 * Path: m_pq/100'/coinType'/account'/change'/index' (all hardened)
 * Library networks: "xna-pq" / "xna-pq-test"
 */
const pq = {
  encoding: "bech32m",
  hrp: { mainnet: "pq", testnet: "tpq" } as PerNetwork<string>,
  witnessVersion: 2,
  authType: 0x01,
  witnessScript: "51",
  key: "ml-dsa-44",
  purpose: 100,
  coinType: { mainnet: 1900, testnet: 1 } as PerNetwork<number>,
  extendedPrivateKey: { mainnet: 0x0488ac24, testnet: 0x043581d5 } as PerNetwork<number>, // xpqp / tpqp
} as const;

/**
 * ECDSA: strict AuthScript, Bech32m witness v3 (nq1r... / tnq1r...).
 * Compressed secp256k1 key, fixed OP_TRUE witnessScript.
 * Auth descriptor: 0x02 || HASH160(compressed_pubkey)
 * Path: m/84'/coinType'/account'/change/index
 * Library networks: "xna" / "xna-test"
 */
const ecdsa = {
  encoding: "bech32m",
  hrp: { mainnet: "nq", testnet: "tnq" } as PerNetwork<string>,
  witnessVersion: 3,
  authType: 0x02,
  witnessScript: "51",
  key: "secp256k1",
  purpose: 84,
  coinType: { mainnet: 1900, testnet: 1 } as PerNetwork<number>,
} as const;

/**
 * Generic AuthScript: Bech32m witness v1 (nq1p... / tnq1p...), used for contracts.
 * Any authType and any witnessScript:
 *   0x00 NoAuth: no key
 *   0x01 PQ:     ML-DSA-44 key from the pq tree
 *   0x02 Legacy: secp256k1 key from the legacy (BIP44) tree
 * Library networks: "xna-authscript" / "xna-authscript-test"
 */
const authscript = {
  encoding: "bech32m",
  hrp: { mainnet: "nq", testnet: "tnq" } as PerNetwork<string>,
  witnessVersion: 1,
  authTypes: [0x00, 0x01, 0x02],
  defaultWitnessScript: "51",
} as const;

export const addressTypes = { legacy, oldLegacy, pq, ecdsa, authscript };
