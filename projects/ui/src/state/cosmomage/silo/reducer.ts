import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { CosmonautSilo } from '.';
import { resetCosmonautSilo, updateCosmonautSiloRewards, updateCosmonautSiloBalances } from './actions';

const NEG1 = new BigNumber(-1);

export const initialCosmonautSilo : CosmonautSilo = {
  balances: {},
  moons: {
    earned: NEG1,
  },
  mage: {
    active: NEG1,
    earned: NEG1,
    grown: NEG1,
    total: NEG1,
  },
  seeds: {
    active: NEG1,
    earned: NEG1,
    total: NEG1,
  },
  roots: {
    total: NEG1, 
  }
};

export default createReducer(initialCosmonautSilo, (builder) =>
  builder
    .addCase(resetCosmonautSilo, () => initialCosmonautSilo)
    .addCase(updateCosmonautSiloBalances, (state, { payload }) => {
      const addresses = Object.keys(payload);
      addresses.forEach((address) => {
        const a = address.toLowerCase();
        state.balances[a] = {
          ...state.balances[a],
          ...payload[address]
        };
      });
    })
    .addCase(updateCosmonautSiloRewards, (state, { payload }) => {
      state.moons = payload.moons;
      state.mage = payload.mage;
      state.seeds = payload.seeds;
      state.roots = payload.roots;
    })
);
