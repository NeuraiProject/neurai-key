import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { describe, expect, it, test } from "vitest";

const require = createRequire(import.meta.url);
const NeuraiKey = require("./dist/index.cjs");

test("Random mnemonic should contain 12 words", () => {
  const mnemonic = NeuraiKey.generateMnemonic();
  expect(mnemonic.split(" ").length).toBe(12);
});

test("Validate address on main-net", () => {
  const network = "xna-legacy";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);
  expect(address.external.address).toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
});

test("Validate address on test-net", () => {
  const network = "xna-legacy-test";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);
  expect(address.external.address).toBe("tPXGaMRNwZuV1UKSrD9gABPscrJWUmedQ9");
});

test("Validate address with passphrase on main-net", () => {
  const network = "xna-legacy";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const passphrase = "my secret passphrase";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, passphrase);
  expect(address.external.address).not.toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
  const address2 = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, passphrase);
  expect(address.external.address).toBe(address2.external.address);
});

test("Different passphrases generate different addresses", () => {
  const network = "xna-legacy";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const passphrase1 = "passphrase1";
  const passphrase2 = "passphrase2";

  const address1 = NeuraiKey.getAddressPair(network, mnemonic, 0, 0, passphrase1);
  const address2 = NeuraiKey.getAddressPair(network, mnemonic, 0, 0, passphrase2);

  expect(address1.external.address).not.toBe(address2.external.address);
});

test("Empty passphrase equals no passphrase", () => {
  const network = "xna-legacy";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

  const addressWithEmpty = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, "");
  const addressWithoutPassphrase = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(addressWithEmpty.external.address).toBe(addressWithoutPassphrase.external.address);
  expect(addressWithEmpty.external.address).toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
});

test("Validate Wallet Import Format (WIF) main-net ", () => {
  const network = "xna-legacy";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(address.internal.address).toBe("NRYT7zihLQTGpcK4PKHnTFuQsLaTGJYzqm");
  expect(address.external.WIF).toBe("L1FXfT3WjVLERgqiQt3YzqU9F3Z8LmMhxPF4VHW5yd3Q6Q66woRQ");
});

test("Convert external public key to main-net address", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const pair = NeuraiKey.getAddressPair("xna-legacy", mnemonic, 0, 1);

  expect(NeuraiKey.publicKeyToAddress("xna-legacy", pair.external.publicKey)).toBe(
    pair.external.address
  );
});

test("Validate Wallet Import Format (WIF) test-net ", () => {
  const network = "xna-legacy-test";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(address.external.WIF).toBe("cSfwLzc9DNj4PdzyGK1sAZzxNwih2HaezMrT8w4MXyhf8qhaHJiE");
});

test("Convert external public key to test-net address", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const pair = NeuraiKey.getAddressPair("xna-legacy-test", mnemonic, 0, 1);

  expect(NeuraiKey.publicKeyToAddress("xna-legacy-test", pair.external.publicKey)).toBe(
    pair.external.address
  );
});

test("Validate get public address from Wallet Import Format (WIF) main-net ", () => {
  const network = "xna-legacy";
  const WIF = "KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq";
  const addressObject = NeuraiKey.getAddressByWIF(network, WIF);

  expect(addressObject.address).toBe("NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp");
});

test("Get compressed public key from Wallet Import Format (WIF) main-net", () => {
  const network = "xna-legacy";
  const WIF = "KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq";
  const publicKey = NeuraiKey.getPubkeyByWIF(network, WIF);

  expect(publicKey).toBe(
    "024108b96e53795cc28fb8b64532e61f17aa3c149e06815958361c5dddba1e7ec0"
  );
});

test("Valid bytes to mnemonic", () => {
  const hexString = "a10a95fb55808c5f15dc97ecbcd26cf0";
  const bytes = Uint8Array.from(Buffer.from(hexString, "hex"));
  const mnemonic = NeuraiKey.entropyToMnemonic(bytes);
  expect(mnemonic).toBe(
    "patient feed learn prison angle convince first napkin uncover track open theory"
  );
});

test("Non valid bytes to mnemonic should fail", () => {
  const hexString = "a10a94fb55808c5f15dc97ecbcd26cf0";
  const bytes = Uint8Array.from(Buffer.from(hexString, "hex"));
  const mnemonic = NeuraiKey.entropyToMnemonic(bytes);
  expect(mnemonic).not.toBe(
    "patient feed learn prison angle convince first napkin uncover track open theory"
  );
});

describe("Validate diff languages", () => {
  it("Should accept spanish mnemonic", () => {
    const m =
      "velero nuera pepino reír barro reforma negar rumbo atento separar pesa puma";
    const valid = NeuraiKey.isMnemonicValid(m);
    expect(valid).toBe(true);
  });

  it("Should accept French mnemonic", () => {
    const m =
      "vaseux mixte ozone quiétude besogne punaise membre réussir avarice samedi pantalon poney";
    const valid = NeuraiKey.isMnemonicValid(m);
    expect(valid).toBe(true);
  });
});

it("Should accept Italian mnemonic", () => {
  const m =
    "veloce perforare recinto sciroppo bici scelto parabola sguardo avanzato sonnifero remoto rustico";
  const valid = NeuraiKey.isMnemonicValid(m);
  expect(valid).toBe(true);
});

