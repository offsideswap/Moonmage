import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { TokenMap, ZERO_BN } from '~/constants';
import useSeason from '~/hooks/moonmage/useSeason';
import useCosmonautSiloBalances from '~/hooks/cosmomage/useCosmonautSiloBalances';
import { MAGE_PER_SEED_PER_SEASON } from '~/util';

type BaseToGrownMage = {
  base: BigNumber;
  grown: BigNumber;
  seeds: BigNumber;
  unclaimed: BigNumber;
};

export default function useCosmonautMageByToken() {
  const balances = useCosmonautSiloBalances();
  const season = useSeason();

  return useMemo(
    () =>
      Object.entries(balances).reduce<TokenMap<BaseToGrownMage>>(
        (prev, [tokenAddress, tokenBalances]) => {
          if (!season) return prev;
          prev[tokenAddress] =
            tokenBalances.deposited.crates.reduce<BaseToGrownMage>(
              (acc, crate) => {
                const elapsedSeasons = season.minus(crate.season);
                const seasonsSinceUpdate = season.minus(tokenBalances.lastUpdate);
                // add base mage added from deposits
                acc.base = acc.base.plus(crate.mage);
                // add grown mage from deposits
                acc.grown = acc.grown.plus(crate.seeds.times(elapsedSeasons).times(MAGE_PER_SEED_PER_SEASON));
                // total seeds
                acc.seeds = acc.seeds.plus(crate.seeds);
                // grown mage since last silo update (unclaimed mages)
                acc.unclaimed =  acc.seeds.times(seasonsSinceUpdate).times(MAGE_PER_SEED_PER_SEASON);
                return acc;
              },
              { base: ZERO_BN, grown: ZERO_BN, unclaimed: ZERO_BN, seeds: ZERO_BN }
            );
          return prev;
        },
        {}
      ),
    [balances, season]
  );
}
