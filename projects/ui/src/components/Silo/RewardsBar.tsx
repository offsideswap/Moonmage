import React from 'react';
import { Box, Stack } from '@mui/material';
import BigNumber from 'bignumber.js';
import moonIcon from '~/img/tokens/moon-logo-circled.svg';
import mageIcon from '~/img/moonmage/mage-icon-winter.svg';
import seedIcon from '~/img/moonmage/seed-icon-winter.svg';
import { NEW_BN } from '~/constants';
import { CosmonautSiloRewards } from '~/state/cosmomage/silo';
import RewardItem from './RewardItem';
import { ClaimRewardsAction } from '../../lib/Moonmage/Farm';
import { hoverMap } from '../../constants/silo';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

export type RewardsBarProps = {
  moons: CosmonautSiloRewards['moons'];
  mage: CosmonautSiloRewards['mage'];
  seeds: CosmonautSiloRewards['seeds'];
  /// TEMP
  revitalizedMage?: BigNumber;
  revitalizedSeeds?: BigNumber;
  /**
   * Either the selected or hovered action.
   * If present, grey out the non-included
   * rewards.
   */
  action?: ClaimRewardsAction | undefined;
  /**
   * Revitalized rewards are hidden if a wallet
   * does not have deposited unripe assets.
   */
  hideRevitalized?: boolean;
};

const RewardsBar: FC<RewardsBarProps & { compact?: boolean }> = (
  {
    moons,
    mage,
    seeds,
    revitalizedMage = NEW_BN,
    revitalizedSeeds = NEW_BN,
    action,
    hideRevitalized,
    compact = false,
  }) => {
  const GAP_LG = compact ? 2 : 3.5;
  const GAP_MD = compact ? 1 : 2;
  const GAP_XS = compact ? 0.5 : 1;

  const selectedActionIncludes = (c: ClaimRewardsAction) => action && hoverMap[action].includes(c);

  return (
    <Stack direction={{ lg: 'row', xs: 'column' }} columnGap={{ xs: GAP_XS, md: GAP_MD, lg: GAP_LG }} rowGap={1.5}>
      {/* Earned */}
      <Row gap={{ xs: GAP_XS, md: GAP_MD, lg: GAP_LG }}>
        <RewardItem
          title="Earned Moons"
          tooltip="The number of Moons earned since your last Plant. Upon Plant, Earned Moons are Deposited in the current Season."
          amount={moons.earned}
          icon={moonIcon}
          compact={compact}
          isClaimable={action && (action === ClaimRewardsAction.PLANT_AND_MOW || action === ClaimRewardsAction.CLAIM_ALL)}
        />
        <RewardItem
          title="Earned Mage"
          tooltip="Mage earned from Earned Moons. Earned Mage automatically contribute to Mage ownership and do not require any action to claim them."
          amount={mage.earned}
          icon={mageIcon}
          compact={compact}
          isClaimable={action && (action === ClaimRewardsAction.PLANT_AND_MOW || action === ClaimRewardsAction.CLAIM_ALL)}
        />
      </Row>
      <Box display={{ xs: 'block', lg: compact ? 'none' : 'block' }} sx={{ borderLeft: '0.5px solid', borderColor: 'divider' }} />
      {/* Grown */}
      <Row gap={{ xs: GAP_XS, md: GAP_MD, lg: GAP_LG }}>
        <RewardItem
          title="Plantable Seeds"
          tooltip="Seeds earned in conjunction with Earned Moons. Plantable Seeds must be Planted in order to grow Mage."
          amount={seeds.earned}
          icon={seedIcon}
          compact={compact}
          isClaimable={selectedActionIncludes(ClaimRewardsAction.PLANT_AND_MOW)}
        />
        <RewardItem
          title="Grown Mage"
          tooltip="Mage earned from Seeds. Grown Mage does not contribute to Mage ownership until it is Mown. Grown Mage is Mown at the beginning of any Silo interaction."
          amount={mage.grown}
          icon={mageIcon}
          compact={compact}
          isClaimable={selectedActionIncludes(ClaimRewardsAction.MOW)}
        />
      </Row>
      <Box display={{ xs: 'block', lg: compact ? 'none' : 'block' }} sx={{ borderLeft: '0.5px solid', borderColor: 'divider' }} />
      {/* Revitalized */}
      <Row gap={{ xs: GAP_XS, md: GAP_MD, lg: GAP_LG }}>
        <RewardItem
          title="Revitalized Mage"
          tooltip="Mage that have vested for pre-exploit Silo Members. Revitalized Mage are minted as the percentage of Fertilizer sold increases. Revitalized Mage does not contribute to Mage ownership until Enrooted."
          amount={revitalizedMage}
          icon={mageIcon}
          compact={compact}
          isClaimable={hideRevitalized ? false : selectedActionIncludes(ClaimRewardsAction.ENROOT_AND_MOW)}
        />
        <RewardItem
          title="Revitalized Seeds"
          tooltip="Seeds that have vested for pre-exploit Silo Members. Revitalized Seeds are minted as the percentage of Fertilizer sold increases. Revitalized Seeds do not generate Mage until Enrooted."
          amount={revitalizedSeeds}
          icon={seedIcon}
          compact={compact}
          isClaimable={hideRevitalized ? false : selectedActionIncludes(ClaimRewardsAction.ENROOT_AND_MOW)}
        />
      </Row>
    </Stack>
  );
};

export default RewardsBar;