describe("generateAddress", () => {
  it("should generate an address with a mnemonic", () => {
    const result = NeuraiKey.generateAddressObject();

    expect(result).toHaveProperty("mnemonic");
    expect(result.mnemonic).toBeDefined();
    expect(result).toHaveProperty("address");
  });

  it("default network is xna-legacy (Base58) while ECDSA witness v3 is not active on mainnet", () => {
    const result = NeuraiKey.generateAddressObject();
    expect(result.network).toBe("xna-legacy");
    expect(result.address.startsWith("N")).toBe(true);
    expect(NeuraiKey.generateAddress().address.startsWith("N")).toBe(true);
  });

  it("Should handle xna-legacy-test", () => {
    const result = NeuraiKey.generateAddressObject("xna-legacy-test");
    expect(result.network).toBe("xna-legacy-test");
    expect(result.address.startsWith("t")).toBe(true);
  });

  it("Should handle xna (ECDSA witness v3)", () => {
    const result = NeuraiKey.generateAddressObject("xna");
    expect(result.network).toBe("xna");
    expect(result.address.startsWith("nq1r")).toBe(true);
    expect(result.mnemonic.split(" ").length).toBe(12);
  });
});

describe("Generic AuthScript witness v1 with PQ key (authType=0x01)", () => {
  test("Test vector: known seed produces expected mainnet AuthScript address (NIP-022)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAuthScriptAddress("xna-authscript", addr.publicKey);

    expect(addr.address).toBe(
      "nc1p5e3g0zyumlt8utualrdsfhnxad9ea9vc3ful3cndx5neh45cj0cqklves5"
    );
    expect(addr.commitment).toBe(
      "a66287889cdfd67e2f9df8db04de66eb4b9e95988a79f8e26d35279bd69893f0"
    );
    expect(addr.authDescriptor).toBe("01f969f2877426e5cccf2412fa11a49404b16b40f1");
    expect(addr.witnessScript).toBe("51");
    expect(addr.address).toBe(reconstructed);
    expect(addr.address.startsWith("nc1")).toBe(true);
    expect(addr.seedKey.length).toBe(64);
  });

  test("Deterministic PQ address generation from mnemonic", () => {
    const network = "xna-authscript";
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr1 = NeuraiKey.getPQAuthScriptAddress(network, mnemonic, 0, 0);
    const addr2 = NeuraiKey.getPQAuthScriptAddress(network, mnemonic, 0, 0);
    expect(addr1.address).toBe(addr2.address);
    expect(addr1.publicKey).toBe(addr2.publicKey);
  });

  test("Mainnet PQ AuthScript addresses start with nc1", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0);
    expect(addr.address.startsWith("nc1")).toBe(true);
  });

  test("Testnet PQ AuthScript addresses start with tnc1", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", mnemonic, 0, 0);
    expect(addr.address).toBe(
      "tnc1pdsj0aztvgwv3rwgml360stpyp228zrggyga6n4sdenmetm6wv3tqse52vk"
    );
    expect(addr.address.startsWith("tnc1")).toBe(true);
  });

  test("Mainnet path follows NIP-022 (m_pq, all hardened)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 5);
    expect(addr.path).toBe("m_pq/100'/1900'/0'/0'/5'");
  });

  test("Testnet PQ default path uses coinType 1 and hardened external branch 0'", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", mnemonic, 0, 3);
    expect(addr.path).toBe("m_pq/100'/1'/0'/0'/3'");
  });

  test("Testnet PQ internal branch uses hardened change index 1' by explicit path", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const hdKey = NeuraiKey.getPQHDKey("xna-pq-test", mnemonic);
    const addr = NeuraiKey.getPQAuthScriptAddressByPath("xna-authscript-test", hdKey, "m_pq/100'/1'/0'/1'/3'");
    expect(addr.path).toBe("m_pq/100'/1'/0'/1'/3'");
  });

  test("Non-hardened PQ path is rejected (NIP-022 requires hardened-only)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const hdKey = NeuraiKey.getPQHDKey("xna-pq-test", mnemonic);
    expect(() => NeuraiKey.getPQAuthScriptAddressByPath("xna-authscript-test", hdKey, "m_pq/100'/1'/0'/0/0")).toThrow();
  });

  test("pqPublicKeyToAddress matches generated address", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAuthScriptAddress("xna-authscript", addr.publicKey);
    expect(reconstructed).toBe(addr.address);
  });

  test("Custom witnessScript changes commitment and address deterministically", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const options = { witnessScript: "5151" };
    const addr1 = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0, "", options);
    const addr2 = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0, "", options);

    expect(addr1.address).toBe(addr2.address);
    expect(addr1.commitment).toBe(addr2.commitment);
    expect(addr1.witnessScript).toBe("5151");
    expect(addr1.address).not.toBe(
      "nc1pe2gr8awq39r3hhcwtw2p368sq8gz3qq2mwch8jy8r8uxcqwhw28qmakmf0"
    );
  });

  test("Different passphrases produce different PQ addresses", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr1 = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0, "passphrase1");
    const addr2 = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0, "passphrase2");
    expect(addr1.address).not.toBe(addr2.address);
  });

  test("PQ public key is 1312 bytes (2624 hex chars)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0);
    expect(addr.publicKey.length).toBe(2624);
  });
});

