import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { Token } from '~/classes';

export type UpdateAllowancePayload = {
  contract: string;
  token: Token,
  allowance: BigNumber
};

export const updateAllowances = createAction<UpdateAllowancePayload[]>(
  'cosmomage/allowances/updateAllowances'
);

export const updateAllowance = createAction<UpdateAllowancePayload>(
  'cosmomage/allowances/updateAllowance'
);

export const clearAllowances = createAction(
  'cosmomage/allowances/clearAllowances'
);
