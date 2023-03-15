import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { MoonmageField } from '.';

export const resetMoonmageField = createAction(
  'moonmage/field/reset'
);

export const updateMoonmageField = createAction<MoonmageField>(
  'moonmage/field/update'
);

export const updateHarvestableIndex = createAction<BigNumber>(
  'moonmage/field/updateHarvestableIndex'
);