describe("PQ extended private key (xpqp/tpqp) serialization", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

  // Canonical vector (abandon x11 about, empty passphrase) with the new 74-byte
  // padded layout. Must match CNeuraiExtKeyPQ::ToString() on the Neurai node.
  test("Mainnet master xpqpriv canonical vector (node-compatible)", () => {
    const known = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const hd = NeuraiKey.getPQHDKey("xna-pq", known);
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", hd);
    expect(ext).toBe(
      "xpqp18m4AHhPx55uvwXt7MjEda4MhFQwN6HDpErrCjbD1M8XG61G3ARw3VRwQGds3SFrs47RRPt7a5VD7sBocLicvN6R6KD4Je5PEpzj7u5fFtH"
    );
    expect(ext.startsWith("xpqp")).toBe(true);
    expect(ext.length).toBe(111);
  });

  test("Testnet master tpqpriv canonical vector (node-compatible)", () => {
    const known = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const hd = NeuraiKey.getPQHDKey("xna-pq-test", known);
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq-test", hd);
    expect(ext).toBe(
      "tpqp898ggXX5fM3NCjijZYiKqVPj2NWbMUnHMsT9ZHeMMFtR1Nfy7PH2Bw6meJieZwD6exeL2yPz7BKFp3gR1CZrooYi9uxMzAjcpnb8sse8CYm"
    );
    expect(ext.startsWith("tpqp")).toBe(true);
  });

  test("Mainnet extended key roundtrip preserves pq_seed, chaincode, depth, index", () => {
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const account = hd.derive("m_pq/100'/1900'/0'/0'");
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", account);
    const recovered = NeuraiKey.pqHDKeyFromExtended("xna-pq", ext);

    expect(recovered.depth).toBe(account.depth);
    expect(recovered.index).toBe(account.index);
    expect(Buffer.from(recovered.pqSeed).toString("hex")).toBe(Buffer.from(account.pqSeed).toString("hex"));
    expect(Buffer.from(recovered.chainCode).toString("hex")).toBe(Buffer.from(account.chainCode).toString("hex"));
    expect(Buffer.from(recovered.parentFingerprint).toString("hex")).toBe(Buffer.from(account.parentFingerprint).toString("hex"));
  });

  test("Addresses derived from a recovered extended key match the original", () => {
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const account = hd.derive("m_pq/100'/1900'/0'/0'");
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", account);
    const recovered = NeuraiKey.pqHDKeyFromExtended("xna-pq", ext);

    const a = NeuraiKey.getPQAddressByPath("xna-pq", account, "m_pq/7'");
    const b = NeuraiKey.getPQAddressByPath("xna-pq", recovered, "m_pq/7'");
    expect(a.address).toBe(b.address);
    expect(a.publicKey).toBe(b.publicKey);
  });

  test("Wrong network rejects an extended key of the other net", () => {
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", hd);
    expect(() => NeuraiKey.pqHDKeyFromExtended("xna-pq-test", ext)).toThrow(/version mismatch/i);
  });

  test("Rejects extended key of wrong length", () => {
    // Truncate last base58 char → invalid checksum/length
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", hd);
    const shortened = ext.slice(0, -1);
    expect(() => NeuraiKey.pqHDKeyFromExtended("xna-pq", shortened)).toThrow();
  });

  test("Rejects extended key with corrupted checksum", () => {
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const ext = NeuraiKey.pqExtendedPrivateKey("xna-pq", hd);
    // Flip one char in the middle (keeps length, breaks checksum)
    const mid = Math.floor(ext.length / 2);
    const corrupt = ext.slice(0, mid) + (ext[mid] === "A" ? "B" : "A") + ext.slice(mid + 1);
    expect(() => NeuraiKey.pqHDKeyFromExtended("xna-pq", corrupt)).toThrow();
  });

  test("Rejects payload with non-zero padding byte", () => {
    // Craft a 74-byte payload manually with an illegal padding (offset 41 != 0x00),
    // then base58check-encode with the correct mainnet version so only the padding
    // check should fail.
    const hd = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
    const raw = hd.encode(); // 74 bytes, padding is at index 41 = 0x00
    const badRaw = Uint8Array.from(raw);
    badRaw[41] = 0xff; // violate padding invariant
    // Re-encode base58check with the correct version so only the padding check fails
    const ver = Uint8Array.from([0x04, 0x88, 0xac, 0x24]);
    const full = new Uint8Array(ver.length + badRaw.length);
    full.set(ver, 0);
    full.set(badRaw, ver.length);
    // Use library internals: encodeBase58Check uses base58check. We build it via bytesToHex workaround.
    // Instead, use the base58 module directly through a tiny helper:
    const { createHash } = require("node:crypto");
    const d1 = createHash("sha256").update(full).digest();
    const d2 = createHash("sha256").update(d1).digest();
    const withChk = Buffer.concat([Buffer.from(full), d2.slice(0, 4)]);
    const ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let n = 0n;
    for (const b of withChk) n = n * 256n + BigInt(b);
    let s = "";
    while (n > 0n) { s = ALPHA[Number(n % 58n)] + s; n /= 58n; }
    for (const b of withChk) { if (b === 0) s = "1" + s; else break; }
    expect(() => NeuraiKey.pqHDKeyFromExtended("xna-pq", s)).toThrow(/padding/i);
  });
});

