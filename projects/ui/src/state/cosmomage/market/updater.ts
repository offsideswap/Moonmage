import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useChainId from '~/hooks/chain/useChainId';
import useBlocks from '~/hooks/ledger/useBlocks';
import useAccount from '~/hooks/ledger/useAccount';
import useWhitelist from '~/hooks/moonmage/useWhitelist';
import useSeason from '~/hooks/moonmage/useSeason';
import { EventCacheName } from '../events2';
import useEvents, { GetQueryFilters } from '../events2/updater';
import { resetCosmomageStation } from './actions';

export const useFetchCosmomageStation = () => {
  /// Helpers
  const dispatch  = useDispatch();

  /// Contracts
  const moonmage = useMoonmageContract();

  /// Data
  const account   = useAccount();
  const blocks    = useBlocks();
  const whitelist = useWhitelist();
  const season    = useSeason();

  /// Events
  const getQueryFilters = useCallback<GetQueryFilters>((
    _account,
    fromBlock,
    toBlock,
  ) => [
    moonmage.queryFilter(
      moonmage.filters.PodListingCreated(_account),
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters['PodListingCancelled(address,uint256)'](_account),
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    // this account had a listing filled
    moonmage.queryFilter(
      moonmage.filters.PodListingFilled(null, _account), // to
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.PodOrderCreated(_account), 
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.PodOrderCancelled(_account), 
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.PodOrderFilled(null, _account), // to
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
  ], [
    blocks,
    moonmage,
  ]);
  
  const [fetchMarketEvents] = useEvents(EventCacheName.MARKET, getQueryFilters);

  const initialized = (
    account
    && fetchMarketEvents
  );

  /// Handlers
  const fetch = useCallback(async () => {
    // if (initialized) {
    //   const allEvents = await fetchMarketEvents();
    //   if (!allEvents) return;
    //   const p = new EventProcessor(account, { season, whitelist });
    //   p.ingestAll(allEvents);

    //   // Update Field
    //   dispatch(updateCosmomageStation({
    //     listings: p.listings,
    //     orders: p.orders,
    //   }));
    // }
  }, []);
  
  const clear = useCallback(() => {
    console.debug('[cosmomage/silo/useCosmonautSilo] CLEAR');
    dispatch(resetCosmomageStation());
  }, [dispatch]);

  return [fetch, Boolean(initialized), clear] as const;
};

// -- Updater

const CosmomageStationUpdater = () => {
  const [fetch, initialized, clear] = useFetchCosmomageStation();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    clear();
    if (account && initialized) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId, initialized]);

  return null;
};

export default CosmomageStationUpdater;
