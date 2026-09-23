// Compiled by `npm run test:types` against the built package (dist/*.d.ts),
// the way an ESM application imports it, with skipLibCheck: false.
import NeuraiKey, {
  getAddressPair,
  getPQAddress,
  getPQAuthScriptAddress,
  HDKey,
  type IAddressObject,
  type IPQAddressObject,
  type IPQAuthScriptAddressObject,
  type Network,
  type PQNetwork,
} from "@neuraiproject/neurai-key";

const mnemonic: string = NeuraiKey.generateMnemonic();
const network: Network = "xna-legacy-test";
const pqNetwork: PQNetwork = "xna-pq-test";
const pair: { internal: IAddressObject; external: IAddressObject; position: number } = getAddressPair(network, mnemonic, 0, 0);
const pq: IPQAddressObject = getPQAddress(pqNetwork, mnemonic, 0, 0);
const v1: IPQAuthScriptAddressObject = getPQAuthScriptAddress("xna-authscript-test", mnemonic, 0, 0);
const hd: HDKey = NeuraiKey.getHDKey("xna-test", mnemonic);
export const witness: 2 = pq.witnessVersion;
void pair; void v1; void hd;