describe("NoAuth (authType=0x00) addresses", () => {
  // OP_TRUE is passed on purpose: with NoAuth it gives an output anyone can spend.
  const OP_TRUE = { witnessScript: "51" };

  test("NoAuth address with an explicit OP_TRUE witnessScript", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-authscript-test", OP_TRUE);

    expect(result.authType).toBe(0);
    expect(result.witnessScript).toBe("51");
    expect(result.address.startsWith("tnc1")).toBe(true);
    expect(result.commitment.length).toBe(64);
  });

  test("NoAuth address is deterministic", () => {
    const a = NeuraiKey.getNoAuthAddress("xna-authscript-test", { witnessScript: "527551" });
    const b = NeuraiKey.getNoAuthAddress("xna-authscript-test", { witnessScript: "527551" });
    expect(a.address).toBe(b.address);
    expect(a.commitment).toBe(b.commitment);
  });

  test("Different witnessScripts produce different addresses", () => {
    const opTrue = NeuraiKey.getNoAuthAddress("xna-authscript-test", OP_TRUE);
    const custom = NeuraiKey.getNoAuthAddress("xna-authscript-test", {
      witnessScript: "527551",
    });

    expect(opTrue.address).not.toBe(custom.address);
    expect(custom.witnessScript).toBe("527551");
  });

  test("NoAuth accepts the witnessScript as bytes", () => {
    const fromHex = NeuraiKey.getNoAuthAddress("xna-authscript-test", { witnessScript: "527551" });
    const fromBytes = NeuraiKey.getNoAuthAddress("xna-authscript-test", {
      witnessScript: Uint8Array.from([0x52, 0x75, 0x51]),
    });
    expect(fromBytes.address).toBe(fromHex.address);
  });

  test("NoAuth mainnet address starts with nc1", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-authscript", OP_TRUE);
    expect(result.address.startsWith("nc1")).toBe(true);
  });

  test("NoAuth commitment matches neurai-sign-transaction test vector", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-authscript-test", OP_TRUE);
    expect(result.commitment).toBe(
      "a6c181fcd8137e65528a30e4e2d457b51778238441b8f5dd8911c2084a17ee7b"
    );
  });

  test("NoAuth requires an explicit witnessScript", () => {
    const net = "xna-authscript-test";
    expect(() => NeuraiKey.getNoAuthAddress(net)).toThrow(/explicit witnessScript/);
    expect(() => NeuraiKey.getNoAuthAddress(net, {})).toThrow(/explicit witnessScript/);
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: undefined })).toThrow(/explicit witnessScript/);
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: null })).toThrow(/explicit witnessScript/);
    expect(() => NeuraiKey.getNoAuthAddress(net, null)).toThrow(/explicit witnessScript/);
  });

  test("NoAuth rejects an empty witnessScript", () => {
    const net = "xna-authscript-test";
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: "" })).toThrow(/must not be empty/);
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: new Uint8Array(0) })).toThrow(/must not be empty/);
  });

  test("NoAuth rejects malformed hex", () => {
    const net = "xna-authscript-test";
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: "515" })).toThrow();
    expect(() => NeuraiKey.getNoAuthAddress(net, { witnessScript: "5g" })).toThrow();
  });
});

describe("witnessScript: not provided vs empty", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";

  test("Not provided still defaults to OP_TRUE for keyed AuthScript (a signature is required)", () => {
    expect(NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", ABANDON, 0, 0).witnessScript).toBe("51");
    expect(NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif).witnessScript).toBe("51");
    expect(NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif, { witnessScript: undefined }).witnessScript).toBe("51");
  });

  test("An empty script is rejected instead of being replaced by OP_TRUE", () => {
    const empty = { witnessScript: "" };
    expect(() => NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", ABANDON, 0, 0, "", empty)).toThrow(/must not be empty/);
    expect(() => NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif, empty)).toThrow(/must not be empty/);
    expect(() => NeuraiKey.getLegacyAuthScriptAddress("xna-authscript-test", "xna-legacy-test", mnemonic, 0, 0, "", empty)).toThrow(/must not be empty/);
    expect(() => NeuraiKey.pqPublicKeyToAuthScriptAddress("xna-authscript-test", FIXTURE_PQ_PUBKEY, empty)).toThrow(/must not be empty/);
  });
});

describe("Legacy AuthScript (authType=0x02) addresses", () => {
  test("Legacy AuthScript from mnemonic with default witnessScript", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const result = NeuraiKey.getLegacyAuthScriptAddress(
      "xna-authscript-test", "xna-legacy-test", mnemonic, 0, 0
    );

    expect(result.authType).toBe(2);
    expect(result.witnessScript).toBe("51");
    expect(result.address.startsWith("tnc1")).toBe(true);
    expect(result.WIF).toBeDefined();
    expect(result.publicKey.length).toBe(66);
  });

  test("Legacy AuthScript is deterministic", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const a = NeuraiKey.getLegacyAuthScriptAddress("xna-authscript-test", "xna-legacy-test", mnemonic, 0, 0);
    const b = NeuraiKey.getLegacyAuthScriptAddress("xna-authscript-test", "xna-legacy-test", mnemonic, 0, 0);
    expect(a.address).toBe(b.address);
    expect(a.commitment).toBe(b.commitment);
    expect(a.WIF).toBe(b.WIF);
  });

  test("Legacy AuthScript from WIF", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const result = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif);

    expect(result.authType).toBe(2);
    expect(result.address.startsWith("tnc1")).toBe(true);
    expect(result.publicKey).toBe(
      "02666e9b6aacfa34715c1050e890fa8f07a5e73c70f23abdca585f1506514d81a0"
    );
  });

  test("Legacy AuthScript address differs from PQ address with same mnemonic", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const pq = NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", mnemonic, 0, 0);
    const legacy = NeuraiKey.getLegacyAuthScriptAddress(
      "xna-authscript-test", "xna-legacy-test", mnemonic, 0, 0
    );
    expect(pq.address).not.toBe(legacy.address);
  });

  test("Legacy AuthScript with custom witnessScript", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const defaultAddr = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif);
    const customAddr = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif, {
      witnessScript: "527551",
    });

    expect(defaultAddr.address).not.toBe(customAddr.address);
    expect(customAddr.witnessScript).toBe("527551");
  });

  test("Legacy AuthScript commitment matches neurai-sign-transaction test vector", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const result = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif);
    expect(result.commitment).toBe(
      "4f3bf4e4647e4d567df289c131a999c67734819cd0901e77569af660d3d17adf"
    );
  });
});

// Public test mnemonic. Expected values were produced by a Neurai regtest node
// (getnewaddress "" pq / "ecdsa", getrawchangeaddress ecdsa, dumpprivkey).
const ABANDON = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Synthetic keys and addresses from the node's independent fixture
// (scripts/data/authscript-vectors.json).
const FIXTURE_PQ_PUBKEY = Buffer.from(Array.from({ length: 1312 }, (_, i) => i % 256)).toString("hex");
const FIXTURE_ECDSA_PUBKEY = "02" + Buffer.from(Array.from({ length: 32 }, (_, i) => i)).toString("hex");

