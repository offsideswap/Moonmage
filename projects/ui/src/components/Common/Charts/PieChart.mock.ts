import { SupportedChainId } from '~/constants/chains';
import { MOON, MOON_CRV3_LP, MOON_ETH_UNIV2_LP } from '~/constants/tokens';

const m = SupportedChainId.MAINNET;

export const mockLiquidityByToken = {
  [MOON[m].address]: 10,
  [MOON_ETH_UNIV2_LP[m].address]: 24,
  [MOON_CRV3_LP[m].address]: 66,
};

export type LiquidityDatum = {
  label: string;
  value: number;
}

export default Object.keys(mockLiquidityByToken).map((key) => ({
  label: key.substring(0, 6),
  value: mockLiquidityByToken[key],
}));
