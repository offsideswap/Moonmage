import { useSelector } from 'react-redux';
import { AppState } from '~/state';

export default function useSeason() {
  return useSelector<AppState, AppState['_moonmage']['sun']['season']>((state) => state._moonmage.sun.season);
}
