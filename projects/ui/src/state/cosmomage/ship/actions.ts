import { createAction } from '@reduxjs/toolkit';
import { CosmonautShip } from '.';

export const updateCosmonautShip = createAction<CosmonautShip>(
  'cosmomage/ship/updateShip'
);

export const resetCosmonautShip = createAction(
  'cosmomage/ship/reset'
);
