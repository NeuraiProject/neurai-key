export interface IAddressObject {
  address: string;
  mnemonic?: string;
  network?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  WIF: string;
}

export interface PQAddressOptions {
  witnessScript?: Uint8Array | string;
}

export interface IPQAddressObject {
  address: string;
  mnemonic?: string;
  path: string;
  publicKey: string;
  privateKey: string;
  seedKey: string;
  authType: number;
  authDescriptor: string;
  commitment: string;
  witnessScript: string;
}

export type PQNetwork = "xna-pq" | "xna-pq-test";
