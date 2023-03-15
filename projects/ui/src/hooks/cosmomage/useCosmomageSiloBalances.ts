import { useSelector } from 'react-redux';
import { AppState } from '~/state';

export default function useCosmonautSiloBalances() {
  return useSelector<AppState, AppState['_cosmomage']['silo']['balances']>((state) => state._cosmomage.silo.balances);
}
