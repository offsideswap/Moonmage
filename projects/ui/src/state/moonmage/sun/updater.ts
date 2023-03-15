import { DateTime } from 'luxon';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useSeason from '~/hooks/moonmage/useSeason';
import { AppState } from '~/state';
import { bigNumberResult } from '~/util/Ledger';
import { getNextExpectedSunrise } from '.';
import {
  resetSun,
  setAwaitingSunrise,
  setNextSunrise,
  setRemainingUntilSunrise,
  updateSeason,
  updateSeasonTime
} from './actions';

export const useSun = () => {
  const dispatch = useDispatch();
  const moonmage = useMoonmageContract();

  const fetch = useCallback(async () => {
    try {
      if (moonmage) {
        console.debug(`[moonmage/sun/useSun] FETCH (contract = ${moonmage.address})`);
        const [
          season, seasonTime
        ] = await Promise.all([
          moonmage.season().then(bigNumberResult),       /// the current season  
          moonmage.seasonTime().then(bigNumberResult),   /// the season that it could be if sunrise was called
        ] as const);
        console.debug(`[moonmage/sun/useSun] RESULT: season = ${season}, seasonTime = ${seasonTime}`);
        dispatch(updateSeason(season));
        dispatch(updateSeasonTime(seasonTime));
        return [season, seasonTime] as const;
      }
      return [undefined, undefined] as const;
    } catch (e) {
      console.debug('[moonmage/sun/useSun] FAILED', e);
      console.error(e);
      return [undefined, undefined] as const;
    }
  }, [
    dispatch,
    moonmage,
  ]);
  
  const clear = useCallback(() => {
    console.debug('[cosmomage/silo/useSun] clear');
    dispatch(resetSun());
  }, [dispatch]);

  return [fetch, clear] as const;
};

const SunUpdater = () => {
  const [fetch, clear] = useSun();
  const dispatch  = useDispatch();
  const season    = useSeason();
  const next      = useSelector<AppState, DateTime>((state) => state._moonmage.sun.sunrise.next);
  const awaiting  = useSelector<AppState, boolean>((state) => state._moonmage.sun.sunrise.awaiting);
  
  useEffect(() => {
    if (awaiting === false) {
      /// Setup timer. Count down from now until the start
      /// of the next hour; when the timer is zero, set
      /// `awaiting = true`.
      const i = setInterval(() => {
        const _remaining = next.diffNow();
        if (_remaining.as('seconds') <= 0) {
          dispatch(setAwaitingSunrise(true));
        } else {
          dispatch(setRemainingUntilSunrise(_remaining));
        }
      }, 1000);
      return () => clearInterval(i);
    } 
    /// When awaiting sunrise, check every 3 seconds to see
    /// if the season has incremented bumped.
    const i = setInterval(() => {
      (async () => {
        const [newSeason] = await fetch();
        if (newSeason?.gt(season)) {
          const _next = getNextExpectedSunrise();
          dispatch(setAwaitingSunrise(false));
          dispatch(setNextSunrise(_next));
          dispatch(setRemainingUntilSunrise(_next.diffNow()));
          toast.success(`The Sun has risen. It is now Season ${newSeason.toString()}.`);
        }
      })();
    }, 3000);
    return () => clearInterval(i);
  }, [dispatch, awaiting, season, next, fetch]);

  // Fetch when chain changes
  useEffect(() => {
    clear();
    fetch();
  }, [
    fetch,
    clear
  ]);

  return null;
};

export default SunUpdater;
