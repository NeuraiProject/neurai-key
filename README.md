# neurai-key

Generate Neurai addresses from a mnemonic phrase following the standards BIP32, BIP39, BIP44.

That is, use your 12 words to get addresses for Neurai mainnet and testnet.

**NPM**: https://www.npmjs.com/package/@neuraiproject/neurai-key   
**CDN**: https://cdn.jsdelivr.net/npm/@neuraiproject/neurai-key@4.0.0/dist/NeuraiKey.global.js   

## Features

- ✅ Generate HD wallets from mnemonic phrases (BIP39)
- ✅ Derive addresses using BIP32/BIP44 standards
- ✅ Support for passphrase (25th word) for additional security
- ✅ Multi-language mnemonic support (English, Spanish, French, Italian, etc.)
- ✅ Mainnet and Testnet support for Neurai (XNA)
- ✅ Support for both XNA (BIP44: 1900) and XNA Legacy (BIP44: 0) networks
- ✅ Convert raw public keys into Neurai mainnet or testnet addresses
- ✅ AuthScript witness v1 addresses with Bech32m encoding
- ✅ `authType = 0x00` NoAuth addresses from `witnessScript` only
- ✅ `authType = 0x01` PostQuantum ML-DSA-44 AuthScript addresses
- ✅ `authType = 0x02` Legacy secp256k1 AuthScript addresses

## Compatibility Note

Starting in `4.0.0`, PQ HD derivation uses a native PQ tree (HMAC-SHA512 with `"Neurai PQ seed"`, all derivation levels hardened, path `m_pq/100'/coin'/0'/0'/index'`). The extended private key format is also updated (prefix `xpqp...` mainnet / `tpqp...` testnet, 74-byte padded layout matching BIP32 xprv length).

These are breaking changes versus `3.x`:
- PQ addresses produced from the same mnemonic will differ between `3.x` and `4.x`.
- PQ extended private keys exported by `3.x` (leading `DeG1...` / `Ck5n...`) are not readable by `4.x`.

If you have mnemonics from `3.x`, keep them — the mnemonic is the authoritative backup. Any funds on `3.x` PQ addresses should be moved before upgrading.

Since `3.1.0`, PQ AuthScript descriptors are computed as `0x01 || HASH160(0x05 || rawPublicKey)` to match `neurai-sign-transaction` and the node implementation.

## Network Types

This library supports three Neurai network configurations:

- **`xna` / `xna-test`**: Current Neurai standard (BIP44 coin type: 1900)
- **`xna-legacy` / `xna-legacy-test`**: Legacy Neurai addresses (BIP44 coin type: 0)
- **`xna-pq` / `xna-pq-test`**: AuthScript witness v1 addresses (Bech32m, `nq1` / `tnq1`)

The main difference is the derivation path and address encoding:
- **XNA**: mainnet `m/44'/1900'/0'/0/0`, testnet `m/44'/1'/0'/0/0` — Base58Check (recommended for new wallets)
- **XNA Legacy**: mainnet `m/44'/0'/0'/0/0`, testnet `m/44'/1'/0'/0/0` — Base58Check (for compatibility with older wallets)
- **XNA PostQuantum**: mainnet `m_pq/100'/1900'/0'/0'/0'`, testnet default/external `m_pq/100'/1'/0'/0'/0'` — Bech32m (`nq1` / `tnq1`), native PQ HD tree with hardened-only derivation

**Note**: Using different network types will generate completely different addresses from the same mnemonic.


## Example get external and internal (change) addresses by path

A simple and "spot on" way to generate/derive addresses.

If you need brutal performance check out getAddressByPath example below.

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = NeuraiKey.generateMnemonic();
const ACCOUNT = 0; //default is zero
const POSITION = 1; //the second address for this wallet
const network = "xna"; //or xna-test for testnet, xna-legacy for legacy addresses
const addressPair = NeuraiKey.getAddressPair(
  network,
  mnemonic,
  ACCOUNT,
  POSITION
);

console.info("Mnemonic", mnemonic);

