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
  const network = "xna";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);
  expect(address.external.address).toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
});

test("Validate address on test-net", () => {
  const network = "xna-test";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);
  expect(address.external.address).toBe("tPXGaMRNwZuV1UKSrD9gABPscrJWUmedQ9");
});

test("Validate address with passphrase on main-net", () => {
  const network = "xna";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const passphrase = "my secret passphrase";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, passphrase);
  expect(address.external.address).not.toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
  const address2 = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, passphrase);
  expect(address.external.address).toBe(address2.external.address);
});

test("Different passphrases generate different addresses", () => {
  const network = "xna";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const passphrase1 = "passphrase1";
  const passphrase2 = "passphrase2";

  const address1 = NeuraiKey.getAddressPair(network, mnemonic, 0, 0, passphrase1);
  const address2 = NeuraiKey.getAddressPair(network, mnemonic, 0, 0, passphrase2);

  expect(address1.external.address).not.toBe(address2.external.address);
});

test("Empty passphrase equals no passphrase", () => {
  const network = "xna";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

  const addressWithEmpty = NeuraiKey.getAddressPair(network, mnemonic, 0, 1, "");
  const addressWithoutPassphrase = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(addressWithEmpty.external.address).toBe(addressWithoutPassphrase.external.address);
  expect(addressWithEmpty.external.address).toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
});

test("Validate Wallet Import Format (WIF) main-net ", () => {
  const network = "xna";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(address.internal.address).toBe("NRYT7zihLQTGpcK4PKHnTFuQsLaTGJYzqm");
  expect(address.external.WIF).toBe("L1FXfT3WjVLERgqiQt3YzqU9F3Z8LmMhxPF4VHW5yd3Q6Q66woRQ");
});

test("Convert external public key to main-net address", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const pair = NeuraiKey.getAddressPair("xna", mnemonic, 0, 1);

  expect(NeuraiKey.publicKeyToAddress("xna", pair.external.publicKey)).toBe(
    pair.external.address
  );
});

test("Validate Wallet Import Format (WIF) test-net ", () => {
  const network = "xna-test";
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const address = NeuraiKey.getAddressPair(network, mnemonic, 0, 1);

  expect(address.external.WIF).toBe("cSfwLzc9DNj4PdzyGK1sAZzxNwih2HaezMrT8w4MXyhf8qhaHJiE");
});

test("Convert external public key to test-net address", () => {
  const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
  const pair = NeuraiKey.getAddressPair("xna-test", mnemonic, 0, 1);

  expect(NeuraiKey.publicKeyToAddress("xna-test", pair.external.publicKey)).toBe(
    pair.external.address
  );
});

test("Validate get public address from Wallet Import Format (WIF) main-net ", () => {
  const network = "xna";
  const WIF = "KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq";
  const addressObject = NeuraiKey.getAddressByWIF(network, WIF);

  expect(addressObject.address).toBe("NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp");
});

test("Get compressed public key from Wallet Import Format (WIF) main-net", () => {
  const network = "xna";
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
    expect(result.network).toBe("xna");
    expect(result).toHaveProperty("address");
  });

  it("default network should be xna for Neurai", () => {
    const network = "xna-test";
    const result = NeuraiKey.generateAddressObject(network);
    expect(result.network).toBe(network);
  });

  it("Should handle xna-test", () => {
    const network = "xna-test";
    const result = NeuraiKey.generateAddressObject(network);
    expect(result.network).toBe(network);
  });
});

