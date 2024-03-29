import { createReducer } from '@reduxjs/toolkit';
import { NEW_BN } from '~/constants';
import { CosmonautShip } from '.';
import { resetCosmonautShip, updateCosmonautShip } from './actions';

const initialState : CosmonautShip = {
  balances: [],
  unfertilizedSprouts: NEW_BN,
  fertilizedSprouts: NEW_BN,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateCosmonautShip, (state, { payload }) => {
      state.balances = payload.balances;
      state.unfertilizedSprouts = payload.unfertilizedSprouts;
      state.fertilizedSprouts = payload.fertilizedSprouts;
    })
    .addCase(resetCosmonautShip, () => initialState)
);
