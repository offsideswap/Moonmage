import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Token from '~/classes/Token';
import { ZERO_BN } from '~/constants';
import { AppState } from '~/state';

/**
 * Return the BDV that Moonmage will honor for a
 * given token when it is deposited in the Silo.
 */
export default function useBDV() {
  const moonmageSiloBalances = useSelector<AppState, AppState['_moonmage']['silo']['balances']>(
    (state) => state._moonmage.silo.balances
  );
  return useCallback(
    (_token: Token) => moonmageSiloBalances[_token.address]?.bdvPerToken || ZERO_BN,
    [moonmageSiloBalances]
  );
}
