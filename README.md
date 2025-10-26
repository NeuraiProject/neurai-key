# neurai-key

Generate Neurai addresses from a mnemonic phrase following the standards BIP32, BIP39, BIP44.

That is, use your 12 words to get addresses for Neurai mainnet and testnet.


## Example get external and internal (change) addresses by path

A simple and "spot on" way to generate/derive addresses.

If you need brutal performance check out getAddressByPath example below.

```
import NeuraiKey from "@neuraiproject/neurai-key";
//Or import as CommonsJS module
//const NeuraiKey = require("@neuraiproject/neurai-key");

const mnemonic = NeuraiKey.generateMnemonic();
const ACCOUNT = 0; //default is zero
const POSITION = 1; //the second address for this wallet
const network = "xna"; //or xna-test for testnet
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
    privateKey: '03e17c16cbab7390c8eea1919cbeefbcb7e5ccdb84e3cfc84f3d5a60dfaa6b68',
    WIF: 'Kwy4Dv5yF4vSYJvbmk5v1eYJPBgSKRLqDc6BJ5tLfYN7p8RbfCaF'
  },
  external: {
    address: 'NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp',
    path: "m/44'/0'/0'/0/1",
    privateKey: '0456b9eed4a0fd4c2a87f53f06aa1af5e5d44b9c68e6f464fba1abf02e3d41fe',
    WIF: 'KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq'
  },
  position: 1
}
```

## Example get the first public address for a wallet by BIP44 path

Note this is the fastest way to generate/derive addresses since we can re-use the hdKey object.

BUT its more technical since you have to provide the full BIP44 path.

```
import NeuraiKey from "@neuraiproject/neurai-key";

//use NeuraiKey.generateMnemonic() to generate mnemonic codes
const mnemonic =
  "result pact model attract result puzzle final boss private educate luggage era";
const path = "m/44'/0'/0'/0/1";
const network = "xna"; //or xna-test for testnet
const hdKey = NeuraiKey.getHDKey("xna", mnemonic);

const address = NeuraiKey.getAddressByPath(network, hdKey, path);

console.log(address);

```

Outputs

```
{
  address: 'NLdcSXGQvCVf2RTKhx7GZom34f1JADhBTp',
  path: "m/44'/0'/0'/0/1",
  privateKey: '0456b9eed4a0fd4c2a87f53f06aa1af5e5d44b9c68e6f464fba1abf02e3d41fe',
  WIF: 'KwWavecys1Qskgzwsyv6CNeTospWkvMeLzx3dLqeV4xAJEMXF8Qq'
}
```

## How to import into your project

### ES6 module

```
//As ES6 module
import NeuraiKey from "@neuraiproject/neurai-key";
```

### CommonsJS module

```
//As CommonsJS module
const NeuraiKey = require("@neuraiproject/neurai-key");
```

### Browserify

```
//A browseriy:d version, with all the dependencies bundled for the web
<html>
  <body>
    <script src="./node_modules/@neuraiproject/neurai-key/dist/NeuraiKey.js"></script>
    <script>
      alert(NeuraiKey.generateMnemonic());
    </script>
  </body>
</html>
```

## install

` npm install @neuraiproject/neurai-key`

## build

` npm run build`

## test

`npm test`

Note, the tests run on the built version, so you need to build before you run the tests

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

So in the case of Neurai the path m/44'/175'/0'/0/1 says "give me the second address"

The first part m/44'/175' says that the purpose is to use BIP44 with Neurai (coin_type 175). Consider that static code.

Accounts is deprecated and should be 0

Change: should be 0 or 1, 0 for external addresses and 1 for the change address

### Address gap limit

> Address gap limit is currently set to 20. If the software hits 20 unused addresses in a row, it expects there are no used addresses beyond this point and stops searching the address chain. We scan just the external chains, because internal chains receive only coins that come from the associated external chains.
>
> Wallet software should warn when the user is trying to exceed the gap limit on an external chain by generating a new address.

Source: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
