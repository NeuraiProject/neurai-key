# neurai-key

Generate Neurai addresses from a mnemonic phrase following the standards BIP32, BIP39, BIP44.

That is, use your 12 words to get addresses for Neurai mainnet and testnet.

**NPM**: https://www.npmjs.com/package/@neuraiproject/neurai-key   
**CDN**: https://cdn.jsdelivr.net/npm/@neuraiproject/neurai-key@5.0.0/dist/NeuraiKey.global.js   

## Features

- ✅ Generate HD wallets from mnemonic phrases (BIP39)
- ✅ Derive addresses using BIP32/BIP44 standards
- ✅ Support for passphrase (25th word) for additional security
- ✅ Multi-language mnemonic support (English, Spanish, French, Italian, etc.)
- ✅ Mainnet and Testnet support for Neurai (XNA)
- ✅ Support for both XNA (BIP44: 1900) and XNA Legacy (BIP44: 0) networks
- ✅ Convert raw public keys into Neurai mainnet or testnet addresses
- ✅ PQ addresses (ML-DSA-44), Bech32m witness v2 (`pq1z…` / `tpq1z…`)
- ✅ ECDSA addresses (secp256k1), Bech32m witness v3 (`nq1r…` / `tnq1r…`)
- ✅ Generic AuthScript witness v1 addresses for contracts (`nq1p…` / `tnq1p…`):
  - `authType = 0x00` NoAuth addresses from `witnessScript` only
  - `authType = 0x01` ML-DSA-44 key with a custom `witnessScript`
  - `authType = 0x02` Legacy secp256k1 key with a custom `witnessScript`

## Compatibility Note

### 5.0.0: address types follow the node

The Neurai node now has one address type per family (`getnewaddress "" legacy|pq|ecdsa`), plus the generic AuthScript witness v1 for contracts. The library networks follow the same split:

| Network | Address | 4.x | 5.0.0 |
|---------|---------|-----|-------|
| `xna-pq` / `xna-pq-test` | PQ | generic witness v1 `nq1p…` / `tnq1p…` | **strict witness v2 `pq1z…` / `tpq1z…`** |
| `xna-ecdsa` / `xna-ecdsa-test` | ECDSA | — | **new**: strict witness v3 `nq1r…` / `tnq1r…` |
| `xna-authscript` / `xna-authscript-test` | Generic AuthScript | was `xna-pq` | **new name** for witness v1 `nq1p…` / `tnq1p…` |

Breaking changes versus `4.x`:
- `getPQAddress`, `getPQAddressByPath`, `pqPublicKeyToAddress`, `pqPublicKeyToCommitmentHex` and `generatePQAddressObject` return the witness v2 PQ address. They no longer take AuthScript options (the template is fixed to `OP_TRUE`): passing the old `options` argument throws an error that points to the `*AuthScript*` function, so a contract `witnessScript` is never dropped silently.
- The witness v1 PQ address moved to `getPQAuthScriptAddress`, `getPQAuthScriptAddressByPath`, `pqPublicKeyToAuthScriptAddress` and `pqPublicKeyToAuthScriptCommitmentHex`, with the `xna-authscript` networks. The same mnemonic and index give **the same `nq1p…` / `tnq1p…` address as 4.x**.
- `getNoAuthAddress`, `getLegacyAuthScriptAddress` and `getLegacyAuthScriptAddressByWIF` take `xna-authscript` / `xna-authscript-test` instead of `xna-pq` / `xna-pq-test`.
- PQ keys and extended keys (`xpqp…` / `tpqp…`) are unchanged: the witness v1 and witness v2 PQ addresses of an index share the same ML-DSA-44 key.

### Activation per network

The library already generates every format, but the node only protects an address type on networks where it is active. Before activation a witness output is anyone-can-spend.

| Address type | Mainnet | Testnet | Regtest |
|---|---|---|---|
| Legacy (`xna`, `xna-legacy`) | ✅ | ✅ | ✅ |
| Generic AuthScript witness v1 (`xna-authscript`) | ❌ not active: outputs are not protected | ✅ | ✅ |
| PQ witness v2 (`xna-pq`), ECDSA witness v3 (`xna-ecdsa`) | ❌ the node rejects the address | ❌ the node rejects the address | ✅ |

Until activation is announced: use **Legacy** on mainnet, Legacy or `xna-authscript-test` on testnet, and any type on regtest.

### 4.0.0: native PQ HD tree

Starting in `4.0.0`, PQ HD derivation uses a native PQ tree (HMAC-SHA512 with `"Neurai PQ seed"`, all derivation levels hardened, path `m_pq/100'/coin'/0'/0'/index'`). The extended private key format is also updated (prefix `xpqp...` mainnet / `tpqp...` testnet, 74-byte padded layout matching BIP32 xprv length).

