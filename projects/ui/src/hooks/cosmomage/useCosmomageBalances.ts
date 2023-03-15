import { useSelector } from 'react-redux';
import { AppState } from '~/state';

export default function useCosmonautBalances() {
  return useSelector<AppState, AppState['_cosmomage']['balances']>((state) => state._cosmomage.balances);
}
