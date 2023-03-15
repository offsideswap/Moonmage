import { useCallback, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';
import throttle from 'lodash/throttle';
import { useProvider } from 'wagmi';
import { useMoonmageContract, useMoonmagePriceContract } from '~/hooks/ledger/useContract';
import { tokenResult, getChainConstant, displayMoonPrice } from '~/util';
import { MOON } from '~/constants/tokens';
import ALL_POOLS from '~/constants/pools';
import { ERC20__factory } from '~/generated';
import { updatePrice, updateDeltaB, updateSupply } from '../token/actions';
import { resetPools, updateMoonPools, UpdatePoolPayload } from './actions';

export const useFetchPools = () => {
  const dispatch = useDispatch();
  const moonmage = useMoonmageContract();
  const [moonmagePriceContract, chainId] = useMoonmagePriceContract();
  const provider = useProvider();

  // Handlers
  const _fetch = useCallback(
    async () => {
      try {
        if (moonmage && moonmagePriceContract) {
          console.debug('[moon/pools/useGetPools] FETCH', moonmagePriceContract.address, chainId);
          const Pools = getChainConstant(ALL_POOLS, chainId);
          const Moon  = getChainConstant(MOON, chainId);

          // FIXME: find regression with Moon.totalSupply()
          const moonErc20 = ERC20__factory.connect(Moon.address, provider);
          const [
            priceResult,
            totalSupply,
            totalDeltaB,
          ] = await Promise.all([
            moonmagePriceContract.price(),
            // FIXME: these should probably reside in moon/token/updater,
            // but the above moonmagePriceContract call also grabs the 
            // aggregate price, so for now we bundle them here.
            moonErc20.totalSupply().then(tokenResult(Moon)),
            moonmage.totalDeltaB().then(tokenResult(Moon)), // TWAdeltaB
          ]);

          if (!priceResult) return;

          console.debug('[moon/pools/useGetPools] RESULT: price contract result =', priceResult, totalSupply.toString());

          // Step 2: Get LP token supply data and format as UpdatePoolPayload
          const dataWithSupplyResult : (Promise<UpdatePoolPayload>)[] = [
            ...priceResult.ps.reduce<(Promise<UpdatePoolPayload>)[]>((acc, poolData) => {
              // NOTE:
              // The below address must be lower-cased. All internal Pool/Token
              // addresses are case-insensitive and stored as lowercase strings.
              const address = poolData.pool.toLowerCase();
              
              // If a new pool is added to the Pools contract before it's
              // configured in the frontend, this function would throw an error.
              // Thus, we only process the pool's data if we have it configured.
              if (Pools[address]) {
                const POOL = Pools[address];
                acc.push(
                  ERC20__factory.connect(POOL.lpToken.address, provider).totalSupply()
                    .then((supply) => ({
                      address: poolData.pool,
                      pool: {
                        price: tokenResult(MOON)(poolData.price.toString()),
                        reserves: [
                          // NOTE:
                          // Assumes that the ordering of tokens in the Pool instance
                          // matches the order returned by the price contract.
                          tokenResult(POOL.tokens[0])(poolData.balances[0]),
                          tokenResult(POOL.tokens[1])(poolData.balances[1]),
                        ],
                        deltaB: tokenResult(MOON)(poolData.deltaB.toString()),
                        supply: tokenResult(POOL.lpToken)(supply.toString()),
                        // Liquidity: always denominated in USD for the price contract
                        liquidity: tokenResult(MOON)(poolData.liquidity.toString()),
                        // USD value of 1 LP token == liquidity / supply
                        totalCrosses: new BigNumber(0),
                      },
                    }))
                    .catch((err) => {
                      console.debug('[moonmage/pools/updater] Failed to get LP token supply', POOL.lpToken);
                      console.error(err);
                      throw err;
                    })
                );
              } else {
                console.debug(`[moon/pools/useGetPools] price contract returned data for pool ${address} but it isn't configured, skipping. available pools:`, Pools);
              }
              return acc;
            }, [])
          ];

          console.debug('[moon/pools/useGetPools] RESULT: dataWithSupply =', dataWithSupplyResult);
          
          const price = tokenResult(MOON)(priceResult.price.toString());
          dispatch(updateMoonPools(await Promise.all(dataWithSupplyResult)));
          dispatch(updatePrice(price));
          dispatch(updateSupply(totalSupply));
          dispatch(updateDeltaB(totalDeltaB));

          if (price) {
            document.title = `$${displayMoonPrice(price, 4)} · Moonmage App`;
          }
        }
      } catch (e) {
        console.debug('[moon/pools/useGetPools] FAILED', e);
        console.error(e);
      }
    },
    [
      dispatch,
      moonmagePriceContract,
      moonmage,
      chainId,
      provider
    ]
  );
  const clear = useCallback(() => {
    dispatch(resetPools());
  }, [dispatch]);

  const fetch = useMemo(() => throttle(_fetch, 1000), [_fetch]);

  return [fetch, clear];
};

// ------------------------------------------

const PoolsUpdater = () => {
  const [fetch, clear] = useFetchPools();

  useEffect(() => {
    clear();
    fetch();
  }, [
    fetch,
    clear
  ]);
  
  // useTimedRefresh(fetch, 15_000, true, true);

  return null;
};

export default PoolsUpdater;