console.log(addressPair);
```

Outputs

```
Mnemonic result pact model attract result puzzle final boss private educate luggage era
{
  internal: {
    address: 'NQM5zP6jkwDgCZ2UQiUicW4e3YcWc4NY4S',
    path: "m/44'/0'/0'/1/1",
    publicKey: '02fe9a4190973398c54cdea353cb5b18aba4f272324ac3f15f4f204ef0884538e7',
    privateKey: '8ce41bc45958cf3f4124bcd40b940752fbaf9be58ed8dec2dd7551388523f0a9',
    WIF: 'L1was5cU14EbQDfz4BpiWhNAWZdmc4o1VSzv5w5GgKzSJwHpnGzP'
  },
  external: {
    address: 'NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp',
    path: "m/44'/0'/0'/0/1",
    publicKey: '024108b96e53795cc28fb8b64532e61f17aa3c149e06815958361c5dddba1e7ec0',
    privateKey: '08ae5a08aa6a464619c177a551488c868010b4d2b2249892712be9a4990f9fc3',
    WIF: 'KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq'
  },
  position: 1
}
```

## Example with Passphrase (BIP39 25th word)

For enhanced security, you can use an optional passphrase (also known as the "25th word"). 
This creates a completely different set of addresses from the same mnemonic.

**Important**: If you lose your passphrase, you cannot recover your wallet even with the mnemonic!

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
const passphrase = "my secret passphrase"; // Optional but highly secure
const network = "xna";
const ACCOUNT = 0;
const POSITION = 0;

// Generate address with passphrase
const addressPair = NeuraiKey.getAddressPair(
  network,
  mnemonic,
  ACCOUNT,
  POSITION,
  passphrase  // 5th parameter (optional)
);

console.log(addressPair.external.address);
// This will generate a DIFFERENT address than without the passphrase

// Without passphrase (or empty string)
const addressPairNoPass = NeuraiKey.getAddressPair(network, mnemonic, ACCOUNT, POSITION);
console.log(addressPairNoPass.external.address);
// This generates the standard address
```

**Use cases for passphrase:**
- Extra layer of security beyond the mnemonic
- Create multiple wallets from a single mnemonic
- Plausible deniability (different passphrases = different wallets)

## Example get the first public address for a wallet by BIP44 path

Note this is the fastest way to generate/derive addresses since we can re-use the hdKey object.

BUT its more technical since you have to provide the full BIP44 path.

```
import NeuraiKey from "@neuraiproject/neurai-key";

//use NeuraiKey.generateMnemonic() to generate mnemonic codes
const mnemonic =
  "result pact model attract result puzzle final boss private educate luggage era";
const path = "m/44'/175'/0'/0/1";
const network = "xna"; //or xna-test for testnet

// Optional: add passphrase as third parameter
const passphrase = ""; // empty string or omit for no passphrase
const hdKey = NeuraiKey.getHDKey(network, mnemonic, passphrase);

const address = NeuraiKey.getAddressByPath(network, hdKey, path);

console.log(address);

```

Outputs

```
{
  address: 'NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp',
  path: "m/44'/0'/0'/0/1",
  publicKey: '024108b96e53795cc28fb8b64532e61f17aa3c149e06815958361c5dddba1e7ec0',
  privateKey: '08ae5a08aa6a464619c177a551488c868010b4d2b2249892712be9a4990f9fc3',
  WIF: 'KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq'
}
```

## Convert a public key into a Neurai address

Every derived address now exposes the compressed public key so you can verify or reconstruct the address later. If you only have the raw public key (33-byte compressed or 65-byte uncompressed) you can convert it back into a Neurai address on either network:

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";
const pair = NeuraiKey.getAddressPair("xna", mnemonic, 0, 1);

// `publicKey` is a hex string, but Buffers are also accepted
const reconstructed = NeuraiKey.publicKeyToAddress("xna", pair.external.publicKey);

console.log(reconstructed); // NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp

// Works the same way for testnet
const testPair = NeuraiKey.getAddressPair("xna-test", mnemonic, 0, 1);
const testAddress = NeuraiKey.publicKeyToAddress("xna-test", testPair.external.publicKey);
console.log(testAddress); // tPXGaMRNwZuV1UKSrD9gABPscrJWUmedQ9
```

`publicKeyToAddress` throws if the key length is not 33 or 65 bytes so invalid inputs are surfaced immediately.

## PostQuantum (ML-DSA-44) AuthScript Addresses

Generate quantum-resistant AuthScript addresses using the ML-DSA-44 signature scheme (FIPS 204). The library now follows the migrated `witness v1 = AuthScript` layout, so the Bech32m program is a 32-byte commitment instead of the old 20-byte PQ keyhash.

Supported AuthScript variants:

| `authType` | Name | Description |
|------------|------|-------------|
| `0x00` | NoAuth | No signature. Spend path depends only on `witnessScript` |
| `0x01` | PQ | ML-DSA-44 post-quantum signature |
| `0x02` | Legacy | secp256k1 signature inside the AuthScript framework |

### Generate a PQ address

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = NeuraiKey.generateMnemonic();
const network = "xna-pq"; // or "xna-pq-test" for testnet
const ACCOUNT = 0;
const INDEX = 0;

const pqAddress = NeuraiKey.getPQAddress(network, mnemonic, ACCOUNT, INDEX);
console.log(pqAddress);
```