These are breaking changes versus `3.x`:
- PQ addresses produced from the same mnemonic will differ between `3.x` and `4.x`.
- PQ extended private keys exported by `3.x` (leading `DeG1...` / `Ck5n...`) are not readable by `4.x`.

If you have mnemonics from `3.x`, keep them — the mnemonic is the authoritative backup. Any funds on `3.x` PQ addresses should be moved before upgrading.

Since `3.1.0`, PQ AuthScript descriptors are computed as `0x01 || HASH160(0x05 || rawPublicKey)` to match `neurai-sign-transaction` and the node implementation.

## Network Types

Each network selects one address type. The configuration lives in [`coins/`](coins/), without repetition:

- [`coins/chain-params.ts`](coins/chain-params.ts): parameters of each chain (mainnet, testnet, regtest): magic, ports, genesis, DNS seeds, Base58/WIF prefixes and BIP32 versions.
- [`coins/address-types.ts`](coins/address-types.ts): one entry per address type: encoding, prefix, key and derivation path.

| Network (mainnet / testnet) | Address type (`address-types.ts`) | Key and derivation (mainnet / testnet) | Encoding | Prefix |
|---|---|---|---|---|
| `xna` / `xna-test` | `legacy` (recommended Base58) | secp256k1, `m/44'/1900'/…` / `m/44'/1'/…` | Base58Check | `N…` / `t…` |
| `xna-legacy` / `xna-legacy-test` | `legacyCoin0` (node wallet and older wallets) | secp256k1, `m/44'/0'/…` / `m/44'/1'/…` | Base58Check | `N…` / `t…` |
| `xna-pq` / `xna-pq-test` | `pq` | ML-DSA-44, `m_pq/100'/1900'/…` / `m_pq/100'/1'/…` (all hardened) | Bech32m witness v2 | `pq1z…` / `tpq1z…` |
| `xna-ecdsa` / `xna-ecdsa-test` | `ecdsa` | secp256k1, `m/84'/1900'/…` / `m/84'/1'/…` | Bech32m witness v3 | `nq1r…` / `tnq1r…` |
| `xna-authscript` / `xna-authscript-test` | `authscript` (contracts) | PQ tree for `0x01`, BIP44 for `0x02`, none for `0x00` | Bech32m witness v1 | `nq1p…` / `tnq1p…` |

**Note**: Using different network types will generate completely different addresses from the same mnemonic.

**Regtest**: there is no dedicated `regtest` network — use the `*-test` networks. The Neurai node shares all address encoding between testnet and regtest: same network magic, same Base58 prefixes, same coin type (1), same Bech32m HRPs (`tnq`, `tpq`) and same extended key versions (`tprv`/`tpub`/`tpqp`). Only the ports differ (regtest `19200` / RPC `19201`).


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

`publicKeyToAddress` throws if the key length is not 33 or 65 bytes, or if the key is not a valid secp256k1 point (an address nobody could spend from), so invalid inputs are surfaced immediately.

## Bech32m address types

The three Bech32m families share the AuthScript commitment. The witness version is also the first byte of the commitment preimage:

```
commitment = tagged_hash("NeuraiAuthScript", version || auth_descriptor || SHA256(witnessScript))
```

| | PQ | ECDSA | Generic AuthScript |
|---|---|---|---|
| Network | `xna-pq` / `xna-pq-test` | `xna-ecdsa` / `xna-ecdsa-test` | `xna-authscript` / `xna-authscript-test` |
| Witness version / prefix | 2, `pq1z…` / `tpq1z…` | 3, `nq1r…` / `tnq1r…` | 1, `nq1p…` / `tnq1p…` |
| `authType` | `0x01` (fixed) | `0x02` (fixed) | `0x00`, `0x01` or `0x02` |
| Auth descriptor | `0x01 \|\| HASH160(0x05 \|\| pq_pubkey)` | `0x02 \|\| HASH160(compressed_pubkey)` | per `authType` |
| `witnessScript` | `OP_TRUE` (`51`), fixed | `OP_TRUE` (`51`), fixed | any, default `OP_TRUE` |
| Use | receive PQ | receive ECDSA | contracts |

