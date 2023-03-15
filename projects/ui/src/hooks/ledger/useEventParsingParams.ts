import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useSeason from '~/hooks/moonmage/useSeason';
import { AppState } from '~/state';
import useAccount from './useAccount';

export type EventParsingParameters = {
  account: string;
  season: BigNumber;
  farmableMoons: BigNumber;
  harvestableIndex: BigNumber;
};

export default function useEventParsingParams() {
  const account     = useAccount();
  const season      = useSeason();
  const earnedMoons = useSelector<AppState, AppState['_cosmomage']['silo']['moons']['earned']>(
    (state) => state._cosmomage.silo.moons.earned
  );
  const harvestableIndex = useSelector<AppState, AppState['_moonmage']['field']['harvestableIndex']>(
    (state) => state._moonmage.field.harvestableIndex,
  );
  return useMemo<null | EventParsingParameters>(() => {
    if (account && earnedMoons && season?.gt(0) && harvestableIndex?.gt(0)) {
      return {
        account,
        season,
        // only needed for v1
        harvestableIndex: harvestableIndex,
        farmableMoons:    earnedMoons,
      };
    }
    return null;
  }, [
    account,
    season,
    earnedMoons,
    harvestableIndex,
  ]);
}
