import NeuraiKey from "./shared/api.js";

declare global {
  interface Window {
    NeuraiKey?: typeof NeuraiKey;
  }
}

globalThis.NeuraiKey = NeuraiKey;

export default NeuraiKey;
