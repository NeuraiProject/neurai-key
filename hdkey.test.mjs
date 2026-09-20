import { afterEach, describe, expect, test, vi } from "vitest";
import { HDKey } from "./src/shared/hdkey.ts";
import * as bytes from "./src/shared/bytes.ts";

// Test source modules so the HMAC boundary can be controlled. Real HMAC output
// almost never exercises these failure branches; the packaged API is tested
// separately in test.test.mjs. Curve arithmetic and serialization remain real.
const versions = { private: 0x0488ade4, public: 0x0488b21e };
const seed = Uint8Array.from({ length: 32 }, (_, i) => i);
const master = HDKey.fromMasterSeed(seed, versions);
const parentScalar = bytes.bytesToNumberBE(master.privateKey);

function parent(publicOnly = false) {
  return new HDKey(versions, master.chainCode, master.publicKey, publicOnly ? undefined : master.privateKey);
}

function hmacResult(tweak) {
  return bytes.concatBytes(bytes.numberToBytesBE(tweak, 32), new Uint8Array(32).fill(0xa5));
}

function attemptedIndices(spy) {
  return spy.mock.calls.map(([, data]) => Number(bytes.bytesToNumberBE(data.slice(-4))));
}

afterEach(() => vi.restoreAllMocks());

describe.each([false, true])("BIP32 retries (public-only: %s)", (publicOnly) => {
  test.each([
    ["zero tweak", 0n],
    ["out-of-range tweak", bytes.SECP256K1_ORDER],
    ["zero child scalar / point at infinity", bytes.SECP256K1_ORDER - parentScalar],
  ])("skips %s and returns the next valid child", (_reason, tweak) => {
    const hdKey = parent(publicOnly);
    const expected = hdKey.deriveChild(11);
    const spy = vi.spyOn(bytes, "hmacSha512").mockReturnValueOnce(hmacResult(tweak));

    const actual = hdKey.deriveChild(10);

    expect(attemptedIndices(spy)).toEqual([10, 11]);
    expect(actual.index).toBe(11);
    expect(actual.privateExtendedKey).toBe(expected.privateExtendedKey);
    expect(actual.publicExtendedKey).toBe(expected.publicExtendedKey);
  });

  test("stops after four invalid children", () => {
    const spy = vi.spyOn(bytes, "hmacSha512").mockReturnValue(hmacResult(bytes.SECP256K1_ORDER));

    expect(() => parent(publicOnly).deriveChild(10)).toThrow(/Could not derive a valid child key/);
    expect(attemptedIndices(spy)).toEqual([10, 11, 12, 13]);
  });

  test("an invalid last normal child never crosses into hardened derivation", () => {
    const spy = vi.spyOn(bytes, "hmacSha512").mockReturnValue(hmacResult(bytes.SECP256K1_ORDER));

    expect(() => parent(publicOnly).deriveChild(0x7fffffff)).toThrow(/Could not derive a valid child key/);
    expect(attemptedIndices(spy)).toEqual([0x7fffffff]);
  });
});

test("an invalid last hardened child never wraps to index zero", () => {
  const spy = vi.spyOn(bytes, "hmacSha512").mockReturnValue(hmacResult(bytes.SECP256K1_ORDER));

  expect(() => parent().deriveChild(0xffffffff)).toThrow(/Could not derive a valid child key/);
  expect(attemptedIndices(spy)).toEqual([0xffffffff]);
});
