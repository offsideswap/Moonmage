import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useCosmonautListingsLedger = () => useSelector<AppState, AppState['_cosmomage']['market']['listings']>(
  (state) => state._cosmomage.market.listings,
);

export default useCosmonautListingsLedger;
