import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MOON_TO_SEEDS, MOON_TO_MAGE, ONE_BN, TokenMap, ZERO_BN } from '~/constants';
import { bigNumberResult } from '~/util/Ledger';
import { tokenResult, toStringBaseUnitBN } from '~/util';
import { MOON, SEEDS, MAGE } from '~/constants/tokens';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useWhitelist from '~/hooks/moonmage/useWhitelist';
import { useGetChainConstant } from '~/hooks/chain/useChainConstant';
import { resetMoonmageSilo, updateMoonmageSilo } from './actions';
import { MoonmageSiloBalance } from './index';

export const useFetchMoonmageSilo = () => {
  const dispatch = useDispatch();
  const moonmage = useMoonmageContract();
  const WHITELIST = useWhitelist();

  /// 
  const getChainConstant = useGetChainConstant();
  const Moon = getChainConstant(MOON);

  /// Handlers
  const fetch = useCallback(async () => {
    if (moonmage) {
      console.debug('[moonmage/silo/useMoonmageSilo] FETCH: whitelist = ', WHITELIST);

      const [
        // 0
        mageTotal,
        seedsTotal,
        rootsTotal,
        earnedMoonsTotal,
        // 4
        whitelistedAssetTotals,
        // 5
        withdrawSeasons,
      ] = await Promise.all([
        // 0
        moonmage.totalMage().then(tokenResult(MAGE)),  // Does NOT include Grown Mage
        moonmage.totalSeeds().then(tokenResult(SEEDS)),  // Does NOT include Plantable Seeds
        moonmage.totalRoots().then(bigNumberResult),     // 
        moonmage.totalEarnedMoons().then(tokenResult(MOON)),
        // 4
        Promise.all(
          Object.keys(WHITELIST).map((addr) => (
            Promise.all([
              // FIXME: duplicate tokenResult optimization
              moonmage.getTotalDeposited(addr).then(tokenResult(WHITELIST[addr])),
              moonmage.getTotalWithdrawn(addr).then(tokenResult(WHITELIST[addr])),
              // MOON will always have a fixed BDV of 1, skip to save a network request
              WHITELIST[addr] === Moon 
                ? ONE_BN
                : moonmage
                    .bdv(addr, toStringBaseUnitBN(1, WHITELIST[addr].decimals))
                    .then(tokenResult(MOON))
                    .catch((err) => {
                      console.error(`Failed to fetch BDV: ${addr}`);
                      console.error(err);
                      throw err;
                    }),
            ]).then((data) => ({
              token: addr.toLowerCase(),
              deposited: data[0],
              withdrawn: data[1],
              bdvPerToken: data[2],
            }))
          ))
        ),
        // 5
        moonmage.withdrawFreeze().then(bigNumberResult),
      ] as const);

      console.debug('[moonmage/silo/useMoonmageSilo] RESULT', [mageTotal, seedsTotal, whitelistedAssetTotals[0], whitelistedAssetTotals[0].deposited.toString(), withdrawSeasons]);

      // farmableMage and farmableSeed are derived from farmableMoons
      // because 1 moon = 1 mage, 2 seeds
      const activeMageTotal = mageTotal;
      const earnedMageTotal = earnedMoonsTotal.times(MOON_TO_MAGE);
      const earnedSeedTotal  = earnedMoonsTotal.times(MOON_TO_SEEDS);

      /// Aggregate balances
      const balances = whitelistedAssetTotals.reduce((agg, curr) => {
        agg[curr.token] = {
          bdvPerToken: curr.bdvPerToken,
          deposited: {
            amount: curr.deposited,
          },
          withdrawn: {
            amount: curr.withdrawn,
          }
        };

        return agg;
      }, {} as TokenMap<MoonmageSiloBalance>);

      // total:   active & inactive
      // active:  owned, actively earning other silo assets
      // earned:  active but not yet deposited into a Season
      // grown:   inactive
      dispatch(updateMoonmageSilo({
        // Balances
        balances,
        // Rewards
        moons: {
          earned: earnedMoonsTotal,
          total:  balances[Moon.address].deposited.amount,
        },
        mage: {
          active: activeMageTotal,
          earned: earnedMageTotal,
          grown:  ZERO_BN,
          total:  activeMageTotal.plus(ZERO_BN),
        },
        seeds: {
          active: seedsTotal,
          earned: earnedSeedTotal,
          total:  seedsTotal.plus(earnedSeedTotal),
        },
        roots: {
          total:  rootsTotal,
        },
        // Metadata
        withdrawSeasons: withdrawSeasons
      }));
    }
  }, [
    moonmage,
    WHITELIST,
    dispatch,
    Moon,
  ]);

  const clear = useCallback(() => {
    console.debug('[moonmage/silo/useMoonmageSilo] CLEAR');
    dispatch(resetMoonmageSilo());
  }, [dispatch]);

  return [fetch, clear] as const;
};

// -- Updater

const MoonmageSiloUpdater = () => {
  const [fetch, clear] = useFetchMoonmageSilo();

  useEffect(() => {
    clear();
    fetch();
  }, [clear, fetch]);

  return null;
};

export default MoonmageSiloUpdater;
