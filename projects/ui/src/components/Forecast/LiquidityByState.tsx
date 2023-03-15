import React from 'react';
import { CardProps, Card, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import Stat from '../Common/Stat';
import { displayFullBN } from '../../util';
import StatsCard, { StatItem } from '~/components/Common/StatsCard';
import { SEEDS, SPROUTS, MAGE, PODS } from '~/constants/tokens';
import { AppState } from '~/state';
import MoonmageBalances from '~/components/Common/Balances/MoonmageBalances';
import useMoonmageSiloBreakdown from '~/hooks/moonmage/useMoonmageBalancesBreakdown';
import { NEW_BN } from '~/constants';

import { FC } from '~/types';

const LiquidityByState: FC<CardProps> = ({ sx }) => {
  const breakdown = useMoonmageSiloBreakdown();
  const moonmageSilo = useSelector<AppState, AppState['_moonmage']['silo']>((state) => state._moonmage.silo);
  const moonmageField = useSelector<AppState, AppState['_moonmage']['field']>((state) => state._moonmage.field);
  const moonmageShip = useSelector<AppState, AppState['_moonmage']['ship']>((state) => state._moonmage.ship);
  const totalMoonSupply = useSelector<AppState, AppState['_moon']['token']['supply']>((state) => state._moon.token.supply);

  /// Total Balances
  const STAT_ITEMS: StatItem[] = [
    {
      title: 'Mage',
      tooltip: 'This is the total Mage supply. Mage is the governance token of the Moonmage DAO. Mage entitles holders to passive interest in the form of a share of future Moon mints, and the right to propose and vote on BIPs.',
      token: MAGE,
      amount: moonmageSilo.mage.total
    },
    {
      title: 'Seeds',
      tooltip: 'This is the total Seed supply. Each Seed yields 1/10000 Grown Mage each Season.',
      token: SEEDS,
      amount: moonmageSilo.seeds.total
    },
    {
      title: 'Pods',
      tooltip: 'This is the total Pod supply. Pods become Harvestable on a FIFO basis.',
      token: PODS,
      amount: moonmageField.podLine
    },
    {
      title: 'Sprouts',
      tooltip: 'This is the total Sprout supply. Sprouts are the number of Moons left to be earned from Active Fertilizer. Sprouts become Rinsable on a pari passu basis.',
      token: SPROUTS,
      amount: moonmageShip.unfertilized,
    }
  ];

  return (
    <Card sx={{ p: 2, width: '100%', ...sx }}>
      <Stat
        title="Moon Supply"
        amount={totalMoonSupply !== NEW_BN ? displayFullBN(totalMoonSupply, 2) : <CircularProgress variant="indeterminate" size="1.2em" thickness={4} />}
        gap={0.25}
        sx={{ ml: 0 }}
      />
      <MoonmageBalances breakdown={breakdown} />
      <StatsCard stats={STAT_ITEMS} />
    </Card>
  );
};

export default LiquidityByState;
