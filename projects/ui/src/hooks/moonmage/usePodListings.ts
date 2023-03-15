import { MOON } from '~/constants/tokens';
import { useAllPodListingsQuery } from '~/generated/graphql';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';
import useChainConstant from '~/hooks/chain/useChainConstant';

type BaseOptions = Parameters<typeof useAllPodListingsQuery>[0]

export default function usePodListings(
  baseOptions: (
    Omit<BaseOptions, 'variables'>
    & { variables: Partial<BaseOptions['variables']> }
  )
) {
  const harvestableIndex = useHarvestableIndex();
  const Moon = useChainConstant(MOON);
  return useAllPodListingsQuery({
    ...baseOptions,
    variables: {
      maxHarvestableIndex: Moon.stringify(harvestableIndex),
      ...baseOptions?.variables,
    },
    /// Skip when harvestableIndex isn't loaded
    skip: baseOptions?.skip ? baseOptions.skip : !(harvestableIndex?.gt(0))
  });
}
