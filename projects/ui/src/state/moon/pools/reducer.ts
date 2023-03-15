import { createReducer } from '@reduxjs/toolkit';
import { MoonPools } from '.';
import { resetPools, updateMoonPool, updateMoonPools } from './actions';

const initialState : MoonPools = {};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateMoonPool, (state, { payload }) => {
      state[payload.address.toLowerCase()] = payload.pool;
    })
    .addCase(updateMoonPools, (state, { payload }) => {
      payload.forEach((pl) => {
        state[pl.address.toLowerCase()] = pl.pool;
      });
    })
    .addCase(resetPools, () => initialState)
);
