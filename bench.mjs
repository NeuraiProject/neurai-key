import { deepStrictEqual } from "node:assert/strict";
import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import NeuraiKey from "./dist/index.js";

// Public test mnemonic, never use for funds.
const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const rounds = 3;

function legacy(count, reuse) {
  const root = reuse ? NeuraiKey.getHDKey("xna-legacy", mnemonic) : undefined;
  const addresses = [];
  for (let i = 0; i < count; i++) {
    if (reuse) {
      for (const branch of [0, 1]) {
        addresses.push(NeuraiKey.getAddressByPath("xna-legacy", root, `m/44'/1900'/0'/${branch}/${i}`).address);
      }
    } else {
      const pair = NeuraiKey.getAddressPair("xna-legacy", mnemonic, 0, i);
      addresses.push(pair.external.address, pair.internal.address);
    }
  }
  return addresses;
}

function pq(count, reuse) {
  const root = reuse ? NeuraiKey.getPQHDKey("xna-pq", mnemonic) : undefined;
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const result = reuse
      ? NeuraiKey.getPQAddressByPath("xna-pq", root, `m_pq/100'/1900'/0'/0'/${i}'`)
      : NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, i);
    addresses.push(result.address);
  }
  return addresses;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

console.log(`Node ${process.version}; ${process.platform}/${process.arch}; ${cpus()[0]?.model ?? "unknown CPU"}`);
console.log(`${rounds} rounds, median batch times; master-key creation included in each batch.`);
const rows = [];
for (const [family, run, count, addressCount] of [["Legacy", legacy, 100, 200], ["PQ", pq, 20, 20]]) {
  deepStrictEqual(run(3, false), run(3, true)); // Warm up both approaches.
  const times = [[], []];
  for (let round = 0; round < rounds; round++) {
    const outputs = [];
    for (const mode of round % 2 === 0 ? [0, 1] : [1, 0]) {
      const start = performance.now();
      outputs[mode] = run(count, Boolean(mode));
      times[mode].push(performance.now() - start);
    }
    deepStrictEqual(outputs[0], outputs[1]); // Outside the timed sections.
    deepStrictEqual(outputs[0].length, addressCount);
  }
  for (const mode of [0, 1]) {
    const total = median(times[mode]);
    rows.push({
      family,
      approach: mode ? "reuse master key" : "mnemonic per call",
      addresses: addressCount,
      "median batch ms": total.toFixed(2),
      "ms/address": (total / addressCount).toFixed(3),
    });
  }
}
console.table(rows);
console.log("All compared addresses match. Timings depend on hardware, runtime and batch size.");