describe("Node fixed vectors (scripts/data/authscript-vectors.json)", () => {
  test("PQ (witness v2) address", () => {
    expect(NeuraiKey.pqPublicKeyToAddress("xna-pq", FIXTURE_PQ_PUBKEY)).toBe(
      "pq1zuu4w8s5cmp7m5jgjd06szmnv7ta2esg4znnag5sdyhydja6pgezqsh4e35"
    );
    expect(NeuraiKey.pqPublicKeyToAddress("xna-pq-test", FIXTURE_PQ_PUBKEY)).toBe(
      "tpq1zuu4w8s5cmp7m5jgjd06szmnv7ta2esg4znnag5sdyhydja6pgezq3w87qm"
    );
    expect(NeuraiKey.pqPublicKeyToCommitmentHex(FIXTURE_PQ_PUBKEY)).toBe(
      "e72ae3c298d87dba49126bf5016e6cf2faacc11514e7d4520d25c8d977414644"
    );
  });

  test("ECDSA (witness v3) fixture key is not a secp256k1 point and is rejected", () => {
    // The node fixture only checks hashing/encoding with a synthetic key. Witness v3
    // is covered with real keys by the regtest node vectors below.
    expect(() => NeuraiKey.publicKeyToAddress("xna", FIXTURE_ECDSA_PUBKEY)).toThrow(/valid secp256k1 point/);
  });

  test("Generic AuthScript (witness v1) addresses", () => {
    expect(NeuraiKey.pqPublicKeyToAuthScriptAddress("xna-authscript", FIXTURE_PQ_PUBKEY)).toBe(
      "nc1p3y7kpr5qvg8czeqgw2kzg4w9msc7yw39h4z0qdvp3etwf7qzreksj3ypsd"
    );
    expect(NeuraiKey.pqPublicKeyToAuthScriptCommitmentHex(FIXTURE_PQ_PUBKEY)).toBe(
      "893d608e80620f81640872ac2455c5dc31e23a25bd44f035818e56e4f8021e6d"
    );
    expect(NeuraiKey.getNoAuthAddress("xna-authscript-test", { witnessScript: "51" }).address).toBe(
      "tnc1p5mqcrlxczdlx2552xrjw94zhk5thsguygxu0thvfz8pqsjshaeasytj9dz"
    );
  });
});

describe("PQ addresses (strict AuthScript witness v2)", () => {
  test("Matches regtest node (getnewaddress pq)", () => {
    const addr = NeuraiKey.getPQAddress("xna-pq-test", ABANDON, 0, 1);
    expect(addr.address).toBe("tpq1z4xrgwmgmhr3ezrkk5aa0ez3xdztvm9jzrmgu4uxz6vm8l9lgv4zs3xdctv");
    expect(addr.path).toBe("m_pq/100'/1'/0'/0'/1'");
    expect(addr.witnessVersion).toBe(2);
    expect(addr.authType).toBe(1);
    expect(addr.witnessScript).toBe("51");
    // validateaddress shows the commitment as a byte-reversed uint256
    expect(Buffer.from(addr.commitment, "hex").reverse().toString("hex")).toBe(
      "4565e8977f36d3c2f0cad11e4296cd9668268afc7aa7d60e91e3b81b6d8786a9"
    );
  });

  test("Mainnet prefix pq1z and path m_pq/100'/1900'", () => {
    const addr = NeuraiKey.getPQAddress("xna-pq", ABANDON, 0, 5);
    expect(addr.address.startsWith("pq1z")).toBe(true);
    expect(addr.path).toBe("m_pq/100'/1900'/0'/0'/5'");
  });

  test("Same key as the generic AuthScript PQ address, different commitment and address", () => {
    const v1 = NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", ABANDON, 0, 0);
    const v2 = NeuraiKey.getPQAddress("xna-pq-test", ABANDON, 0, 0);
    expect(v1.address).toBe("tnc1pavsksr40nq495pmyt8unn73828a6ek8h9xf9f6ys0qa3fystrzxq2p7mc3");
    expect(v2.publicKey).toBe(v1.publicKey);
    expect(v2.authDescriptor).toBe(v1.authDescriptor);
    expect(v2.commitment).not.toBe(v1.commitment);
    expect(v2.address).not.toBe(v1.address);
  });

  test("pqPublicKeyToAddress and pqPublicKeyToCommitmentHex match the derived address", () => {
    const addr = NeuraiKey.getPQAddress("xna-pq", ABANDON, 0, 0);
    expect(NeuraiKey.pqPublicKeyToAddress("xna-pq", addr.publicKey)).toBe(addr.address);
    expect(NeuraiKey.pqPublicKeyToCommitmentHex(addr.publicKey)).toBe(addr.commitment);
  });

  test("Rejects a public key of the wrong length", () => {
    expect(() => NeuraiKey.pqPublicKeyToAddress("xna-pq-test", "05" + FIXTURE_PQ_PUBKEY)).toThrow();
  });

  test("generatePQAddressObject returns object with mnemonic", () => {
    const result = NeuraiKey.generatePQAddressObject();
    expect(result).toHaveProperty("seedKey");
    expect(result.address.startsWith("pq1z")).toBe(true);
    expect(result.mnemonic.split(" ").length).toBe(12);
  });
});