describe("PostQuant ML-DSA-44 AuthScript addresses", () => {
  test("Test vector: known seed produces expected mainnet AuthScript address (NIP-022)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", addr.publicKey);

    expect(addr.address).toBe(
      "nq1p5e3g0zyumlt8utualrdsfhnxad9ea9vc3ful3cndx5neh45cj0cqyt49ek"
    );
    expect(addr.commitment).toBe(
      "a66287889cdfd67e2f9df8db04de66eb4b9e95988a79f8e26d35279bd69893f0"
    );
    expect(addr.authDescriptor).toBe("01f969f2877426e5cccf2412fa11a49404b16b40f1");
    expect(addr.witnessScript).toBe("51");
    expect(addr.address).toBe(reconstructed);
    expect(addr.address.startsWith("nq1")).toBe(true);
    expect(addr.seedKey.length).toBe(64);
  });

  test("Deterministic PQ address generation from mnemonic", () => {
    const network = "xna-pq";
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr1 = NeuraiKey.getPQAddress(network, mnemonic, 0, 0);
    const addr2 = NeuraiKey.getPQAddress(network, mnemonic, 0, 0);
    expect(addr1.address).toBe(addr2.address);
    expect(addr1.publicKey).toBe(addr2.publicKey);
  });

  test("Mainnet PQ addresses start with nq1", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    expect(addr.address.startsWith("nq1")).toBe(true);
  });

  test("Testnet PQ addresses start with tnq1", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq-test", mnemonic, 0, 0);
    expect(addr.address).toBe(
      "tnq1pdsj0aztvgwv3rwgml360stpyp228zrggyga6n4sdenmetm6wv3tqzddk95"
    );
    expect(addr.address.startsWith("tnq1")).toBe(true);
  });

  test("Mainnet path follows NIP-022 (m_pq, all hardened)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 5);
    expect(addr.path).toBe("m_pq/100'/1900'/0'/0'/5'");
  });

  test("Testnet PQ default path uses coinType 1 and hardened external branch 0'", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq-test", mnemonic, 0, 3);
    expect(addr.path).toBe("m_pq/100'/1'/0'/0'/3'");
  });

  test("Testnet PQ internal branch uses hardened change index 1' by explicit path", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const hdKey = NeuraiKey.getPQHDKey("xna-pq-test", mnemonic);
    const addr = NeuraiKey.getPQAddressByPath("xna-pq-test", hdKey, "m_pq/100'/1'/0'/1'/3'");
    expect(addr.path).toBe("m_pq/100'/1'/0'/1'/3'");
  });

  test("Non-hardened PQ path is rejected (NIP-022 requires hardened-only)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const hdKey = NeuraiKey.getPQHDKey("xna-pq-test", mnemonic);
    expect(() => NeuraiKey.getPQAddressByPath("xna-pq-test", hdKey, "m_pq/100'/1'/0'/0/0")).toThrow();
  });

  test("pqPublicKeyToAddress matches generated address", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", addr.publicKey);
    expect(reconstructed).toBe(addr.address);
  });

  test("Custom witnessScript changes commitment and address deterministically", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const options = { witnessScript: "5151" };
    const addr1 = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0, "", options);
    const addr2 = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0, "", options);

    expect(addr1.address).toBe(addr2.address);
    expect(addr1.commitment).toBe(addr2.commitment);
    expect(addr1.witnessScript).toBe("5151");
    expect(addr1.address).not.toBe(
      "nq1pe2gr8awq39r3hhcwtw2p368sq8gz3qq2mwch8jy8r8uxcqwhw28qff08qd"
    );
  });

  test("Different passphrases produce different PQ addresses", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr1 = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0, "passphrase1");
    const addr2 = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0, "passphrase2");
    expect(addr1.address).not.toBe(addr2.address);
  });

  test("PQ public key is 1312 bytes (2624 hex chars)", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    expect(addr.publicKey.length).toBe(2624);
  });

  test("generatePQAddressObject returns object with mnemonic", () => {
    const result = NeuraiKey.generatePQAddressObject();
    expect(result).toHaveProperty("mnemonic");
    expect(result).toHaveProperty("address");
    expect(result).toHaveProperty("seedKey");
    expect(result.address.startsWith("nq1")).toBe(true);
    expect(result.mnemonic.split(" ").length).toBe(12);
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
  test("NoAuth address with default witnessScript (OP_TRUE)", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-pq-test");

    expect(result.authType).toBe(0);
    expect(result.witnessScript).toBe("51");
    expect(result.address.startsWith("tnq1")).toBe(true);
    expect(result.commitment.length).toBe(64);
  });

  test("NoAuth address is deterministic", () => {
    const a = NeuraiKey.getNoAuthAddress("xna-pq-test");
    const b = NeuraiKey.getNoAuthAddress("xna-pq-test");
    expect(a.address).toBe(b.address);
    expect(a.commitment).toBe(b.commitment);
  });

  test("NoAuth with custom witnessScript produces different address", () => {
    const defaultAddr = NeuraiKey.getNoAuthAddress("xna-pq-test");
    const customAddr = NeuraiKey.getNoAuthAddress("xna-pq-test", {
      witnessScript: "527551",
    });

    expect(defaultAddr.address).not.toBe(customAddr.address);
    expect(customAddr.witnessScript).toBe("527551");
  });

  test("NoAuth mainnet address starts with nq1", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-pq");
    expect(result.address.startsWith("nq1")).toBe(true);
  });

  test("NoAuth commitment matches neurai-sign-transaction test vector", () => {
    const result = NeuraiKey.getNoAuthAddress("xna-pq-test");
    expect(result.commitment).toBe(
      "a6c181fcd8137e65528a30e4e2d457b51778238441b8f5dd8911c2084a17ee7b"
    );
  });
});

