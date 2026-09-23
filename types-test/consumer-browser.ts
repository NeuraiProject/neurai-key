// Browser entry: `@neuraiproject/neurai-key/browser`.
import NeuraiKey, { getPQAddress, type IPQAddressObject } from "@neuraiproject/neurai-key/browser";

export const address: IPQAddressObject = getPQAddress("xna-pq-test", NeuraiKey.generateMnemonic(), 0, 0);
