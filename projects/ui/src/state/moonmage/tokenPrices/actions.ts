import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const updateTokenPrices = createAction<{ [address: string]: BigNumber }>(
  'moonmage/tokenPrcies/updatePrices'
);

export const resetTokenPrices = createAction(
  'moonmage/tokenPrices/resetPrices'
);
