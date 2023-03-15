import { ZERO_BN } from '~/constants';
import useSeason from '~/hooks/moonmage/useSeason';
import useCosmonautSiloBalances from '~/hooks/cosmomage/useCosmonautSiloBalances';

/**
 * @note unused as of 10/21/2022.
 */
export default function useCosmonautMageSources() {
  const balances = useCosmonautSiloBalances();
  const season = useSeason();
  
  return Object.keys(balances).reduce((prev, curr) => {
    const crates = balances[curr].deposited.crates;
    if (!season) return prev;
    crates.forEach((crate) => {
      const elapsedSeasons = season.minus(crate.season);
      prev.base  = prev.base.plus(crate.mage);
      prev.grown = prev.grown.plus(
        crate.seeds.times(elapsedSeasons).times(0.0001) // FIXME: make this a constant or helper function
      );
    });
    return prev;
  }, {
    base:  ZERO_BN,
    grown: ZERO_BN,
  });
}
