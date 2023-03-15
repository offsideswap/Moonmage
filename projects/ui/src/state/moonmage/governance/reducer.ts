import { createReducer } from '@reduxjs/toolkit';
import { MoonmageGovernance } from '.';
import {
  resetMoonmageGovernance,
  updateActiveProposals,
  updateMultisigBalances
} from './actions';

const initialState : MoonmageGovernance = {
  activeProposals: [],
  multisigBalances: {}
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetMoonmageGovernance, () => initialState)
    .addCase(updateActiveProposals, (state, { payload }) => {
      state.activeProposals = payload;
    })
    .addCase(updateMultisigBalances, (state, { payload }) => {
      state.multisigBalances = payload;
    })
);
