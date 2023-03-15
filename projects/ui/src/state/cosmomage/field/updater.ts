import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useChainId from '~/hooks/chain/useChainId';
import useBlocks from '~/hooks/ledger/useBlocks';
import useAccount from '~/hooks/ledger/useAccount';
import EventProcessor from '~/lib/Moonmage/EventProcessor';
import useWhitelist from '~/hooks/moonmage/useWhitelist';
import useSeason from '~/hooks/moonmage/useSeason';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';
import { EventCacheName } from '../events2';
import useEvents, { GetQueryFilters } from '../events2/updater';
import { updateCosmonautField, resetCosmonautField } from './actions';

export const useFetchCosmonautField = () => {
  /// Helpers
  const dispatch  = useDispatch();

  /// Contracts
  const moonmage = useMoonmageContract();

  /// Data
  const account   = useAccount();
  const blocks    = useBlocks();
  const whitelist = useWhitelist();
  const season    = useSeason();
  const harvestableIndex = useHarvestableIndex();

  /// Events
  const getQueryFilters = useCallback<GetQueryFilters>((
    _account,
    fromBlock,
    toBlock,
  ) => [
    moonmage.queryFilter(
      moonmage.filters['Sow(address,uint256,uint256,uint256)'](_account),
      fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.Harvest(_account),
      fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.PlotTransfer(_account, null), // from
      fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
      toBlock   || 'latest',
    ),
    moonmage.queryFilter(
      moonmage.filters.PlotTransfer(null, _account), // to
      fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
      toBlock   || 'latest',
    ),
  ], [
    blocks,
    moonmage,
  ]);
  
  const [fetchFieldEvents] = useEvents(EventCacheName.FIELD, getQueryFilters);

  const initialized = (
    account
    && fetchFieldEvents
    && harvestableIndex.gt(0) // harvestedableIndex is initialized to 0
  );

  /// Handlers
  const fetch = useCallback(async () => {
    if (initialized) {
      const allEvents = await fetchFieldEvents();
      if (!allEvents) return;

      const p = new EventProcessor(account, { season, whitelist });
      p.ingestAll(allEvents);

      dispatch(updateCosmonautField(
        p.parsePlots(harvestableIndex)
      ));
    }
  }, [
    dispatch,
    fetchFieldEvents,
    initialized,
    // v2
    season,
    whitelist,
    account,
    harvestableIndex
  ]);
  
  const clear = useCallback(() => {
    console.debug('[cosmomage/silo/useCosmonautSilo] CLEAR');
    dispatch(resetCosmonautField());
  }, [dispatch]);

  return [fetch, Boolean(initialized), clear] as const;
};

// -- Updater

const CosmonautFieldUpdater = () => {
  const [fetch, initialized, clear] = useFetchCosmonautField();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    clear();
    if (account && initialized) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId, initialized]);

  return null;
};

export default CosmonautFieldUpdater;
