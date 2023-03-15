import { SupportedChainId } from './chains';

/**
 * Unofficial testnets require a custom RPC URL.
 * Ropsten, Goerli etc. are supported by Alchemy.
 */
 export const TESTNET_RPC_ADDRESSES : { [chainId: number] : string } = {
  [SupportedChainId.LOCALHOST]: 'http://localhost:8545',
  [SupportedChainId.CUJO]:      'https://moon-rpc.treetree.finance',
};

export const MOONMAGE_SUBGRAPH_ADDRESSES : { [chainId: number] : string } = {
  [SupportedChainId.MAINNET]:   'https://graph.node.moon.money/subgraphs/name/moonmage',
  // [SupportedChainId.MAINNET]:   'https://api.thegraph.com/subgraphs/name/cujowolf/moonmage',
  [SupportedChainId.LOCALHOST]: 'https://api.thegraph.com/subgraphs/name/cujowolf/moonmage-dev-replanted',
  [SupportedChainId.CUJO]:      'http://graph.playgrounds.academy/subgraphs/name/moonmage',
};

/// The MOON subgraph is slow to index because it tracks many events.
/// To speed up development time, Moon metrics are provided from a separate subgraph.
export const MOON_SUBGRAPH_ADDRESSES : { [chainId: number] : string } = {
  [SupportedChainId.MAINNET]:   'https://api.thegraph.com/subgraphs/name/cujowolf/moon',
  [SupportedChainId.LOCALHOST]: 'https://api.thegraph.com/subgraphs/name/cujowolf/moon',
  [SupportedChainId.CUJO]:      'https://api.thegraph.com/subgraphs/name/cujowolf/moon',
};
