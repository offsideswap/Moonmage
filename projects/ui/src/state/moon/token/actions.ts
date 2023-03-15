import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const updatePrice  = createAction<BigNumber>('moon/token/updatePrice');
export const updateSupply = createAction<BigNumber>('moon/token/updateSupply');
export const updateDeltaB = createAction<BigNumber>('moon/token/updateDeltaB');