PQ and ECDSA are only active on regtest, and generic AuthScript is not active on mainnet (see [activation per network](#activation-per-network)).

`commitment` is returned as the raw SHA-256 digest. The node's `validateaddress` shows it as a byte-reversed `uint256`.

## PQ addresses (ML-DSA-44, witness v2)

Quantum-resistant addresses using the ML-DSA-44 signature scheme (FIPS 204).

### Generate a PQ address

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = NeuraiKey.generateMnemonic();
const network = "xna-pq"; // or "xna-pq-test" for testnet / regtest
const ACCOUNT = 0;
const INDEX = 0;

const pqAddress = NeuraiKey.getPQAddress(network, mnemonic, ACCOUNT, INDEX);
console.log(pqAddress);
```

`getPQAddress()` returns the external branch.

Outputs

```
{
  address: 'pq1z...',                   // Bech32m witness v2
  witnessVersion: 2,
  authType: 1,                          // 0x01 = ML-DSA-44
  authDescriptor: '01...',              // 0x01 || HASH160(0x05 || pq_pubkey)
  commitment: '...',                    // tagged_hash("NeuraiAuthScript", 0x02 || ...)
  path: "m_pq/100'/1900'/0'/0'/0'",     // native PQ tree, all hardened
  publicKey: '...',                     // ML-DSA-44 public key (2624 hex chars = 1312 bytes)
  privateKey: '...',                    // ML-DSA-44 private key (5120 hex chars = 2560 bytes)
  seedKey: '...',                       // 32-byte native PQ seed used for ML-DSA keygen (64 hex chars)
  witnessScript: '51'                   // fixed OP_TRUE
}
```

### Generate a random PQ wallet

```javascript
const pqWallet = NeuraiKey.generatePQAddressObject("xna-pq");
console.log(pqWallet.mnemonic);  // 12-word mnemonic
console.log(pqWallet.address);   // pq1z...
```

### Reconstruct a PQ address from its public key

```javascript
const pqAddress = NeuraiKey.getPQAddress("xna-pq", mnemonic, 0, 0);
const reconstructed = NeuraiKey.pqPublicKeyToAddress("xna-pq", pqAddress.publicKey);
// reconstructed === pqAddress.address
```

### Advanced: derive by path with HD key reuse

```javascript
const hdKey = NeuraiKey.getPQHDKey("xna-pq", mnemonic);
const addr0 = NeuraiKey.getPQAddressByPath("xna-pq", hdKey, "m_pq/100'/1900'/0'/0'/0'");
const addr1 = NeuraiKey.getPQAddressByPath("xna-pq", hdKey, "m_pq/100'/1900'/0'/0'/1'");
const change0 = NeuraiKey.getPQAddressByPath("xna-pq", hdKey, "m_pq/100'/1900'/0'/1'/0'");
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

The binary layout (74 bytes: `depth + fingerprint + child + chainCode + 0x00 + pq_seed`) and version bytes (`0x0488AC24` mainnet, `0x043581D5` testnet) match the Neurai node's `CNeuraiExtKeyPQ` serialization. The same PQ HD key serves the PQ (witness v2) and the generic AuthScript (witness v1) addresses.

### PQ Details

| Property | Value |
|----------|-------|
| Signature algorithm | ML-DSA-44 (FIPS 204) |
| Address encoding | Bech32m, witness v2 |
| Mainnet HRP / prefix | `pq` / `pq1z...` |
| Testnet / regtest HRP / prefix | `tpq` / `tpq1z...` |
| Public key size | 1312 bytes |
| HD tree | Native PQ, HMAC-SHA512 with key `"Neurai PQ seed"`, hardened-only |
| Derivation path (mainnet) | `m_pq/100'/1900'/account'/change'/index'` |
| Derivation path (testnet) | `m_pq/100'/1'/account'/change'/index'` |
| Extended privkey prefix | `xpqp...` (mainnet) / `tpqp...` (testnet), 111 base58 chars |
| Auth descriptor | `0x01 \|\| HASH160(0x05 \|\| pq_pubkey)` |
| Commitment | `tagged_hash("NeuraiAuthScript", 0x02 \|\| auth_descriptor \|\| SHA256(0x51))` |

**Note**: PQ addresses do not have a WIF (Wallet Import Format) field since WIF is specific to secp256k1 keys. The `seedKey` field contains the 32-byte native PQ seed used for deterministic ML-DSA-44 key generation, useful for cross-implementation verification.

## ECDSA addresses (secp256k1, witness v3)

secp256k1 keys in their own BIP32 branch `m/84'/coin'/account'/change/index`. The coin type is `1900` on mainnet (not the legacy `0`) and `1` on testnet/regtest.

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const ecdsa = NeuraiKey.getECDSAAddress("xna-ecdsa", mnemonic, 0, 0);
console.log(ecdsa);
```

Outputs

```
{
  address: 'nq1r...',                   // Bech32m witness v3
  witnessVersion: 3,
  authType: 2,                          // 0x02 = secp256k1
  authDescriptor: '02...',              // 0x02 || HASH160(compressed_pubkey)
  commitment: '...',                    // tagged_hash("NeuraiAuthScript", 0x03 || ...)
  path: "m/84'/1900'/0'/0/0",
  publicKey: '02...',                   // compressed secp256k1 public key
  privateKey: '...',
  WIF: 'K...',
  witnessScript: '51'                   // fixed OP_TRUE
}
```

```javascript
// Change (internal) branch or any other path, reusing the HD key
const hdKey = NeuraiKey.getECDSAHDKey("xna-ecdsa", mnemonic);
const change0 = NeuraiKey.getECDSAAddressByPath("xna-ecdsa", hdKey, "m/84'/1900'/0'/1/0");

// From a WIF or a compressed public key
NeuraiKey.getECDSAAddressByWIF("xna-ecdsa", ecdsa.WIF);
NeuraiKey.publicKeyToECDSAAddress("xna-ecdsa", ecdsa.publicKey);

// Random wallet
const wallet = NeuraiKey.generateECDSAAddressObject("xna-ecdsa");
```

Uncompressed keys (65-byte public keys or uncompressed WIF) are rejected, because the node has no ECDSA (witness v3) address for them. Public keys that are not valid secp256k1 points are rejected too: they would give an address nobody can spend from.

## Generic AuthScript addresses (witness v1)

Witness v1 accepts any `authType` and any `witnessScript`, so it is the family used for contracts. It uses the `xna-authscript` / `xna-authscript-test` networks (`nq1p…` / `tnq1p…`).

| `authType` | Name | Key |
|------------|------|-----|
| `0x00` | NoAuth | none, the spend path depends only on `witnessScript` |
| `0x01` | PQ | ML-DSA-44 from the PQ tree (`m_pq/100'/coin'/…`) |
| `0x02` | Legacy | secp256k1 from BIP44 (`m/44'/coin'/…`) |

The commitment is `tagged_hash("NeuraiAuthScript", 0x01 || auth_descriptor || SHA256(witnessScript))`, with `OP_TRUE` (`51`) as default `witnessScript`.

### PQ key with a custom witnessScript

```javascript
const pqAuthScript = NeuraiKey.getPQAuthScriptAddress("xna-authscript", mnemonic, 0, 0, "", {
  witnessScript: "5151"
});

console.log(pqAuthScript.address);       // nq1p...
console.log(pqAuthScript.witnessScript); // 5151
console.log(pqAuthScript.commitment);    // 32-byte commitment
```

Without options it returns the same `nq1p…` / `tnq1p…` address that `getPQAddress()` returned in `4.x`. Also available: `getPQAuthScriptAddressByPath(network, pqHdKey, path, options)`, `pqPublicKeyToAuthScriptAddress(network, publicKey, options)` and `pqPublicKeyToAuthScriptCommitmentHex(publicKey, options)`.

### Generate a NoAuth address

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const noAuth = NeuraiKey.getNoAuthAddress("xna-authscript-test");

console.log(noAuth);
```

Outputs

```javascript
{
  address: "tnq1...",
  witnessVersion: 1,
  authType: 0,
  commitment: "...",
  witnessScript: "51"
}
```

You can provide a custom `witnessScript`:

```javascript
const noAuth = NeuraiKey.getNoAuthAddress("xna-authscript-test", {
  witnessScript: "527551"
});
```

### Generate a Legacy AuthScript address from mnemonic

This derives a normal secp256k1 key using the selected Base58 network (BIP44), then wraps it as a generic AuthScript address.

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const mnemonic = "result pact model attract result puzzle final boss private educate luggage era";

const legacyAuth = NeuraiKey.getLegacyAuthScriptAddress(
  "xna-authscript-test",
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
  witnessVersion: 1,
  authType: 2,
  authDescriptor: "02...",
  commitment: "...",
  witnessScript: "51"
}
```

For a plain secp256k1 receive address use the ECDSA type (`xna-ecdsa`) instead: it has its own derivation branch and fixed template.

### Generate a Legacy AuthScript address from WIF

```javascript
import NeuraiKey from "@neuraiproject/neurai-key";

const wif = "cVP9mzcDqMzWDhekiKMWKqEy739Cp6rKDT4tbG4wXXVfopMfTiBW";
const legacyAuth = NeuraiKey.getLegacyAuthScriptAddressByWIF("xna-authscript-test", wif);

console.log(legacyAuth.address);
console.log(legacyAuth.publicKey);
```

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
