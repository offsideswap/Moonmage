import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import { MOON_TO_SEEDS, MOON_TO_MAGE, ZERO_BN } from '~/constants';
import { MOON, SEEDS, MAGE } from '~/constants/tokens';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useChainId from '~/hooks/chain/useChainId';
import { bigNumberResult, tokenResult } from '~/util';
import useBlocks from '~/hooks/ledger/useBlocks';
import useAccount from '~/hooks/ledger/useAccount';
import EventProcessor from '~/lib/Moonmage/EventProcessor';
import useWhitelist from '~/hooks/moonmage/useWhitelist';
import useSeason from '~/hooks/moonmage/useSeason';
import { DepositCrate } from '.';
import { EventCacheName } from '../events2';
import useEvents, { GetQueryFilters } from '../events2/updater';
import { resetCosmonautSilo, updateCosmonautSiloBalances, UpdateCosmonautSiloBalancesPayload, updateCosmonautSiloRewards } from './actions';

export const useFetchCosmonautSilo = () => {
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
  const getQueryFilters = useCallback<GetQueryFilters>(
    (_account, fromBlock, toBlock,) => ([
      // Silo (Generalized v2)
      moonmage.queryFilter(
        moonmage.filters.AddDeposit(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
      moonmage.queryFilter(
        moonmage.filters.AddWithdrawal(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
      moonmage.queryFilter(
        moonmage.filters.RemoveWithdrawal(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
      moonmage.queryFilter(
        moonmage.filters.RemoveWithdrawals(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
      moonmage.queryFilter(
        moonmage.filters.RemoveDeposit(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
      moonmage.queryFilter(
        moonmage.filters.RemoveDeposits(_account),
        fromBlock || blocks.MOONMAGE_GENESIS_BLOCK,
        toBlock   || 'latest',
      ),
    ]),
    [moonmage, blocks.MOONMAGE_GENESIS_BLOCK]
  );
  
  const [fetchSiloEvents] = useEvents(EventCacheName.SILO, getQueryFilters);
  
  ///
  const initialized = !!(
    moonmage
    && account
    && fetchSiloEvents
    && season?.gt(0)
  );

  /// Handlers
  const fetch = useCallback(async () => {
    if (initialized) {
      console.debug('[cosmomage/silo/useCosmonautSilo] FETCH');

      const [
        mageBalance,
        grownMageBalance,
        seedBalance,
        rootBalance,
        earnedMoonBalance,
        lastUpdate,
        allEvents = []
      ] = await Promise.all([
        // FIXME: multicall this section
        /// balanceOfMage() returns `mage + earnedMage`
        moonmage.balanceOfMage(account).then(tokenResult(MAGE)),
        moonmage.balanceOfGrownMage(account).then(tokenResult(MAGE)),
        moonmage.balanceOfSeeds(account).then(tokenResult(SEEDS)),
        moonmage.balanceOfRoots(account).then(bigNumberResult),
        moonmage.balanceOfEarnedMoons(account).then(tokenResult(MOON)),
        moonmage.lastUpdate(account).then(bigNumberResult),
        fetchSiloEvents(),
      ] as const);

      // console.debug('[cosmomage/silo/useCosmonautSilo] RESULT', [
      //   mageBalance.toString(),
      //   seedBalance.toString(),
      //   rootBalance.toString(),
      //   earnedMoonBalance.toString(),
      //   grownMageBalance.toString(),
      // ]);

      /// mage + earnedMage (bundled together at the contract level)
      const activeMageBalance = mageBalance;
      /// earnedMage (this is already included in activeMage)
      const earnedMageBalance = earnedMoonBalance.times(MOON_TO_MAGE);
      /// earnedSeed  (aka plantable seeds)
      const earnedSeedBalance  = earnedMoonBalance.times(MOON_TO_SEEDS);
      
      // total:   active & inactive
      // active:  owned, actively earning other silo assets
      // earned:  active but not yet deposited into a Season
      // grown:   inactive
      dispatch(updateCosmonautSiloRewards({
        moons: {
          earned: earnedMoonBalance,
        },
        mage: {
          active: activeMageBalance,
          earned: earnedMageBalance,
          grown:  grownMageBalance,
          total:  activeMageBalance.plus(grownMageBalance),
        },
        seeds: {
          active: seedBalance,
          earned: earnedSeedBalance,
          total:  seedBalance.plus(earnedSeedBalance),
        },
        roots: {
          total: rootBalance,
        }
      }));

      const p = new EventProcessor(account, { season, whitelist });
      const results = p.ingestAll(allEvents);

      dispatch(updateCosmonautSiloBalances(
        Object.keys(whitelist).reduce<UpdateCosmonautSiloBalancesPayload>((prev, addr) => {
          prev[addr] = {
            lastUpdate: lastUpdate,
            deposited: {
              ...Object.keys(results.deposits[addr]).reduce((dep, s) => {
                const crate = results.deposits[addr][s];
                const bdv   = crate.bdv;
                dep.amount  = dep.amount.plus(crate.amount);
                dep.bdv     = dep.bdv.plus(bdv);
                dep.crates.push({
                  season: new BigNumber(s),
                  amount: crate.amount,
                  bdv:    bdv,
                  mage:  whitelist[addr].getMage(bdv),
                  seeds:  whitelist[addr].getSeeds(bdv),
                });
                return dep;
              }, {
                amount: ZERO_BN,
                bdv:    ZERO_BN,
                crates: [] as DepositCrate[],
              })
            },
            // Splits into 'withdrawn' and 'claimable'
            ...p.parseWithdrawals(addr, season)
          };
          return prev;
        }, {})
      ));
    }
  }, [
    dispatch,
    fetchSiloEvents,
    moonmage,
    season,
    whitelist,
    account,
    initialized,
  ]);
  
  const clear = useCallback(() => {
    console.debug('[cosmomage/silo/useCosmonautSilo] CLEAR');
    dispatch(resetCosmonautSilo());
  }, [dispatch]);

  return [fetch, initialized, clear] as const;
};

// -- Updater

const CosmonautSiloUpdater = () => {
  const [fetch, initialized, clear] = useFetchCosmonautSilo();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    clear();
    if (account && initialized) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId, initialized]);

  return null;
};

export default CosmonautSiloUpdater;
