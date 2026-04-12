export interface IAddressObject {
  address: string;
  mnemonic?: string;
  network?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  WIF: string;
}

export type AuthType = 0x00 | 0x01 | 0x02;

export interface AuthScriptOptions {
  authType?: AuthType;
  witnessScript?: Uint8Array | string;
}

export type PQAddressOptions = AuthScriptOptions;

export interface IPQAddressObject {
  address: string;
  mnemonic?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  seedKey: string;
  authType: 0x01;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

export interface INoAuthAddressObject {
  address: string;
  authType: 0x00;
  commitment: string;
  witnessScript: string;
}

export interface ILegacyAuthScriptAddressObject {
  address: string;
  path?: string;
  publicKey: string;
  privateKey: string;
  WIF: string;
  authType: 0x02;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

export type PQNetwork = "xna-pq" | "xna-pq-test";
