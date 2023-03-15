import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useCosmonautField = () => useSelector<AppState, AppState['_cosmomage']['field']>((state) => state._cosmomage.field);

export default useCosmonautField;
