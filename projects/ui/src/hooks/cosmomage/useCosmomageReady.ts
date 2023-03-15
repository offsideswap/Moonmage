import isEmpty from 'lodash/isEmpty';
import useCosmonautBalances from './useCosmonautBalances';

/**
 * Ensure we've loaded a Cosmonaut's balances.
 */
export default function useCosmonautReady() {
  const balances = useCosmonautBalances();
  return !isEmpty(balances);
}
