import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Token from '~/classes/Token';
import usePrice from '~/hooks/moonmage/usePrice';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import { MOON, MOON_CRV3_LP, UNRIPE_MOON, UNRIPE_MOON_CRV3 } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { AppState } from '~/state';
import { Settings } from '~/state/app';

/**
 * FIXME: this function is being called very frequently
 */
const useSiloTokenToFiat = () => {
  ///
  const getChainToken = useGetChainToken();
  const Moon          = getChainToken(MOON);
  const MoonCrv3      = getChainToken(MOON_CRV3_LP);
  const urMoon        = getChainToken(UNRIPE_MOON);
  const urMoonCrv3    = getChainToken(UNRIPE_MOON_CRV3);

  ///
  const moonPools     = useSelector<AppState, AppState['_moon']['pools']>((state) => state._moon.pools);
  const unripe        = useSelector<AppState, AppState['_moon']['unripe']>((state) => state._moon.unripe);
  const price         = usePrice();
  
  return useCallback((
    _token: Token,
    _amount: BigNumber,
    _denomination: Settings['denomination'] = 'usd',
    _chop: boolean = true,
  ) => {
    if (!_amount) return ZERO_BN;

    /// For Moons, use the aggregate Moon price.
    if (_token === Moon) {
      return _denomination === 'bdv' ? _amount : _amount.times(price);
    }

    /// For Unripe assets
    if (_token === urMoon) {
      const choppedMoons = _chop
        ? _amount.times(unripe[urMoon.address]?.chopRate || ZERO_BN)
        : _amount;
      return _denomination === 'bdv' ? choppedMoons : choppedMoons.times(price);
    }

    /// For everything else, use the value of the LP token via the moonPool liquidity/supply ratio.
    /// FIXME: the price contract provides this directly now to save a calculation on the frontend.
    let _poolAddress = _token.address;
    let _amountLP    = _amount;

    /// For Unripe Moon:3CRV, assume we chop to Ripe Moon:3CRV
    if (_token === urMoonCrv3) {
      _poolAddress = MoonCrv3.address;
      _amountLP    = _chop 
        ? _amount.times(unripe[urMoonCrv3.address]?.chopRate || ZERO_BN) 
        : _amount;
    }

    /// Grab pool data
    const pool = moonPools[_poolAddress];
    if (!pool || !pool?.liquidity || !pool?.supply) return ZERO_BN;

    const usd = _amountLP.div(pool.supply).times(pool.liquidity); // usd value; liquidity
    return _denomination === 'bdv' ? usd.div(price) : usd;
  }, [
    Moon, 
    MoonCrv3.address, 
    moonPools, 
    price, 
    unripe, 
    urMoon, 
    urMoonCrv3
  ]);
};

export default useSiloTokenToFiat;
