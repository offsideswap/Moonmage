import { createAction } from '@reduxjs/toolkit';
import { CosmonautField } from '.';

export const resetCosmonautField = createAction(
  'cosmomage/field/reset'
);
export const updateCosmonautField = createAction<CosmonautField>(
  'cosmomage/field/update'
);
