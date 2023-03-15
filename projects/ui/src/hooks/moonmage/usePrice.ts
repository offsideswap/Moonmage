import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const usePrice = () => useSelector<AppState, AppState['_moon']['token']['price']>((state) => state._moon.token.price);

export default usePrice;
