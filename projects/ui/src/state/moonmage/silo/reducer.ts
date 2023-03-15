import { createReducer } from '@reduxjs/toolkit';
import { NEW_BN } from '~/constants';
import { MoonmageSilo } from '.';
import { resetMoonmageSilo, updateMoonmageSilo } from './actions';

export const initialMoonmageSilo : MoonmageSilo = {
  // Balances
  balances: {},
  // Rewards
  moons: {
    total: NEW_BN,
    earned: NEW_BN,
  },
  mage: {
    active: NEW_BN,
    earned: NEW_BN,
    grown: NEW_BN,
    total: NEW_BN,
  },
  seeds: {
    active: NEW_BN,
    earned: NEW_BN,
    total: NEW_BN,
  },
  roots: {
    total: NEW_BN, 
  },
  // Metadata
  withdrawSeasons: NEW_BN,
};

export default createReducer(initialMoonmageSilo, (builder) =>
  builder
    .addCase(resetMoonmageSilo, () => {
      console.debug('[moonmage/silo/reducer] reset');
      return initialMoonmageSilo;
    })
    .addCase(updateMoonmageSilo, (state, { payload }) => {
      state.balances = payload.balances;
      state.moons = payload.moons;
      state.mage = payload.mage;
      state.seeds = payload.seeds;
      state.roots = payload.roots;
      state.withdrawSeasons = payload.withdrawSeasons;
    })
);
