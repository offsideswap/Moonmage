import { createAction } from '@reduxjs/toolkit';
import Token from '~/classes/Token';
import { Balance } from '.';

export type UpdateBalancePayload = {
  token: Token,
  balance: Balance;
};

export const updateBalances = createAction<UpdateBalancePayload[]>(
  'cosmomage/balances/updateMultiple'
);

export const updateBalance = createAction<UpdateBalancePayload>(
  'cosmomage/balances/update'
);

export const clearBalances = createAction(
  'cosmomage/balances/clear'
);