describe("ECDSA addresses: xna / xna-test (strict AuthScript witness v3)", () => {
  test("Matches regtest node (getnewaddress ecdsa + dumpprivkey)", () => {
    const addr = NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0).external;
    expect(addr.address).toBe("tnq1r0c9zl485wv7wcfutxfyv8k2ltpfk5hdyp3s7g4chlphx8d2m6npqwxvjya");
    expect(addr.WIF).toBe("cTGhosGriPpuGA586jemcuH9pE9spwUmneMBmYYzrQEbY92DJrbo");
    expect(addr.path).toBe("m/84'/1'/0'/0/0");
    expect(addr.witnessVersion).toBe(3);
    expect(addr.authType).toBe(2);
    expect(addr.witnessScript).toBe("51");
    expect(Buffer.from(addr.commitment, "hex").reverse().toString("hex")).toBe(
      "c2d45bb5636ef81757e4610ca45d6a53585fd9c348328b27ec3c73f4d42f0a7e"
    );
  });

  test("Change branch matches regtest node (getrawchangeaddress ecdsa)", () => {
    const pair = NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0);
    expect(pair.internal.address).toBe("tnq1rlv89ggyeqgugm9tx0c6w9rumlxzdmuvt9yxjda9kkz64cmwzytsq9s6w6z");
    expect(pair.internal.path).toBe("m/84'/1'/0'/1/0");
    const hdKey = NeuraiKey.getHDKey("xna-test", ABANDON);
    expect(NeuraiKey.getAddressByPath("xna-test", hdKey, "m/84'/1'/0'/1/0").address).toBe(pair.internal.address);
  });

  test("Passphrase matches regtest node (-mnemonicpassphrase)", () => {
    const addr = NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0, "TREZOR").external;
    expect(addr.address).toBe("tnq1r8tn0zajpxr7zft5mee6krmygk6e8jy3qfefy5u0gvwejf2zlkussm9euy5");
  });

  test("Mainnet prefix nq1r, path m/84'/1900' and mainnet WIF", () => {
    const addr = NeuraiKey.getAddressPair("xna", ABANDON, 0, 0).external;
    expect(addr.address.startsWith("nq1r")).toBe(true);
    expect(addr.path).toBe("m/84'/1900'/0'/0/0");
    expect(addr.WIF.startsWith("K") || addr.WIF.startsWith("L")).toBe(true);
    expect(NeuraiKey.getCoinType("xna")).toBe(1900);
  });

  test("From WIF and from public key reproduce the derived address", () => {
    const derived = NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0).external;
    const byWif = NeuraiKey.getAddressByWIF("xna-test", derived.WIF);
    expect(byWif.address).toBe(derived.address);
    expect(byWif.privateKey).toBe(derived.privateKey);
    expect(byWif.commitment).toBe(derived.commitment);
    expect(NeuraiKey.publicKeyToAddress("xna-test", derived.publicKey)).toBe(derived.address);
  });

  test("Uses its own m/84' key, not the m/44' key of Legacy", () => {
    const ecdsa = NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0).external;
    const legacy = NeuraiKey.getAddressPair("xna-legacy-test", ABANDON, 0, 0).external;
    expect(ecdsa.publicKey).not.toBe(legacy.publicKey);
    expect(legacy.path).toBe("m/44'/1'/0'/0/0");
    expect(legacy.witnessVersion).toBeUndefined();
  });

  test("Rejects uncompressed public keys", () => {
    expect(() => NeuraiKey.publicKeyToAddress("xna-test", "04" + "11".repeat(64))).toThrow();
    expect(() => NeuraiKey.publicKeyToAddress("xna-test", "05" + "11".repeat(32))).toThrow();
  });

  test("Rejects uncompressed WIF", () => {
    // Private key of cTGhosGriPpuGA586jemcuH9pE9spwUmneMBmYYzrQEbY92DJrbo without the compression flag
    const uncompressedWif = "92sgc63gozHHpqjAmM5w4bxKJx6BcL974zrS6ZXMozNfBn4cx6m";
    expect(NeuraiKey.getAddressByWIF("xna-legacy-test", uncompressedWif).address).toBeDefined();
    expect(() => NeuraiKey.getAddressByWIF("xna-test", uncompressedWif)).toThrow(/compressed/);
  });
});

describe("Legacy networks: xna-legacy and xna-old-legacy", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

  test("xna-legacy gives the same Base58 address as 4.x \"xna\" (m/44'/1900')", () => {
    const pair = NeuraiKey.getAddressPair("xna-legacy", mnemonic, 0, 1);
    expect(pair.external.address).toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
    expect(pair.external.path).toBe("m/44'/1900'/0'/0/1");
  });

  test("xna-old-legacy uses the historical coin type 0 (m/44'/0')", () => {
    const pair = NeuraiKey.getAddressPair("xna-old-legacy", mnemonic, 0, 1);
    expect(pair.external.path).toBe("m/44'/0'/0'/0/1");
    expect(pair.external.address.startsWith("N")).toBe(true);
    expect(pair.external.address).not.toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
    expect(NeuraiKey.getCoinType("xna-old-legacy")).toBe(0);
  });

  test("xna-old-legacy has no testnet id (testnet coin type is 1, as in xna-legacy-test)", () => {
    expect(() => NeuraiKey.getAddressPair("xna-old-legacy-test", mnemonic, 0, 0)).toThrow(/network must be/);
    expect(NeuraiKey.getAddressPair("xna-legacy-test", mnemonic, 0, 0).external.path).toBe("m/44'/1'/0'/0/0");
  });
});

describe("Network names are not interchangeable between address types", () => {
  test("AuthScript functions reject PQ networks and vice versa", () => {
    expect(() => NeuraiKey.getNoAuthAddress("xna-pq")).toThrow(/AuthScript network/);
    expect(() => NeuraiKey.getPQAddress("xna-authscript", ABANDON, 0, 0)).toThrow(/PQ network/);
    expect(() => NeuraiKey.getAddressPair("xna-pq", ABANDON, 0, 0)).toThrow(/network must be/);
  });
});

