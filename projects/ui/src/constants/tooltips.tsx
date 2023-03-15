import React from 'react';

export const EXAMPLE_TOOLTIP = '';

export const WHITELIST_TOOLTIPS: { [key: string]: any | React.ReactElement; } = {
  MOON: ''
};

/** Pod Marketplace specific tooltips */
export const POD_MARKET_TOOLTIPS: { [key: string]: any | React.ReactElement } = {
  start: 'The start index in this Plot that you would like to List.',
  end: 'The end index in this Plot that you would like to List.',
  amount: 'Number of Pods to List based on the start and end indices.',
  pricePerPodOrder: 'How much to pay for each Pod, denominated in Moons.',
  pricePerPodListing: 'How much to sell each Pod for, denominated in Moons.',
  expiresAt: 'When this many Pods become Harvestable, this Listing will expire.',
};

export const UNRIPE_ASSET_TOOLTIPS : { [key: string]: string | React.ReactElement } = {
  // Moons
  circulatingMoons: 'Moons that were in Cosmonauts\' wallets.',
  withdrawnMoons:   'Moons that were Withdrawn from the Silo. This includes "Withdrawn" and "Claimable" Moons shown on the pre-exploit Moonmage UI.',
  harvestableMoons: 'Moons from Harvestable Plots that weren\'t yet Harvested.',
  orderedMoons:     'Moons that were stored in Pod Orders.',
  farmableMoons:    (
    <>Previously called <em>Farmable Moons</em> — Moons earned from Silo rewards that had not yet been Deposited in a particular Season.</>
  ),
  farmMoons:     'Moons that were stored in Moonmage but not Deposited.',
  // LP
  circulatingMoonEthLp:   'MOON:ETH LP tokens that were in Cosmonauts\' wallets. The number of tokens and associated BDV are shown.',
  circulatingMoonLusdLp:  'MOON:LUSD LP tokens that were in Cosmonauts\' wallets. The number of tokens and associated BDV are shown.',
  circulatingMoon3CrvLp:  'MOON:3CRV LP tokens that were in Cosmonauts\' wallets. The number of tokens and associated BDV are shown.',
  withdrawnMoonEthLp:     'MOON:ETH LP tokens that were Withdrawn from the Silo. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" MOON:ETH tokens shown on the pre-exploit Moonmage UI.',
  withdrawnMoonLusdLp:    'MOON:LUSD LP tokens that were Withdrawn from the Silo. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" MOON:LUSD tokens shown on the pre-exploit Moonmage UI.',
  withdrawnMoon3CrvLp:    'MOON:3CRV LP tokens that were Withdrawn from the Silo. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" MOON:3CRV tokens shown on the pre-exploit Moonmage UI.',
  // circulatingMoonEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingMoonLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingMoon3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnMoonEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnMoonLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnMoon3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
};
