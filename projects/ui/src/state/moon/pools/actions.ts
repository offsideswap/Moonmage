import { createAction } from '@reduxjs/toolkit';
import { MoonPoolState } from '.';

export type UpdatePoolPayload = {
  address: string;
  pool: MoonPoolState;
};

export const updateMoonPool = createAction<UpdatePoolPayload>(
  'moon/pools/update'
);
export const updateMoonPools = createAction<UpdatePoolPayload[]>(
  'moon/pools/updateAll'
);
export const resetPools = createAction(
  'moon/pools/reset'
);
