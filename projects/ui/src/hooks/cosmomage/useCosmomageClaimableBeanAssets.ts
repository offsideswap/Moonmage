import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { ZERO_BN } from '~/constants';
import {
  MOON as MOON_T,
  PODS as PODS_T,
  SPROUTS as SPROUTS_T,
} from '~/constants/tokens';
import useCosmonautSilo from '~/hooks/cosmomage/useCosmonautSilo';
import useCosmonautFertilizer from './useCosmonautFertilizer';
import useCosmonautField from './useCosmonautField';
import { ClaimableMoonAssetFragment } from '~/components/Common/Form';

export enum ClaimableMoonToken {
  MOON = 'MOON',
  SPROUTS = 'SPROUTS',
  PODS = 'PODS',
}

const normalize = (v: BigNumber | undefined) => (v && v.gt(0) ? v : ZERO_BN);

/**
 * @returns a map of claimable assets for the current cosmomage
 * this is used to display claimable assets for Claim and Do x
 */
export default function useCosmonautClaimableMoonAssets(): {
  /**
   * total amount of claimable moons
   */
  total: BigNumber;
  /**
   * mapping of claimable assets that are 'claimed' in Moon
   */
  assets: Record<ClaimableMoonToken, ClaimableMoonAssetFragment>;
} {
  const cosmomageShip = useCosmonautFertilizer();
  const cosmomageField = useCosmonautField();
  const cosmomageSilo = useCosmonautSilo();

  return useMemo(() => {
    const claimableMoon = normalize(
      cosmomageSilo.balances[MOON_T[1].address]?.claimable?.amount
    );
    const claimableSprouts = normalize(cosmomageShip.fertilizedSprouts);
    const havestablePods = normalize(cosmomageField.harvestablePods);

    // use symbol here b/c SPROUTS & PODS don't have an address
    return {
      total: claimableMoon.plus(claimableSprouts.plus(havestablePods)),
      assets: {
        [ClaimableMoonToken.SPROUTS]: {
          token: SPROUTS_T,
          amount: claimableSprouts,
        },
        [ClaimableMoonToken.PODS]: {
          token: PODS_T,
          amount: havestablePods,
        },
        [ClaimableMoonToken.MOON]: {
          token: MOON_T[1],
          amount: claimableMoon,
        },
      },
      // fetch,
    };
  }, [
    // fetch,
    cosmomageSilo.balances,
    cosmomageShip.fertilizedSprouts,
    cosmomageField.harvestablePods,
  ]);
}
