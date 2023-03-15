import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useLatestApyQuery } from '~/generated/graphql';

type APY = {
  moon: BigNumber;
  mage: BigNumber;
}

type APYs = {
  moonsPerSeasonEMA: BigNumber;
  bySeeds: {
    '2': APY;
    '4': APY;
  }
}

export default function useAPY() {
  const query = useLatestApyQuery({ 
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });
  return useMemo(() => {
    if (query.data?.siloYields?.[0]) {
      const siloYield = query.data.siloYields[0];
      return {
        loading: query.loading,
        error: undefined,
        data: {
          moonsPerSeasonEMA: new BigNumber(siloYield.moonsPerSeasonEMA),
          bySeeds: {
            2: {
              moon:  new BigNumber(siloYield.twoSeedMoonAPY),
              mage: new BigNumber(siloYield.twoSeedMageAPY),
            },
            4: {
              moon:  new BigNumber(siloYield.fourSeedMoonAPY),
              mage: new BigNumber(siloYield.fourSeedMageAPY),
            }
          }
        } as APYs
      };
    }
    return {
      loading: query.loading,
      error: query.error,
      data: undefined,
    };
  }, [query]);
}
