import BigNumber from 'bignumber.js';
import { PlotMap } from '~/util';

/// FIXME: "Field" or "CosmonautField";
export type CosmonautField = {
  plots: PlotMap<BigNumber>;
  pods: BigNumber;
  harvestablePlots: PlotMap<BigNumber>;
  harvestablePods: BigNumber;
}
