import React, { useMemo } from 'react';
import { Box, Button, Card, Container, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import Overview from '~/components/Silo/Overview';
import RewardsBar from '~/components/Silo/RewardsBar';
import Whitelist from '~/components/Silo/Whitelist';
import PageHeader from '~/components/Common/PageHeader';
import RewardsDialog from '~/components/Silo/RewardsDialog';
import DropdownIcon from '~/components/Common/DropdownIcon';
import useWhitelist from '~/hooks/moonmage/useWhitelist';
import usePools from '~/hooks/moonmage/usePools';
import useCosmonautBalancesBreakdown from '~/hooks/cosmomage/useCosmonautBalancesBreakdown';
import useToggle from '~/hooks/display/useToggle';
import useRevitalized from '~/hooks/cosmomage/useRevitalized';
import useSeason from '~/hooks/moonmage/useSeason';
import { AppState } from '~/state';
import { UNRIPE_MOON, UNRIPE_MOON_CRV3 } from '~/constants/tokens';
import useCosmonautSiloBalances from '~/hooks/cosmomage/useCosmonautSiloBalances';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import GuideButton from '~/components/Common/Guide/GuideButton';
import {
  CLAIM_SILO_REWARDS,
  HOW_TO_DEPOSIT_IN_THE_SILO
} from '~/util/Guides';

import { FC } from '~/types';

const SiloPage : FC<{}> = () => {
  /// Helpers
  const getChainToken = useGetChainToken();
  
  /// Chain Constants
  const whitelist = useWhitelist();
  const pools     = usePools();

  /// State
  const cosmomageSilo    = useSelector<AppState, AppState['_cosmomage']['silo']>((state) => state._cosmomage.silo);
  const moonmageSilo = useSelector<AppState, AppState['_moonmage']['silo']>((state) => state._moonmage.silo);
  const breakdown     = useCosmonautBalancesBreakdown();
  const balances      = useCosmonautSiloBalances();
  const season        = useSeason();
  const { revitalizedMage, revitalizedSeeds } = useRevitalized();

  /// Calculate Unripe Silo Balance
  const urMoon      = getChainToken(UNRIPE_MOON);
  const urMoonCrv3  = getChainToken(UNRIPE_MOON_CRV3);
  const unripeDepositedBalance = balances[urMoon.address]?.deposited.amount
    .plus(balances[urMoonCrv3.address]?.deposited.amount);

  /// Local state
  const [open, show, hide] = useToggle();
  const config = useMemo(() => ({
    whitelist: Object.values(whitelist),
    poolsByAddress: pools,
  }), [whitelist, pools]);

  return (
    <Container maxWidth="lg">
      <Stack gap={2}>
        <PageHeader
          title="The Silo"
          description="Earn yield and participate in Moonmage governance by depositing whitelisted assets"
          href="https://docs.moon.money/almanac/farm/silo"
          // makes guide display to the right of the title on mobile
          OuterStackProps={{ direction: 'row' }}
          control={
            <GuideButton
              title="The Cosmonauts' Almanac: Silo Guides"
              guides={[
                HOW_TO_DEPOSIT_IN_THE_SILO,
                CLAIM_SILO_REWARDS,
              ]}
            />
          }
        />
        <Overview
          cosmomageSilo={cosmomageSilo}
          moonmageSilo={moonmageSilo}
          breakdown={breakdown}
          season={season}
        />
        <Card>
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <Stack
              sx={{ pl: 2, pr: 2, py: 1.5 }}
              direction={{ xs: 'column', lg: 'row' }}
              justifyContent={{ lg: 'space-between' }}
              alignItems={{ xs: 'auto', lg: 'center' }}
              rowGap={1.5}
            >
              <RewardsBar
                moons={cosmomageSilo.moons}
                mage={cosmomageSilo.mage}
                seeds={cosmomageSilo.seeds}
                revitalizedMage={revitalizedMage}
                revitalizedSeeds={revitalizedSeeds}
                hideRevitalized={unripeDepositedBalance?.eq(0)}
              />
              <Box
                justifySelf={{ xs: 'auto', lg: 'flex-end' }}
                width={{ xs: '100%', lg: 'auto' }}
              >
                <Button
                  size="medium"
                  variant="contained"
                  sx={{ width: '100%', whiteSpace: 'nowrap' }}
                  endIcon={<DropdownIcon open={false} disabled={breakdown.totalValue?.eq(0)} light />}
                  onClick={show}
                  disabled={breakdown.totalValue?.eq(0)}
                >
                  Claim Rewards
                </Button>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Whitelist
          config={config}
          cosmomageSilo={cosmomageSilo}
        />
        <RewardsDialog
          open={open}
          handleClose={hide}
          moons={cosmomageSilo.moons}
          mage={cosmomageSilo.mage}
          seeds={cosmomageSilo.seeds}
          revitalizedMage={revitalizedMage}
          revitalizedSeeds={revitalizedSeeds}
        />
      </Stack>
    </Container>
  );
};

export default SiloPage;
