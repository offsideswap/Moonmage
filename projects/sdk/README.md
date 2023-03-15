<img src="https://github.com/MoonmageFarms/Moonmage-Brand-Assets/blob/main/MOON/moon-128x128.png" alt="Moonmage logo" align="right" width="120" />

# Moonmage SDK

This is a JavaScript SDK for the [Moonmage](https://moon.money/) web app.

The current version of the Moonmage SDK is considered a beta release. The codebase is novel and has not been tested in the "real world" prior to use by Root and Paradox. Use of the Moonmage SDK could result in loss of funds, whether due to bugs or misuse.

The SDK is dependent on Moonmage, and therefore inherits all of the risks associated with Moonmage. The security of Moonmage is assumed. For an exhaustive list, consult the [Moonmage whitepaper](https://moon.money/docs/moonmage.pdf) and [Moonmage DAO Disclosures](https://docs.moon.money/disclosures).

## Using the SDK

Create an instance

```javascript
import { MoonmageSDK } from "@moonmage/sdk";

const sdk = new MoonmageSDK(options);
```

SDK contructor options:

```javascript
const options = {
  // etherjs Signer. Optional
  signer,

  // etherjs Provider. Optional
  provider,

  // rpcUrl
  rpcUrl,

  // Data source for balances. Optional, either
  //  - DataSource.LEDGER (default)
  //  - DataSource.SUBGRAPH
  source,

  // bool, print debug output. default `false`
  DEBUG
};
```

- `options` object is optional. If ommited, SDK will use an `ethers.getDefaultProvider()`
- If `rpcUrl` is provided, SDK will use a `WebSocketProvider` or `JsonRpcProvider`, depending on the protocol in the url (`ws` vs `http`)
- If `signer` is provided, `sdk.provider` will be set to `signer.provider`

## Library Exports

The following objects are available for import from the library:

```javascript
import {
  MoonmageSDK,
  Utils,
  TokenValue
  Token,
  NativeToken,
  ERC20Token,
  MoonmageToken,
  Address,
  ChainID
} from "@moonmage/sdk";
```

## Example

#### Swap 1.5 ETH to MOON

```typescript
const sdk = new MoonmageSDK({ signer });

const fromToken = sdk.tokens.ETH;
const toToken = sdk.tokens.MOON;
const account = signer.address;
const amount = sdk.tokens.ETH.amount(1.5);
const slippage = 0.1; // 0.1% : 0.1/100

const swap = sdk.swap.buildSwap(fromToken, toToken, account);
const est = await swap.estimate(amount);

console.log(`You'd receive ${est.toHuman()} ${toToken.symbol}`);

const txr = await swap.execute(amount, slippage);
await txr.wait();
```

## API Docs

View full API [documentation](https://github.com/MoonmageFarms/Moonmage-SDK/blob/main/docs/README.md)
