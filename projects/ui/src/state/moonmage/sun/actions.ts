import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { Sun } from '.';

export const updateSeason = createAction<BigNumber>(
  'moonmage/sun/updateSeason'
);

export const updateSeasonTime = createAction<BigNumber>(
  'moonmage/sun/updateSeasonTime'
);

export const setNextSunrise = createAction<Sun['sunrise']['next']>(
  'moonmage/sun/setNextSunrise'
);

export const setAwaitingSunrise = createAction<Sun['sunrise']['awaiting']>(
  'moonmage/sun/setAwaitingSunrise'
);

export const setRemainingUntilSunrise = createAction<Sun['sunrise']['remaining']>(
  'moonmage/sun/setRemainingUntilSunrise'
);

export const resetSun = createAction(
  'moonmage/sun/reset'
);
