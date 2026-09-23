// CommonJS consumer: resolves the `require` condition (dist/index.d.cts).
// Every value export is used, so a missing declaration fails to compile.
import key = require("@neuraiproject/neurai-key");

export const values = [
  key.BIP32_PQ_EXTKEY_SIZE, key.HDKey, key.PQHDKey, key.default, key.entropyToMnemonic,
  key.generateAddress, key.generateAddressObject, key.generateMnemonic, key.generatePQAddressObject,
  key.getAddressByPath, key.getAddressByWIF, key.getAddressPair, key.getCoinType, key.getHDKey,
  key.getLegacyAuthScriptAddress, key.getLegacyAuthScriptAddressByWIF, key.getNoAuthAddress,
  key.getPQAddress, key.getPQAddressByPath, key.getPQAuthScriptAddress, key.getPQAuthScriptAddressByPath,
  key.getPQHDKey, key.getPubkeyByWIF, key.isMnemonicValid, key.pqExtendedPrivateKey, key.pqHDKeyFromExtended,
  key.pqPublicKeyToAddress, key.pqPublicKeyToAuthDescriptorHex, key.pqPublicKeyToAuthScriptAddress,
  key.pqPublicKeyToAuthScriptCommitmentHex, key.pqPublicKeyToCommitmentHex, key.publicKeyToAddress,
];
const mnemonic: string = key.generateMnemonic();
export const ecdsa: key.IAddressObject = key.getAddressPair("xna-test", mnemonic, 0, 0).external;
export const pq: key.IPQAddressObject = key.default.getPQAddress("xna-pq-test", mnemonic, 0, 0);
export const hd: key.HDKey = key.getHDKey("xna-legacy", mnemonic);
export type Networks = key.Network | key.PQNetwork | key.AuthScriptNetwork;
