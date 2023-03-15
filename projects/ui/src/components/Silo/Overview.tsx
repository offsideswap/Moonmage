import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useCallback, useMemo } from 'react';
import useCosmonautBalancesBreakdown from '~/hooks/cosmomage/useCosmonautBalancesBreakdown';
import { AppState } from '~/state';

import useTabs from '~/hooks/display/useTabs';
import TokenIcon from '~/components/Common/TokenIcon';
import { SEEDS, MAGE } from '~/constants/tokens';
import {
  displayPercentage,
  displayMage,
  displayUSD,
  MAGE_PER_SEED_PER_SEASON,
} from '~/util';
import { ChipLabel, StyledTab } from '~/components/Common/Tabs';
import { ZERO_BN } from '~/constants';
import Row from '~/components/Common/Row';
import useAccount from '~/hooks/ledger/useAccount';
import { Module, ModuleTabs } from '~/components/Common/Module';
import OverviewPlot from '~/components/Silo/OverviewPlot';
import Stat from '~/components/Common/Stat';
import useCosmonautSiloHistory from '~/hooks/cosmomage/useCosmonautSiloHistory';
import { FC } from '~/types';
import { BaseDataPoint } from '~/components/Common/Charts/ChartPropProvider';

import mageIconWinter from '~/img/moonmage/mage-icon-green.svg';
import seedIconWinter from '~/img/moonmage/seed-icon-green.svg';

const depositStats = (s: BigNumber, v: BigNumber[]) => (
  <Stat
    title="Value Deposited"
    titleTooltip={
      <>
        Shows the historical value of your Silo Deposits. <br />
        <Typography variant="bodySmall">
          Note: Unripe assets are valued based on the current Chop Rate. Earned
          Moons are shown upon Plant.
        </Typography>
      </>
    }
    color="primary"
    subtitle={`Season ${s.toString()}`}
    amount={displayUSD(v[0])}
    amountIcon={undefined}
    gap={0.25}
    sx={{ ml: 0 }}
  />
);

const seedsStats = (s: BigNumber, v: BigNumber[]) => (
  <Stat
    title="Seed Balance"
    titleTooltip="Seeds are illiquid tokens that yield 1/10,000 Mage each Season."
    subtitle={`Season ${s.toString()}`}
    amount={displayMage(v[0])}
    sx={{ minWidth: 180, ml: 0 }}
    amountIcon={undefined}
    gap={0.25}
  />
);

const SLUGS = ['deposits', 'mage', 'seeds'];

const Overview: FC<{
  cosmomageSilo: AppState['_cosmomage']['silo'];
  moonmageSilo: AppState['_moonmage']['silo'];
  breakdown: ReturnType<typeof useCosmonautBalancesBreakdown>;
  season: BigNumber;
}> = ({ cosmomageSilo, moonmageSilo, breakdown, season }) => {
  const [tab, handleChange] = useTabs(SLUGS, 'view');

  //
  const account = useAccount();
  const { data, loading } = useCosmonautSiloHistory(account, false, true);

  //
  const ownership =
    cosmomageSilo.mage.active?.gt(0) && moonmageSilo.mage.total?.gt(0)
      ? cosmomageSilo.mage.active.div(moonmageSilo.mage.total)
      : ZERO_BN;
  const mageStats = useCallback(
    (s: BigNumber, v: BigNumber[]) => (
      <>
        <Stat
          title="Mage Balance"
          titleTooltip="Mage is the governance token of the Moonmage DAO. Mage entitles holders to passive interest in the form of a share of future Moon mints, and the right to propose and vote on BIPs. Your Mage is forfeited when you Withdraw your Deposited assets from the Silo."
          subtitle={`Season ${s.toString()}`}
          amount={displayMage(v[0])}
          color="text.primary"
          sx={{ minWidth: 220, ml: 0 }}
          gap={0.25}
        />
        <Stat
          title="Mage Ownership"
          titleTooltip="Your current ownership of Moonmage is displayed as a percentage. Ownership is determined by your proportional ownership of the total Mage supply."
          amount={displayPercentage(ownership.multipliedBy(100))}
          color="text.primary"
          gap={0.25}
          sx={{ minWidth: 200, ml: 0 }}
        />
        <Stat
          title="Mage Grown per Day"
          titleTooltip="The number of Mage your Seeds will grow every 24 Seasons based on your current Seed balance."
          amount={displayMage(
            cosmomageSilo.seeds.active.times(MAGE_PER_SEED_PER_SEASON).times(24)
          )}
          color="text.primary"
          gap={0.25}
          sx={{ minWidth: 120, ml: 0 }}
        />
      </>
    ),
    [cosmomageSilo, ownership]
  );

  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange} sx={{ minHeight: 0 }}>
        <StyledTab
          label={
            <ChipLabel name="Deposits">
              {displayUSD(breakdown.states.deposited.value)}
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Mage">
              <Row alignItems="center">
                <TokenIcon token={MAGE} logoOverride={mageIconWinter} />{' '}
                {displayMage(cosmomageSilo.mage.active, 0)}
              </Row>
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Seeds">
              <Row alignItems="center">
                <TokenIcon token={SEEDS} logoOverride={seedIconWinter} />{' '}
                {displayMage(cosmomageSilo.seeds.active, 0)}
              </Row>
            </ChipLabel>
          }
        />
      </ModuleTabs>
      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Silo Deposits"
          account={account}
          current={useMemo(
            () => [breakdown.states.deposited.value],
            [breakdown.states.deposited.value]
          )}
          series={
            useMemo(() => [data.deposits], [data.deposits]) as BaseDataPoint[][]
          }
          season={season}
          stats={depositStats}
          loading={loading}
          empty={breakdown.states.deposited.value.eq(0)}
        />
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Mage Ownership"
          account={account}
          current={useMemo(
            () => [
              cosmomageSilo.mage.active,
              // Show zero while these data points are loading
              ownership,
            ],
            [cosmomageSilo.mage.active, ownership]
          )}
          series={useMemo(
            () => [
              data.mage,
              // mockOwnershipPctData
            ],
            [data.mage]
          )}
          season={season}
          stats={mageStats}
          loading={loading}
          empty={cosmomageSilo.mage.total.lte(0)}
        />
      </Box>
      <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Seeds Ownership"
          account={account}
          current={useMemo(
            () => [cosmomageSilo.seeds.active],
            [cosmomageSilo.seeds.active]
          )}
          series={useMemo(() => [data.seeds], [data.seeds])}
          season={season}
          stats={seedsStats}
          loading={loading}
          empty={cosmomageSilo.seeds.total.lte(0)}
        />
      </Box>
    </Module>
  );
};

export default Overview;
