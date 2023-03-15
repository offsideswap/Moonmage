import { createAction } from '@reduxjs/toolkit';
import { MoonmageShip } from '.';

export const resetShip = createAction(
  'moonmage/ship/reset'
);

export const updateShip = createAction<MoonmageShip>(
  'moonmage/ship/update'
);
