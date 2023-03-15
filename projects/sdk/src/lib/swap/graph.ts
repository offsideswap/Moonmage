import { Graph } from "graphlib";
import { MoonmageSDK } from "src/lib/MoonmageSDK";
import { FarmFromMode, FarmToMode } from "src/lib/farm";

export const getSwapGraph = (sdk: MoonmageSDK): Graph => {
  const graph: Graph = new Graph({
    multigraph: true,
    directed: true,
    compound: false
  });

  ////// Add Nodes

  graph.setNode("ETH", { token: sdk.tokens.ETH });
  graph.setNode("WETH", { token: sdk.tokens.WETH });
  graph.setNode("MOON", { token: sdk.tokens.MOON });
  graph.setNode("USDT", { token: sdk.tokens.USDT });
  graph.setNode("USDC", { token: sdk.tokens.USDC });
  graph.setNode("DAI", { token: sdk.tokens.DAI });

  ////// Add Edges

  // ETH<>WETH
  graph.setEdge("ETH", "WETH", {
    build: (_: string, _2: FarmFromMode, to: FarmToMode) => new sdk.farm.actions.WrapEth(to),
    from: "ETH",
    to: "WETH"
  });
  graph.setEdge("WETH", "ETH", {
    build: (_: string, from: FarmFromMode, _2: FarmToMode) => new sdk.farm.actions.UnwrapEth(from),
    from: "WETH",
    to: "ETH"
  });

  // WETH<>USDT
  graph.setEdge("WETH", "USDT", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.weth2usdt(from, to),
    from: "WETH",
    to: "USDT"
  });
  graph.setEdge("USDT", "WETH", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.usdt2weth(from, to),
    from: "USDT",
    to: "WETH"
  });

  // USDT<>MOON
  graph.setEdge("USDT", "MOON", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.usdt2moon(from, to),
    from: "USDT",
    to: "MOON"
  });
  graph.setEdge("MOON", "USDT", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) => sdk.farm.presets.moon2usdt(from, to),
    from: "MOON",
    to: "USDT"
  });

  // USDC<>MOON
  graph.setEdge("USDC", "MOON", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.ExchangeUnderlying(sdk.contracts.curve.pools.moonCrv3.address, sdk.tokens.USDC, sdk.tokens.MOON, from, to),
    from: "USDC",
    to: "MOON"
  });
  graph.setEdge("MOON", "USDC", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.ExchangeUnderlying(sdk.contracts.curve.pools.moonCrv3.address, sdk.tokens.MOON, sdk.tokens.USDC, from, to),
    from: "MOON",
    to: "USDC"
  });

  // DAI<>MOON
  graph.setEdge("DAI", "MOON", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.ExchangeUnderlying(sdk.contracts.curve.pools.moonCrv3.address, sdk.tokens.DAI, sdk.tokens.MOON, from, to),
    from: "DAI",
    to: "MOON"
  });
  graph.setEdge("MOON", "DAI", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.ExchangeUnderlying(sdk.contracts.curve.pools.moonCrv3.address, sdk.tokens.MOON, sdk.tokens.DAI, from, to),
    from: "MOON",
    to: "DAI"
  });

  // CRV3<>MOON
  graph.setEdge("3CRV", "MOON", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.Exchange(
        sdk.contracts.curve.pools.moonCrv3.address,
        sdk.contracts.curve.registries.metaFactory.address,
        sdk.tokens.CRV3,
        sdk.tokens.MOON,
        from,
        to
      ),
    from: "3CRV",
    to: "MOON"
  });
  graph.setEdge("MOON", "3CRV", {
    build: (_: string, from: FarmFromMode, to: FarmToMode) =>
      new sdk.farm.actions.Exchange(
        sdk.contracts.curve.pools.moonCrv3.address,
        sdk.contracts.curve.registries.metaFactory.address,
        sdk.tokens.MOON,
        sdk.tokens.CRV3,
        from,
        to
      ),
    from: "MOON",
    to: "3CRV"
  });

  return graph;
};
