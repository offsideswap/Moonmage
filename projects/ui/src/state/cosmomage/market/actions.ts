import { createAction } from '@reduxjs/toolkit';
import { CosmomageStation } from '.';

export const resetCosmomageStation = createAction(
  'cosmomage/market/reset'
);
export const updateCosmomageStation = createAction<CosmomageStation>(
  'cosmomage/market/update'
);
