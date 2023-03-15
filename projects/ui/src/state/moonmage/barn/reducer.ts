import { createReducer } from '@reduxjs/toolkit';
import { NEW_BN, ZERO_BN } from '~/constants';
import { MoonmageShip } from '.';
import { resetShip, updateShip } from './actions';

const initialState : MoonmageShip = {
  remaining:    ZERO_BN,
  totalRaised:  ZERO_BN,
  humidity:     NEW_BN,
  currentBpf:   NEW_BN,
  endBpf:       NEW_BN,
  recapFundedPct: NEW_BN,
  unfertilized: NEW_BN,
  fertilized:   NEW_BN,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetShip, () => initialState)
    .addCase(updateShip, (_state, { payload }) => 
       ({ ...payload })
    )
);