`getPQAddress()` returns the external branch by default.

Outputs

```
{
  address: 'nq1...',                    // Bech32m AuthScript address
  authType: 1,                         // 0x01 = PQ single-key auth
  authDescriptor: '01...',             // 0x01 || HASH160(0x05 || pq_pubkey)
  commitment: '...',                   // tagged_hash("NeuraiAuthScript", ...)
  path: "m_pq/100'/1900'/0'/0'/0'",     // PQ derivation path (native PQ tree, all hardened)
  publicKey: '...',                     // ML-DSA-44 public key (2624 hex chars = 1312 bytes)
  privateKey: '...',                    // ML-DSA-44 private key (5120 hex chars = 2560 bytes)
  seedKey: '...',                       // 32-byte native PQ seed used for ML-DSA keygen (64 hex chars)
  witnessScript: '51'                   // default OP_TRUE script for simple PQ auth
}
```

### Generate a random PQ wallet

```javascript
const pqWallet = NeuraiKey.generatePQAddressObject("xna-pq");
console.log(pqWallet.mnemonic);  // 12-word mnemonic
console.log(pqWallet.address);   // nq1...
```

### Reconstruct a PQ address from its public key

```javascript
const pqAddress = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", pqAddress.publicKey);
// reconstructed === pqAddress.address
```

### Custom AuthScript witnessScript

```javascript
const pqAddress = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0, "", {
  witnessScript: "5151"
});

console.log(pqAddress.witnessScript); // 5151
console.log(pqAddress.commitment);    // new 32-byte commitment
```

`getPQAddress()` always generates `authType = 0x01` PQ addresses. Use `getNoAuthAddress()` for `0x00` and `getLegacyAuthScriptAddress()` / `getLegacyAuthScriptAddressByWIF()` for `0x02`.

### Generate a NoAuth address

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const noAuth = NeuraiKey.getNoAuthAddress("xna-pq-test");

console.log(noAuth);
```

Outputs

```javascript
{
  address: "tnq1...",
  authType: 0,
  commitment: "...",
  witnessScript: "51"
}
```

You can provide a custom `witnessScript`:

```javascript
const noAuth = NeuraiKey.getNoAuthAddress("xna-pq-test", {
  witnessScript: "527551"
});
```

### Generate a Legacy AuthScript address from mnemonic

This derives a normal secp256k1 key using the selected legacy/current HD network, then wraps it as an AuthScript address using the PQ Bech32m network.

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

const legacyAuth = NeuraiKey.getLegacyAuthScriptAddress(
  "xna-pq-test",
  "xna-test",
  mnemonic,
  0,
  0
);

console.log(legacyAuth);
```

Outputs

```javascript
{
  address: "tnq1...",
  path: "m/44'/1'/0'/0/0",
  publicKey: "...",                    // compressed secp256k1 pubkey
  privateKey: "...",
  WIF: "...",
  authType: 2,
  authDescriptor: "02...",
  commitment: "...",
  witnessScript: "51"
}
```

### Generate a Legacy AuthScript address from WIF

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
const legacyAuth = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-pq-test", wif);

console.log(legacyAuth.address);
console.log(legacyAuth.publicKey);
```

### Advanced: derive by path with HD key reuse

```javascript
const hdKey = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
const addr0 = NeuraiKey.getPQAddressByPath("xna-pq", hdKey, "m_pq/100'/1900'/0'/0'/0'");
const addr1 = NeuraiKey.getPQAddressByPath("xna-pq", hdKey, "m_pq/100'/1900'/0'/0'/1'");
```

All PQ derivation levels are hardened; a non-hardened segment (`.../0/0`) throws.

### Export / import a PQ extended private key

```javascript
const hdKey = NeuraiKey.getPQHDKey("xna-pq", mnemonic);

// Serialize master (or any subtree) as xpqpriv / tpqpriv
const xpqpriv = NeuraiKey.pqExtendedPrivateKey("xna-pq", hdKey);
// xpqpriv starts with "xpqp..." (mainnet) or "tpqp..." (testnet), 111 chars

