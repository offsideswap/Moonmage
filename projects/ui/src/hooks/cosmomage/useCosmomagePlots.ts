import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useCosmonautPlots = () => useSelector<AppState, AppState['_cosmomage']['field']['plots']>((state) => state._cosmomage.field.plots);

export default useCosmonautPlots;
