const NeuraiKey = require("./dist/index.cjs");

console.log("=== Neurai Key - PostQuantum (ML-DSA-44) Example ===\n");

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
const network = "xna-pq-test"; // use "xna-pq" for mainnet
console.log("Mnemonic:", mnemonic);
console.log("Network: ", network);

// 1) Generate the first PQ address (external branch) from the mnemonic.
const account = 0;
const index = 0;
const first = NeuraiKey.getPQAddress(network, mnemonic, account, index);

console.log("\n--- Generated PQ address ---");
console.log("address       :", first.address);
console.log("path          :", first.path);
console.log("authType      :", first.authType, "(0x01 = PQ)");
console.log("authDescriptor:", first.authDescriptor);
console.log("commitment    :", first.commitment);
console.log("witnessScript :", first.witnessScript, "(OP_TRUE)");
console.log("pq publicKey  :", first.publicKey.slice(0, 32) + "...", "(" + first.publicKey.length / 2 + " bytes)");
console.log("pq seedKey    :", first.seedKey);

// 2) Serialize the master as xpqpriv / tpqpriv (shareable subtree backup).
const hdKey = NeuraiKey.getPQHDKey(network, mnemonic);
const extKey = NeuraiKey.pqExtendedPrivateKey(network, hdKey);
console.log("\n--- Master extended key (" + (network === "xna-pq" ? "xpqpriv" : "tpqpriv") + ") ---");
console.log(extKey);
console.log("length:", extKey.length, "chars, prefix:", extKey.slice(0, 4));

// 3) Recover the HD key from the serialized form and derive further branches.
const restored = NeuraiKey.pqHDKeyFromExtended(network, extKey);
const again = NeuraiKey.getPQAddressByPath(
  network,
  restored,
  "m_pq/100'/1'/0'/0'/0'" // same path the default helper uses on testnet
);
console.log("\n--- Recovered the same address from the extended key ---");
console.log("address      :", again.address);
console.log("matches first:", again.address === first.address ? "YES" : "NO");

// 4) Derive a set of addresses reusing the HD key (fast path).
console.log("\n--- Derived batch reusing hdKey ---");
for (let i = 0; i < 3; i++) {
  const path = "m_pq/100'/1'/0'/0'/" + i + "'";
  const a = NeuraiKey.getPQAddressByPath(network, hdKey, path);
  console.log(path, "->", a.address);
}

// 5) Hardened-only enforcement: a non-hardened segment is rejected.
try {
  NeuraiKey.getPQAddressByPath(network, hdKey, "m_pq/100'/1'/0'/0/0");
  console.log("\n[unexpected] non-hardened path was accepted");
} catch (err) {
  console.log("\n--- Non-hardened path correctly rejected ---");
  console.log("error:", err.message);
}