describe("Legacy AuthScript (authType=0x02) addresses", () => {
  test("Legacy AuthScript from mnemonic with default witnessScript", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const result = NeuraiKey.getLegacyAuthScriptAddress(
      "xna-pq-test", "xna-test", mnemonic, 0, 0
    );

    expect(result.authType).toBe(2);
    expect(result.witnessScript).toBe("51");
    expect(result.address.startsWith("tnq1")).toBe(true);
    expect(result.WIF).toBeDefined();
    expect(result.publicKey.length).toBe(66);
  });

  test("Legacy AuthScript is deterministic", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const a = NeuraiKey.getLegacyAuthScriptAddress("xna-pq-test", "xna-test", mnemonic, 0, 0);
    const b = NeuraiKey.getLegacyAuthScriptAddress("xna-pq-test", "xna-test", mnemonic, 0, 0);
    expect(a.address).toBe(b.address);
    expect(a.commitment).toBe(b.commitment);
    expect(a.WIF).toBe(b.WIF);
  });

  test("Legacy AuthScript from WIF", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const result = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-pq-test", wif);

    expect(result.authType).toBe(2);
    expect(result.address.startsWith("tnq1")).toBe(true);
    expect(result.publicKey).toBe(
      "02666e9b6aacfa34715c1050e890fa8f07a5e73c70f23abdca585f1506514d81a0"
    );
  });

  test("Legacy AuthScript address differs from PQ address with same mnemonic", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const pq = NeuraiKey.getPQAddress("xna-pq-test", mnemonic, 0, 0);
    const legacy = NeuraiKey.getLegacyAuthScriptAddress(
      "xna-pq-test", "xna-test", mnemonic, 0, 0
    );
    expect(pq.address).not.toBe(legacy.address);
  });

  test("Legacy AuthScript with custom witnessScript", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const defaultAddr = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-pq-test", wif);
    const customAddr = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-pq-test", wif, {
      witnessScript: "527551",
    });

    expect(defaultAddr.address).not.toBe(customAddr.address);
    expect(customAddr.witnessScript).toBe("527551");
  });

  test("Legacy AuthScript commitment matches neurai-sign-transaction test vector", () => {
    const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
    const result = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-pq-test", wif);
    expect(result.commitment).toBe(
      "4f3bf4e4647e4d567df289c131a999c67734819cd0901e77569af660d3d17adf"
    );
  });
});
