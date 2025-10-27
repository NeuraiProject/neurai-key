const NeuraiKey = require("./dist/main");

console.log("=== Neurai Key - Passphrase Example ===\n");

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
const network = "xna";
const account = 0;
const position = 0;

console.log("Mnemonic:", mnemonic);
console.log("\n--- WITHOUT Passphrase ---");
const addressNoPass = NeuraiKey.getAddressPair(network, mnemonic, account, position);
console.log("External Address:", addressNoPass.external.address);
console.log("Internal Address:", addressNoPass.internal.address);
console.log("WIF:", addressNoPass.external.WIF);

console.log("\n--- WITH Passphrase: 'my secret passphrase' ---");
const passphrase1 = "my secret passphrase";
const addressWithPass1 = NeuraiKey.getAddressPair(network, mnemonic, account, position, passphrase1);
console.log("External Address:", addressWithPass1.external.address);
console.log("Internal Address:", addressWithPass1.internal.address);
console.log("WIF:", addressWithPass1.external.WIF);

console.log("\n--- WITH Different Passphrase: 'another passphrase' ---");
const passphrase2 = "another passphrase";
const addressWithPass2 = NeuraiKey.getAddressPair(network, mnemonic, account, position, passphrase2);
console.log("External Address:", addressWithPass2.external.address);
console.log("Internal Address:", addressWithPass2.internal.address);
console.log("WIF:", addressWithPass2.external.WIF);

console.log("\n=== Summary ===");
console.log("✅ Same mnemonic + different passphrases = DIFFERENT wallets");
console.log("✅ This provides an extra security layer");
console.log("⚠️  IMPORTANT: You need BOTH mnemonic AND passphrase to recover the wallet!");