// Restore from the serialized form and keep deriving
const restored = NeuraiKey.pqHDKeyFromExtended("xna-pq", xpqpriv);
const addr = NeuraiKey.getPQAddressByPath("xna-pq", restored, "m_pq/100'/1900'/0'/0'/0'");
```

The binary layout (74 bytes: `depth + fingerprint + child + chainCode + 0x00 + pq_seed`) and version bytes (`0x0488AC24` mainnet, `0x043581D5` testnet) match the Neurai node's `CNeuraiExtKeyPQ` serialization.

### PQ AuthScript Details

| Property | Value |
|----------|-------|
| Signature algorithm | ML-DSA-44 (FIPS 204) |
| Address encoding | Bech32m (`witness v1` AuthScript) |
| Mainnet HRP / prefix | `nq` / `nq1...` |
| Testnet HRP / prefix | `tnq` / `tnq1...` |
| Public key size | 1312 bytes |
| HD tree | Native PQ, HMAC-SHA512 with key `"Neurai PQ seed"`, hardened-only |
| Derivation path (mainnet) | `m_pq/100'/1900'/0'/0'/index'` |
| Derivation path (testnet default/external) | `m_pq/100'/1'/0'/0'/index'` |
| Extended privkey prefix | `xpqp...` (mainnet) / `tpqp...` (testnet), 111 base58 chars |
| Auth descriptor | `0x01 \|\| HASH160(0x05 \|\| pq_pubkey)` |
| Commitment | `tagged_hash("NeuraiAuthScript", 0x01 \|\| auth_descriptor \|\| SHA256(witnessScript))` |
| Default witnessScript | `OP_TRUE` (`51` in hex) |

**Note**: PQ AuthScript addresses do not have a WIF (Wallet Import Format) field since WIF is specific to secp256k1 keys. The `seedKey` field contains the 32-byte native PQ seed used for deterministic ML-DSA-44 key generation, useful for cross-implementation verification.

## Get public key from WIF

If you have a private key in Wallet Import Format (WIF) and want the corresponding compressed public key:

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const network = "xna"; // or "xna-test"
const wif = "KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq";

const pubkeyHex = NeuraiKey.getPubkeyByWIF(network, wif);
console.log(pubkeyHex);
```

## How to import into your project

### ESM default

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";
```

### ESM browser explicit

```javascript
import NeuraiKey from "@neuraiproject/neurai-key/browser";
```

### CommonJS

```javascript
const NeuraiKey = require("@neuraiproject/neurai-key");
```

### Global build for HTML

```html
<html>
  <body>
    <script src="./node_modules/@neuraiproject/neurai-key/dist/NeuraiKey.global.js"></script>
    <script>
      alert(globalThis.NeuraiKey.generateMnemonic());
    </script>
  </body>
</html>
```

## Package layout in `4.0.0`

- `dist/index.js`: ESM main entry
- `dist/index.cjs`: CommonJS entry
- `dist/browser.js`: explicit browser ESM bundle
- `dist/NeuraiKey.global.js`: global build for `<script>`
- `dist/index.d.ts`: TypeScript declarations

## install

`npm install @neuraiproject/neurai-key`

## build

`npm run build`

## test

`npm test`

The test script already builds the package before running Vitest.

## BIP32

> BIP32 is the specification which introduced the standard for hierarchical deterministic (HD) wallets and extended keys to Bitcoin. Deterministic wallets can generate multiple "child" key pair chains from a master private "root" key in a deterministic way.[5][6] With the adoption of this standard, keys could be transferred between wallet software with a single extended private key (xprv), greatly improving the interoperability of wallets.

Quote from: https://en.m.wikipedia.org/wiki/Bitcoin_Improvement_Proposals#BIP32

Source: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

## BIP39

> BIP39 is a proposal describing the use of plain language words chosen from a specific word list,[8] and the process for using such a string to derive a random seed used to generate a wallet as described in BIP32. This approach of utilizing a mnemonic phrase offered a much more user friendly experience for backup and recovery of cryptocurrency wallets.

Quote from: https://en.m.wikipedia.org/wiki/Bitcoin_Improvement_Proposals#BIP39

Source: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki

## BIP44

> BIP44 defines a logical hierarchy for deterministic wallets based on an algorithm described in BIP32 and purpose scheme described in BIP43. It allows the handling of multiple coins, multiple accounts, external and internal chains per account and millions of addresses per chain

Quote from: https://en.m.wikipedia.org/wiki/Bitcoin_Improvement_Proposals#BIP44

Source: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

`m / purpose' / coin_type' / account' / change / address_index`

So in the case of Neurai the path m/44'/0'/0'/0/1 says "give me the second address"

The first part m/44'/0' says that the purpose is to use BIP44 with Neurai (coin_type 0). Consider that static code.

Accounts is deprecated and should be 0

Change: should be 0 or 1, 0 for external addresses and 1 for the change address

### Address gap limit

> Address gap limit is currently set to 20. If the software hits 20 unused addresses in a row, it expects there are no used addresses beyond this point and stops searching the address chain. We scan just the external chains, because internal chains receive only coins that come from the associated external chains.
>
> Wallet software should warn when the user is trying to exceed the gap limit on an external chain by generating a new address.

Source: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
