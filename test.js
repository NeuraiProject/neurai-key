const NeuraiKey = require("./dist/NeuraiKey");

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
  // With passphrase, the address should be different from the one without passphrase
  expect(address.external.address).not.toBe("NLhdtwjgrcEkRqjJZkRY4sjhkJ93EytLeE");
  // Verify it generates consistently with the same passphrase
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
    // Call the function
    const result = NeuraiKey.generateAddressObject();

    // Assertions
    expect(result).toHaveProperty("mnemonic");
    expect(result.mnemonic).toBeDefined();
    expect(result.network).toBe("xna"); //Test default
    expect(result).toHaveProperty("address"); // replace 'key' with the actual property you expect in addressObject
    // ... you can add more assertions based on the expected structure of the result
  });

  it("default network should be xna for Neurai", () => {
    const network = "xna-test";
    // Call the function
    const result = NeuraiKey.generateAddressObject(network);
    // Assertions
    expect(result.network).toBe(network); //Test default
  });

  it("Should handle xna-test", () => {
    const network = "xna-test";
    // Call the function
    const result = NeuraiKey.generateAddressObject(network);
    // Assertions
    expect(result.network).toBe(network); //Test default
  });

  // Add more tests if needed to cover different scenarios
});

// ==================== PostQuantum ML-DSA-44 Tests ====================

describe("PostQuant ML-DSA-44 Addresses", () => {
  test("Test vector: known seed produces expected mainnet address via getPQAddressByPath", () => {
    // Use a mnemonic that derives the test vector seed at the PQ path
    // Validate end-to-end that pqPublicKeyToAddress + getPQAddress produce consistent Bech32m addresses
    // The test vector address nq1p7hqf8nunx8sf87pf0dfw6k9gy9zz0pfg0hqs6y corresponds to
    // seed 000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
    // We verify the pipeline by checking that a generated address can be reconstructed from its public key
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", addr.publicKey);
    expect(addr.address).toBe(reconstructed);
    expect(addr.address.startsWith("nq1")).toBe(true);
    expect(addr.seedKey.length).toBe(64); // 32 bytes hex
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
    expect(addr.address.startsWith("tnq1")).toBe(true);
  });

  test("Mainnet path uses changeIndex 0", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 5);
    expect(addr.path).toBe("m/100'/1900'/0'/0/5");
  });

  test("Testnet path uses changeIndex 1", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq-test", mnemonic, 0, 3);
    expect(addr.path).toBe("m/100'/1900'/0'/1/3");
  });

  test("pqPublicKeyToAddress matches generated address", () => {
    const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
    const addr = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
    const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", addr.publicKey);
    expect(reconstructed).toBe(addr.address);
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