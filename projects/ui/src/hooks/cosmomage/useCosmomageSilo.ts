import { useSelector } from 'react-redux';
import { AppState } from '~/state';

export default function useCosmonautSilo() {
  return useSelector<AppState, AppState['_cosmomage']['silo']>((state) => state._cosmomage.silo);
}
