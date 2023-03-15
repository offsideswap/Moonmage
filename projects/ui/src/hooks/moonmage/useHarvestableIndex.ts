import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useHarvestableIndex = () => useSelector<AppState, AppState['_moonmage']['field']['harvestableIndex']>(
  (state) => state._moonmage.field.harvestableIndex,
);

export default useHarvestableIndex;
