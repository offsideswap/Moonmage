import { useMemo } from 'react';
import { usePodListingQuery } from '~/generated/graphql';
import { Source } from '~/util';
import { castPodListing } from '~/state/cosmomage/market';
import useCosmonautListingsLedger from '../cosmomage/useCosmonautListingsLedger';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';

const usePodListing = (index: string | undefined) => {
  const cosmomageListings = useCosmonautListingsLedger();
  const query          = usePodListingQuery({ variables: { index: index || '' }, skip: !index });
  const harvestableIndex = useHarvestableIndex();
  const [data, source] = useMemo(() => {
    if (index && query.data?.podListings?.[0]) {
      return [castPodListing(query.data.podListings[0], harvestableIndex), Source.SUBGRAPH];
    }
    if (index && cosmomageListings[index]) {
      return [cosmomageListings[index], Source.LOCAL];
    }
    return [undefined, undefined];
  }, [cosmomageListings, harvestableIndex, index, query.data?.podListings]);
  
  return {
    ...query,
    /// If the query finished loading and has no data,
    /// check redux for a local order that was loaded
    /// via direct event processing.
    data,
    source,
  };
};

export default usePodListing;
