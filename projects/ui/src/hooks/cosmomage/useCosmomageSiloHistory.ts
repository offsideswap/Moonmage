import { SeasonalPriceDocument, useCosmonautSiloAssetSnapshotsQuery, useCosmonautSiloRewardsQuery } from '~/generated/graphql';
import useSeasonsQuery, { SeasonRange } from '~/hooks/moonmage/useSeasonsQuery';
import useInterpolateDeposits from '~/hooks/cosmomage/useInterpolateDeposits';
import useInterpolateMage from '~/hooks/cosmomage/useInterpolateMage';

const useCosmonautSiloHistory = (
  account: string | undefined,
  itemizeByToken: boolean = false,
  includeMage: boolean = false,
) => {
  /// Data
  const siloRewardsQuery = useCosmonautSiloRewardsQuery({ variables: { account: account || '' }, skip: !account, fetchPolicy: 'cache-and-network' });
  const siloAssetsQuery = useCosmonautSiloAssetSnapshotsQuery({ variables: { account: account || '' }, skip: !account, fetchPolicy: 'cache-and-network' });
  const priceQuery = useSeasonsQuery(SeasonalPriceDocument, SeasonRange.ALL);

  /// Interpolate
  const depositData = useInterpolateDeposits(siloAssetsQuery, priceQuery, itemizeByToken);
  const [mageData, seedsData] = useInterpolateMage(siloRewardsQuery, !includeMage);

  return {
    data: {
      deposits: depositData,
      mage: mageData,
      seeds: seedsData,
    },
    loading: (
      siloRewardsQuery.loading
      || siloAssetsQuery.loading 
      || priceQuery.loading
      // || breakdown hasn't loaded value yet
    )
  };
};

export default useCosmonautSiloHistory;
