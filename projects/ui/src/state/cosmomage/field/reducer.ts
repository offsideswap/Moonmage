import { createReducer } from '@reduxjs/toolkit';
import { ZERO_BN } from '~/constants';
import { CosmonautField } from '.';
import { resetCosmonautField, updateCosmonautField } from './actions';

const initialState : CosmonautField = {
  plots: {},
  harvestablePlots: {},
  pods: ZERO_BN,
  harvestablePods: ZERO_BN,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetCosmonautField, () => initialState)
    .addCase(updateCosmonautField, (state, { payload }) => {
      state.plots = payload.plots;
      state.harvestablePlots = payload.harvestablePlots;
      state.pods = payload.pods;
      state.harvestablePods = payload.harvestablePods;
    })
);
