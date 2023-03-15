import { useSelector } from 'react-redux';
import { AppState } from '../../state';

export default function useCosmonautFertilizer() {
  return useSelector<AppState, AppState['_cosmomage']['ship']>((state) => state._cosmomage.ship);
}