describe("Input validation", () => {
  test("PQ functions reject the removed AuthScript options instead of ignoring them", () => {
    const options = { witnessScript: "00" };
    const hdKey = NeuraiKey.getPQHDKey("xna-pq-test", ABANDON);
    expect(() => NeuraiKey.getPQAddress("xna-pq-test", ABANDON, 0, 0, "", options)).toThrow(/getPQAuthScriptAddress/);
    expect(() => NeuraiKey.getPQAddressByPath("xna-pq-test", hdKey, "m_pq/100'/1'/0'/0'/0'", options)).toThrow(/getPQAuthScriptAddressByPath/);
    expect(() => NeuraiKey.pqPublicKeyToAddress("xna-pq-test", FIXTURE_PQ_PUBKEY, options)).toThrow(/pqPublicKeyToAuthScriptAddress/);
    expect(() => NeuraiKey.pqPublicKeyToCommitmentHex(FIXTURE_PQ_PUBKEY, options)).toThrow(/pqPublicKeyToAuthScriptCommitmentHex/);
    expect(() => NeuraiKey.generatePQAddressObject("xna-pq-test", "", options)).toThrow(/getPQAuthScriptAddress/);
    expect(() => NeuraiKey.getPQAddress("xna-pq-test", ABANDON, 0, 0, "", {})).toThrow(/no longer accepts/);
  });

  test("ECDSA and Base58 reject public keys that are not secp256k1 points", () => {
    expect(() => NeuraiKey.publicKeyToAddress("xna-test", "02" + "ff".repeat(32))).toThrow(/valid secp256k1 point/);
    expect(() => NeuraiKey.publicKeyToAddress("xna-legacy", "02" + "ff".repeat(32))).toThrow(/valid secp256k1 point/);
    expect(() => NeuraiKey.publicKeyToAddress("xna-legacy-test", FIXTURE_ECDSA_PUBKEY)).toThrow(/valid secp256k1 point/);
    expect(() => NeuraiKey.publicKeyToAddress("xna-legacy", "04" + "11".repeat(64))).toThrow(/valid secp256k1 point/);
  });

  test("Base58 still accepts valid compressed and uncompressed public keys", () => {
    // secp256k1 generator point G
    const gx = "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
    const gy = "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
    expect(NeuraiKey.publicKeyToAddress("xna-legacy", "02" + gx).startsWith("N")).toBe(true);
    expect(NeuraiKey.publicKeyToAddress("xna-legacy", "04" + gx + gy).startsWith("N")).toBe(true);
  });

  test("Account and index must be integers in the BIP32 range", () => {
    for (const bad of [1.5, -1, 0x80000000, Number.NaN]) {
      expect(() => NeuraiKey.getAddressPair("xna-test", ABANDON, 0, bad)).toThrow(/position must be an integer/);
      expect(() => NeuraiKey.getAddressPair("xna-test", ABANDON, bad, 0)).toThrow(/account must be an integer/);
      expect(() => NeuraiKey.getPQAddress("xna-pq-test", ABANDON, 0, bad)).toThrow(/index must be an integer/);
      expect(() => NeuraiKey.getPQAuthScriptAddress("xna-authscript-test", ABANDON, 0, bad)).toThrow(/index must be an integer/);
      expect(() => NeuraiKey.getLegacyAuthScriptAddress("xna-authscript-test", "xna-legacy-test", ABANDON, 0, bad)).toThrow(/index must be an integer/);
      expect(() => NeuraiKey.getAddressPair("xna-legacy-test", ABANDON, 0, bad)).toThrow(/position must be an integer/);
    }
    expect(NeuraiKey.getAddressPair("xna-test", ABANDON, 0, 0x7fffffff).external.path).toBe("m/84'/1'/0'/0/2147483647");
  });

  test("Derivation paths reject non-integer segments", () => {
    const hdKey = NeuraiKey.getHDKey("xna-test", ABANDON);
    expect(() => NeuraiKey.getAddressByPath("xna-test", hdKey, "m/84'/1'/0'/0/1.5")).toThrow(/Invalid index/);
    expect(() => NeuraiKey.getAddressByPath("xna-test", hdKey, "m/84'/1'/0'/0/1x")).toThrow(/Invalid index/);
    const pqHdKey = NeuraiKey.getPQHDKey("xna-pq-test", ABANDON);
    expect(() => NeuraiKey.getPQAddressByPath("xna-pq-test", pqHdKey, "m_pq/100'/1'/0'/0'/1.5'")).toThrow(/Invalid PQ-HD index/);
  });
});

