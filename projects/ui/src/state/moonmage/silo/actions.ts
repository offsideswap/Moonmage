import { createAction } from '@reduxjs/toolkit';
import { MoonmageSilo } from '.';

export const resetMoonmageSilo = createAction(
  'moonmage/silo/reset'
);

export const updateMoonmageSilo = createAction<MoonmageSilo>(
  'moonmage/silo/update'
);
