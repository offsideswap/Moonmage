import { createReducer } from '@reduxjs/toolkit';
import { CosmomageStation } from '.';
import { resetCosmomageStation, updateCosmomageStation } from './actions';

const initialState : CosmomageStation = {
  listings: {},
  orders: {}
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetCosmomageStation, () => initialState)
    .addCase(updateCosmomageStation, (state, { payload }) => {
      state.listings = payload.listings;
      state.orders   = payload.orders;
    })
);
