import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useCosmonautOrdersLedger = () => useSelector<AppState, AppState['_cosmomage']['market']['orders']>(
  (state) => state._cosmomage.market.orders,
);

export default useCosmonautOrdersLedger;
