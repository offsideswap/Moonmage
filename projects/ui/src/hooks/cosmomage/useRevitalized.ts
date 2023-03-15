import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MaxBN } from '~/util';
import { MOON_TO_MAGE, MOON_TO_SEEDS, ZERO_BN, LP_TO_SEEDS } from '~/constants';
import { UNRIPE_MOON, UNRIPE_MOON_CRV3 } from '~/constants/tokens';
import { AppState } from '~/state';
import useCosmonautSiloBalances from './useCosmonautSiloBalances';
import useGetChainToken from '../chain/useGetChainToken';

/**
 * Calculate the Cosmonaut's current number of revitalized Mage and Seeds.
 */
export default function useRevitalized() {
  /// Helpers
  const getChainToken = useGetChainToken();

  /// Balances
  const balances      = useCosmonautSiloBalances();
  const moonmageSilo = useSelector<AppState, AppState['_moonmage']['silo']>((state) => state._moonmage.silo);
  const currentSeason = useSelector<AppState, AppState['_moonmage']['sun']['season']>((state) => state._moonmage.sun.season);

  return useMemo(() => {
    const urMoon      = getChainToken(UNRIPE_MOON);
    const urMoonCrv3  = getChainToken(UNRIPE_MOON_CRV3);
    const expectedBDV = (addr: string) => (balances[addr]?.deposited.amount || ZERO_BN).times(moonmageSilo.balances[addr]?.bdvPerToken || ZERO_BN);
    const actualBDV   = (addr: string) => (balances[addr]?.deposited.bdv || ZERO_BN);
    const expectedGrownBDV = (addr: string) => (balances[addr]?.deposited.crates.reduce((ss, c) =>
      ss.plus(currentSeason.minus(c.season).times(c.amount.times(moonmageSilo.balances[addr]?.bdvPerToken))), ZERO_BN) || ZERO_BN
    );
    const actualGrownBDV = (addr: string) => (balances[addr]?.deposited.crates.reduce((ss, c) => ss.plus(currentSeason.minus(c.season).times(c.bdv)), ZERO_BN) || ZERO_BN);

    // flooring at 0 prevents edge case where bdv < haircut during testing
    const delta1 = MaxBN(
      expectedBDV(urMoon.address).minus(actualBDV(urMoon.address)),
      ZERO_BN
    );
    const delta2 = MaxBN(
      expectedBDV(urMoonCrv3.address).minus(actualBDV(urMoonCrv3.address)),
      ZERO_BN
    );

    const deltaGrown1 = MaxBN(
      expectedGrownBDV(urMoon.address).minus(actualGrownBDV(urMoon.address)),
      ZERO_BN
    );
    const deltaGrown2 = MaxBN(
      expectedGrownBDV(urMoonCrv3.address).minus(actualGrownBDV(urMoonCrv3.address)),
      ZERO_BN
    );

    const seeds = delta1.times(MOON_TO_SEEDS).plus(delta2.times(LP_TO_SEEDS));
    const mage = delta1.plus(delta2).times(MOON_TO_MAGE).plus(
      deltaGrown1.times(MOON_TO_SEEDS).div('10000')).plus(
      deltaGrown2.times(LP_TO_SEEDS).div('10000'));

    // console.debug('[useRevitalized] delta1 = ', `${delta1}`);
    // console.debug('[useRevitalized] delta2 = ', `${delta2}`);
    
    return {
      revitalizedMage: mage,
      revitalizedSeeds: seeds,
    };
  }, [
    balances,
    moonmageSilo,
    currentSeason,
    getChainToken,
  ]);
}
