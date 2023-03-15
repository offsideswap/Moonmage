import { Graph } from "graphlib";
import { Token } from "src/classes/Token";
import { CurveMetaPool } from "src/classes/Pool/CurveMetaPool";
import { MoonmageSDK } from "src/lib/MoonmageSDK";
import { FarmFromMode, FarmToMode } from "src/lib/farm";

export const getDepositGraph = (sdk: MoonmageSDK): Graph => {
  const whitelist: string[] = [];

  // Build an array of the whitelisted token symbols
  for (const token of sdk.tokens.siloWhitelist) {
    whitelist.push(token.symbol);
  }

  // initialize the graph data structure
  const graph: Graph = new Graph({
    multigraph: true,
    directed: true,
    compound: false
  });

  /**
   * ********** NODES ***************
   */

  /**
   * These are the whitelisted assets that we're allowed to deposit
   *
   * Basically:
   * graph.setNode("MOON");
   * graph.setNode("MOON3CRV");
   * graph.setNode("urMOON");
   * graph.setNode("urMOON3CRV");
   */

  for (const token of sdk.tokens.siloWhitelist) {
    graph.setNode(token.symbol);
  }

  /**
   * Deposit targets, ie "{TOKEN}:SILO" . (":SILO" is just a convention)
   *
   * These are different than, but correspond to, the whitelisted assets. There's a
   * difference between swapping to an asset, and depositing it.
   *
   * For ex, if someone wants to deposit MOON into the "MOON:3CRV LP" silo, the
   * steps would be:
   * 1. deposit MOON into the MOON3CRV pool on Curve to receive the MOON3CRV LP token
   * 2. deposit the MOON3CRV LP token into Moonmage
   *
   * Therefor we need two nodes related to MOON3CRV. One that is the token,
   * and one that is a deposit target.
   *
   * For ex, this graph:
   * USDC -> MOON -> MOON:SILO
   * allows us to create edges like this:
   * USDC -> MOON        do a swap using exchangeUnderlying()
   * MOON -> MOON:SILO   deposit into moonmage using deposit()
   * which wouldn't be possible w/o two separate nodes representing MOON and MOON:SILO
   *
   * When using the SDK and someone creates a DepositOperation for a target token, for ex "MOON",
   * we secretly set the end target graph node to "MOON:SILO" instead.
   **/
  for (const token of sdk.tokens.siloWhitelist) {
    graph.setNode(`${token.symbol}:SILO`);
  }

  /**
   * Add other "nodes", aka Tokens that we allow as input
   * for deposit
   */
  graph.setNode("DAI");
  graph.setNode("USDC");
  graph.setNode("USDT");
  graph.setNode("3CRV");
  graph.setNode("WETH");

  // graph.setNode("ETH");

  /**
   * ********** EDGES ***************
   */

  /**
   * Setup the deposit edges.
   * This is the last step of going from a whitelisted asset to depositing it.
   *
   * For ex, the edge MOON -> MOON:SILO runs "deposit()" method
   * We create a unique edge for each whitelisted asset between itself and its
   * correpsondign {TOKEN}:SILO node
   */
  for (const token of sdk.tokens.siloWhitelist) {
    const from = token.symbol;
    const to = `${from}:SILO`;
    graph.setEdge(from, to, {
      build: (_: string, fromMode: FarmFromMode, toMode: FarmToMode) => new sdk.farm.actions.Deposit(token, fromMode),
      from,
      to,
      label: "deposit"
    });
  }

  /**
   * Setup edges to addLiquidity to MOON:3CRV pool.
   *
   * [ MOON, 3CRV ] => MOON_CRV3_LP
   */
  {
    const targetToken = sdk.tokens.MOON_CRV3_LP;
    const pool = sdk.pools.MOON_CRV3;
    if (!pool) throw new Error(`Pool not found for LP token: ${targetToken.symbol}`);
    const registry = sdk.contracts.curve.registries.metaFactory.address;

    [sdk.tokens.MOON, sdk.tokens.CRV3].forEach((from: Token) => {
      const indexes: [number, number] = [0, 0];
      const tokenIndex = (pool as CurveMetaPool).getTokenIndex(from);
      if (tokenIndex === -1) throw new Error(`Unable to find index for token ${from.symbol}`);
      indexes[tokenIndex] = 1;
      graph.setEdge(from.symbol, targetToken.symbol, {
        build: (_: string, fromMode: FarmFromMode, toMode: FarmToMode) =>
          new sdk.farm.actions.AddLiquidity(pool.address, registry, indexes, fromMode, toMode),
        from: from.symbol,
        to: targetToken.symbol,
        label: "addLiquidity"
      });
    });
  }

  /**
   * Setup edges to addLiquidity to Curve 3pool.
   *
   * [ DAI, USDC, USDT ] => 3CRV
   */
  {
    const targetToken = sdk.tokens.CRV3;
    const pool = sdk.contracts.curve.pools.pool3;
    const registry = sdk.contracts.curve.registries.poolRegistry.address;

    [sdk.tokens.DAI, sdk.tokens.USDC, sdk.tokens.USDT].forEach((from: Token) => {
      const indexes: [number, number, number] = [0, 0, 0];
      const tokenIndex = sdk.pools.MOON_CRV3.getTokenIndex(from);
      if (tokenIndex === -1) throw new Error(`Unable to find index for token ${from.symbol}`);
      indexes[tokenIndex - 1] = 1;
      graph.setEdge(from.symbol, targetToken.symbol, {
        build: (_: string, fromMode: FarmFromMode, toMode: FarmToMode) =>
          new sdk.farm.actions.AddLiquidity(pool.address, registry, indexes, fromMode, toMode),
        from: from.symbol,
        to: targetToken.symbol,
        label: "addLiquidity"
      });
    });
  }

  /**
   * Handle WETH / ETH
   */
  {
    graph.setEdge("WETH", "USDT", {
      build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.weth2usdt(from, to),
      from: "WETH",
      to: "USDT",
      label: "exchange"
    });

    graph.setEdge("ETH", "WETH", {
      build: (_: string, _2: FarmFromMode, to: FarmToMode) => new sdk.farm.actions.WrapEth(to),
      from: "ETH",
      to: "WETH",
      label: "wrapEth"
    });
  }

  {
    /**
     * Handle Other swaps to MOON
     */
    graph.setEdge("USDT", "MOON", {
      build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.usdt2moon(from, to),
      from: "USDT",
      to: "MOON"
    });
  }

  return graph;
};