// Address objects expose both the address and the commitment behind it. Both
// come from a single commitment computation, so they must still agree with the
// standalone helpers that compute it independently.
describe("Address and commitment stay consistent", () => {
  test("ECDSA (witness v3): by path, by WIF and from the public key agree", () => {
    const hdKey = NeuraiKey.getHDKey("xna", ABANDON);
    const byPath = NeuraiKey.getAddressByPath("xna", hdKey, "m/84'/1900'/0'/0/3");
    const byWIF = NeuraiKey.getAddressByWIF("xna", byPath.WIF);

    expect(byPath.address).toBe(NeuraiKey.publicKeyToAddress("xna", byPath.publicKey));
    expect(byWIF.address).toBe(byPath.address);
    expect(byWIF.commitment).toBe(byPath.commitment);
    expect(byWIF.authDescriptor).toBe(byPath.authDescriptor);
    expect(byWIF.witnessScript).toBe(byPath.witnessScript);
  });

  test("PQ (witness v2)", () => {
    const pqAddress = NeuraiKey.getPQAddress("xna-pq", ABANDON, 0, 2);
    expect(pqAddress.address).toBe(NeuraiKey.pqPublicKeyToAddress("xna-pq", pqAddress.publicKey));
    expect(pqAddress.commitment).toBe(NeuraiKey.pqPublicKeyToCommitmentHex(pqAddress.publicKey));
    expect(pqAddress.authDescriptor).toBe(NeuraiKey.pqPublicKeyToAuthDescriptorHex(pqAddress.publicKey));
  });

  test("Generic AuthScript (witness v1) with a custom witnessScript", () => {
    const options = { witnessScript: "5187" };
    const hdKey = NeuraiKey.getPQHDKey("xna-pq", ABANDON);
    const addr = NeuraiKey.getPQAuthScriptAddressByPath("xna-authscript", hdKey, "m_pq/100'/1900'/0'/0'/0'", options);

    expect(addr.address).toBe(NeuraiKey.pqPublicKeyToAuthScriptAddress("xna-authscript", addr.publicKey, options));
    expect(addr.commitment).toBe(NeuraiKey.pqPublicKeyToAuthScriptCommitmentHex(addr.publicKey, options));
    expect(addr.witnessScript).toBe("5187");
  });

  test("Legacy Base58 networks carry no witness fields", () => {
    const addr = NeuraiKey.getAddressPair("xna-legacy", ABANDON, 0, 0).external;
    expect(addr.address.startsWith("N")).toBe(true);
    expect(addr.commitment).toBeUndefined();
    expect(addr.witnessVersion).toBeUndefined();
    expect(addr.witnessScript).toBeUndefined();
  });
});

// BIP32 says to "proceed with the next value for i" when a child key comes out
// invalid. The next value has to stay inside the same domain.
describe("BIP32 child index bounds", () => {
  const HARDENED = 0x80000000;

  test("An out-of-range child index throws instead of wrapping", () => {
    const hdKey = NeuraiKey.getHDKey("xna-legacy", ABANDON);
    for (const bad of [2 ** 32, 2 ** 33, -1, 1.5, Number.NaN]) {
      expect(() => hdKey.deriveChild(bad)).toThrow(/Invalid child index/);
    }
  });

  test("The last normal index stays normal", () => {
    const hdKey = NeuraiKey.getHDKey("xna-legacy", ABANDON);
    // A public-only key cannot derive hardened children, so this would throw if
    // index 2**31-1 fell through into the hardened range.
    const publicOnly = new NeuraiKey.HDKey(hdKey.versions, hdKey.chainCode, hdKey.publicKey);
    const child = publicOnly.deriveChild(HARDENED - 1);

    expect(child.index).toBe(HARDENED - 1);
    expect(child.privateKey).toBeUndefined();
    expect(child.publicKey).toEqual(hdKey.deriveChild(HARDENED - 1).publicKey);
  });

  test("The last hardened index does not wrap back to index 0", () => {
    const hdKey = NeuraiKey.getHDKey("xna-legacy", ABANDON);
    const last = hdKey.deriveChild(2 ** 32 - 1);

    expect(last.index).toBe(2 ** 32 - 1);
    expect(last.publicKey).not.toEqual(hdKey.deriveChild(HARDENED).publicKey);
  });
});

// The node's CNeuraiSecret::IsValid() requires the WIF prefix to match the active chain,
// so a foreign WIF must not be silently re-encoded for the target network.
describe("WIF is bound to its network", () => {
  // Public test fixtures: mainnet WIF version 0x80, testnet 0xef.
  const mainnetWIF = "KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq";
  const testnetWIF = NeuraiKey.getAddressPair("xna-legacy-test", ABANDON, 0, 0).external.WIF;
  const wrongNetwork = /different network/;

  test("getAddressByWIF rejects a WIF from the other network", () => {
    expect(() => NeuraiKey.getAddressByWIF("xna-legacy-test", mainnetWIF)).toThrow(wrongNetwork);
    expect(() => NeuraiKey.getAddressByWIF("xna-test", mainnetWIF)).toThrow(wrongNetwork);
    expect(() => NeuraiKey.getAddressByWIF("xna-legacy", testnetWIF)).toThrow(wrongNetwork);
    expect(() => NeuraiKey.getAddressByWIF("xna", testnetWIF)).toThrow(wrongNetwork);
  });

  test("getPubkeyByWIF honours its network argument", () => {
    expect(() => NeuraiKey.getPubkeyByWIF("xna-legacy-test", mainnetWIF)).toThrow(wrongNetwork);
    expect(NeuraiKey.getPubkeyByWIF("xna-legacy", mainnetWIF)).toBe(
      "024108b96e53795cc28fb8b64532e61f17aa3c149e06815958361c5dddba1e7ec0"
    );
  });

  test("getLegacyAuthScriptAddressByWIF rejects a WIF from the other chain", () => {
    expect(() => NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", mainnetWIF)).toThrow(wrongNetwork);
    expect(() => NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript", testnetWIF)).toThrow(wrongNetwork);
  });

  test("A matching WIF still works on every network that takes one", () => {
    expect(NeuraiKey.getAddressByWIF("xna-legacy", mainnetWIF).address).toBe("NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp");
    expect(NeuraiKey.getAddressByWIF("xna-legacy-test", testnetWIF).address.startsWith("t")).toBe(true);
    expect(NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript", mainnetWIF).address.startsWith("nc1")).toBe(true);
  });

  test("The network check fires before the compressed-WIF check", () => {
    // Testnet uncompressed WIF: wrong network for xna, and also uncompressed.
    const uncompressedTestnetWIF = "92sgc63gozHHpqjAmM5w4bxKJx6BcL974zrS6ZXMozNfBn4cx6m";
    expect(() => NeuraiKey.getAddressByWIF("xna", uncompressedTestnetWIF)).toThrow(wrongNetwork);
    expect(() => NeuraiKey.getAddressByWIF("xna-test", uncompressedTestnetWIF)).toThrow(/compressed/);
  });
});
