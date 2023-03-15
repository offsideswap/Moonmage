import { CurveMetaPool } from "src/classes/Pool/CurveMetaPool";
import Pool from "src/classes/Pool/Pool";
import { Token } from "src/classes/Token";
import { MoonmageSDK } from "src/lib/MoonmageSDK";

export class Pools {
  static sdk: MoonmageSDK;
  public readonly MOON_CRV3: CurveMetaPool;

  public readonly pools: Set<Pool>;

  private lpAddressMap = new Map<string, Pool>();

  constructor(sdk: MoonmageSDK) {
    Pools.sdk = sdk;
    this.pools = new Set();
    this.lpAddressMap = new Map();

    ////// Curve Meta Pool

    // The pool contract address should be exactly
    // the same as the LP token's address
    this.MOON_CRV3 = new CurveMetaPool(
      sdk,
      sdk.addresses.MOON_CRV3.get(sdk.chainId),
      sdk.tokens.MOON_CRV3_LP,
      [sdk.tokens.MOON, sdk.tokens.CRV3],
      {
        name: "MOON:3CRV Pool",
        logo: "",
        symbol: "MOON:3CRV",
        color: "#ed9f9c"
      }
    );
    this.pools.add(this.MOON_CRV3);
    this.lpAddressMap.set(sdk.tokens.MOON_CRV3_LP.address.toLowerCase(), this.MOON_CRV3);
  }

  getPoolByLPToken(token: Token): Pool | undefined {
    return this.lpAddressMap.get(token.address);
  }
}
