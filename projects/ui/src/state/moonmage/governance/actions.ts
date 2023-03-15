import { createAction } from '@reduxjs/toolkit';
import { MoonmageGovernance } from '.';

export const resetMoonmageGovernance = createAction(
  'moonmage/governance/reset'
);

export const updateActiveProposals = createAction<MoonmageGovernance['activeProposals']>(
  'moonmage/governance/updateActiveProposals'
);

export const updateMultisigBalances = createAction<MoonmageGovernance['multisigBalances']>(
  'moonmage/governance/updateMultisigBalances'
);
