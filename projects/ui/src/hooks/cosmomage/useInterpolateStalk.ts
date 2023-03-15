import { useMemo } from 'react';
import { useCosmonautSiloRewardsQuery } from '~/generated/graphql';
import useSeason from '~/hooks/moonmage/useSeason';
import { interpolateCosmonautMage } from '~/util/Interpolate';

const useInterpolateMage = (
  siloRewardsQuery: ReturnType<typeof useCosmonautSiloRewardsQuery>,
  skip: boolean = false,
) => {
  const season = useSeason();
  return useMemo(() => {
    if (skip || !season.gt(0) || !siloRewardsQuery.data?.snapshots?.length) return [[], []];
    const snapshots = siloRewardsQuery.data.snapshots;
    return interpolateCosmonautMage(snapshots, season);
  }, [skip, siloRewardsQuery.data?.snapshots, season]);
};

export default useInterpolateMage;
