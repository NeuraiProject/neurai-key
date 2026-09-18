/**
 * secp256k1 networks:
 *   "xna" / "xna-test":                 ECDSA, Bech32m witness v3 (nq1r... / tnq1r...), m/84'
 *   "xna-legacy" / "xna-legacy-test":   Legacy Base58 (N... / t...), m/44'/1900' (testnet m/44'/1')
 *   "xna-old-legacy":                   Legacy Base58 with the historical coin type 0, m/44'/0' (mainnet only)
 */
export type Network = "xna" | "xna-test" | "xna-legacy" | "xna-legacy-test" | "xna-old-legacy";

/** secp256k1 address. The AuthScript fields are only present for "xna" / "xna-test" (ECDSA witness v3). */
export interface IAddressObject {
  address: string;
  mnemonic?: string;
  network?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  WIF: string;
  witnessVersion?: 0x03;
  authType?: 0x02;
  authDescriptor?: string;
  commitment?: string;
  witnessScript?: string;
}

export type AuthType = 0x00 | 0x01 | 0x02;

export interface AuthScriptOptions {
  authType?: AuthType;
  witnessScript?: Uint8Array | string;
}

export type PQAddressOptions = AuthScriptOptions;

/** PQ address: strict AuthScript witness v2, ML-DSA-44 key, fixed OP_TRUE witnessScript. */
export interface IPQAddressObject {
  address: string;
  mnemonic?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  seedKey: string;
  witnessVersion: 0x02;
  authType: 0x01;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

/** Generic AuthScript witness v1 with an ML-DSA-44 key (authType 0x01). */
export interface IPQAuthScriptAddressObject {
  address: string;
  mnemonic?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  seedKey: string;
  witnessVersion: 0x01;
  authType: 0x01;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

/** Generic AuthScript witness v1 without key (authType 0x00). */
export interface INoAuthAddressObject {
  address: string;
  witnessVersion: 0x01;
  authType: 0x00;
  commitment: string;
  witnessScript: string;
}

/** Generic AuthScript witness v1 with a secp256k1 key (authType 0x02). */
export interface ILegacyAuthScriptAddressObject {
  address: string;
  path?: string;
  publicKey: string;
  privateKey: string;
  WIF: string;
  witnessVersion: 0x01;
  authType: 0x02;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

export type PQNetwork = "xna-pq" | "xna-pq-test";
export type AuthScriptNetwork = "xna-authscript" | "xna-authscript-test";
