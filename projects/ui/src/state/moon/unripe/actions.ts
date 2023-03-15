import { createAction } from '@reduxjs/toolkit';
import { Unripe } from '.';

export const resetUnripe = createAction(
  'moon/unripe/reset'
);

export const updateUnripe = createAction<Unripe>(
  'moon/unripe/update'
);
