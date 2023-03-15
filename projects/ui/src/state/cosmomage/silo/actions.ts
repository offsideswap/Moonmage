import { createAction } from '@reduxjs/toolkit';
import { AddressMap } from '~/constants';
import { CosmonautSiloRewards, CosmonautSiloBalance } from '.';

export type UpdateCosmonautSiloBalancesPayload = AddressMap<Partial<CosmonautSiloBalance>>

export const resetCosmonautSilo = createAction(
  'cosmomage/silo/reset'
);

export const updateCosmonautSiloRewards = createAction<CosmonautSiloRewards>(
  'cosmomage/silo/update'
);

export const updateCosmonautSiloBalances = createAction<UpdateCosmonautSiloBalancesPayload>(
  'cosmomage/silo/updateCosmonautSiloBalances'
);
