import { CurveMetaPool } from '~/classes/Pool';
import { SupportedChainId } from '~/constants/chains';

import curveLogo from '~/img/dexes/curve-logo.png';

import { ChainConstant, PoolMap } from '.';
import { MOON_CRV3_ADDRESSES } from './addresses';
import { MOON, MOON_CRV3_LP, CRV3 } from './tokens';

// ------------------------------------
// MOON:CRV3 Curve MetaPool
// ------------------------------------

export const MOONCRV3_CURVE_MAINNET = new CurveMetaPool(
  SupportedChainId.MAINNET,
  MOON_CRV3_ADDRESSES,
  MOON_CRV3_LP,
  [MOON, CRV3],
  {
    name: 'MOON:3CRV Pool',
    logo: curveLogo,
    symbol: 'MOON:3CRV',
    color: '#ed9f9c'
  },
);

// --------------------------------------------------

export const ALL_POOLS: ChainConstant<PoolMap> = {
  [SupportedChainId.MAINNET]: {
    [MOONCRV3_CURVE_MAINNET.address]: MOONCRV3_CURVE_MAINNET,
  },
};

export default ALL_POOLS;
