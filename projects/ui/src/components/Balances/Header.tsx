import {
  Box,
  Divider,
  Grid,
} from '@mui/material';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '~/state';
import Row from '../Common/Row';
import { PODS, SEEDS, SPROUTS, MAGE } from '~/constants/tokens';
import HeaderItem from '~/components/Balances/HeaderItem';

const MAGE_TOOLTIP =
  'This is your total Mage balance. Mage is the governance token of the Moonmage DAO. Mage entitles holders to passive interest in the form of a share of future Moon mints, and the right to propose and vote on BIPs. Your Mage is forfeited when you Withdraw your Deposited assets from the Silo.';
const SEEDS_TOOLTIP =
  'This is your total Seed balance. Each Seed yields 1/10000 Grown Mage each Season. Grown Mage must be Mown to add it to your Mage balance.';
const PODS_TOOLTIP =
  'This is your total Pod Balance. Pods become Harvestable on a FIFO basis. For more information on your place in the Pod Line, head over to the Field page.';
const SPROUTS_TOOLTIP =
  'This is your total Sprout balance. The number of Moons left to be earned from your Fertilizer. Sprouts become Rinsable on a pari passu basis. For more information on your Sprouts, head over to the Ship page.';

const VerticalDivider = () => (
  <Box display={{ xs: 'none', md: 'block' }} alignSelf="flex-end">
    <Divider
      orientation="vertical"
      sx={{
        width: '0.5px',
        height: '20px',
        borderColor: 'divider',
      }}
    />
  </Box>
);

const BalancesHeader: React.FC<{}> = () => {
  const cosmomageSilo = useSelector<AppState, AppState['_cosmomage']['silo']>(
    (state) => state._cosmomage.silo
  );
  const cosmomageField = useSelector<AppState, AppState['_cosmomage']['field']>(
    (state) => state._cosmomage.field
  );
  const cosmomageShip = useSelector<AppState, AppState['_cosmomage']['ship']>(
    (state) => state._cosmomage.ship
  );

  const tokensProps = useMemo(
    () => ({
      mage: {
        token: MAGE,
        title: 'MAGE',
        amount: cosmomageSilo.mage.total,
        tooltip: MAGE_TOOLTIP,
      },
      seeds: {
        token: SEEDS,
        title: 'SEEDS',
        amount: cosmomageSilo.seeds.total,
        tooltip: SEEDS_TOOLTIP,
      },
      pods: {
        token: PODS,
        title: 'PODS',
        amount: cosmomageField.pods,
        tooltip: PODS_TOOLTIP,
      },
      sprouts: {
        token: SPROUTS,
        title: 'SPROUTS',
        amount: cosmomageShip.unfertilizedSprouts,
        tooltip: SPROUTS_TOOLTIP,
      },
    }),
    [
      cosmomageShip.unfertilizedSprouts,
      cosmomageField.pods,
      cosmomageSilo.seeds.total,
      cosmomageSilo.mage.total,
    ]
  );

  return (
    <>
      {/* breakpoints above md */}
      <Row
        display={{ xs: 'none', md: 'flex' }}
        width="100%"
        justifyContent="space-between"
      >
        {/* MAGE */}
        <HeaderItem {...tokensProps.mage} alignItems="flex-start" />
        <Row width="100%" justifyContent="space-evenly">
          {/* SEEDS */}
          <HeaderItem {...tokensProps.seeds} />
          <VerticalDivider />
          {/* PODS */}
          <HeaderItem {...tokensProps.pods} />
          <VerticalDivider />
          {/* SPROUTS */}
          <HeaderItem {...tokensProps.sprouts} />
        </Row>
      </Row>

      {/* breakpoints xs & sm */}
      <Grid container display={{ md: 'none' }} gap={0.5}>
        <Grid container item xs={12} gap={0.5}>
          {/* MAGE */}
          <Grid item xs={12} sm={6}>
            <HeaderItem
              {...tokensProps.mage}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-start',
              }}
            />
          </Grid>
          {/* SEEDS */}
          <Grid item xs sm>
            <HeaderItem
              {...tokensProps.seeds}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-end',
              }}
            />
          </Grid>
        </Grid>
        <Grid container item xs sm gap={0.5}>
          {/* PODS */}
          <Grid item xs={12} sm={6}>
            <HeaderItem
              {...tokensProps.pods}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-start',
              }}
            />
          </Grid>
          {/* SPROUTS */}
          <Grid item xs sm>
            <HeaderItem
              {...tokensProps.sprouts}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-end',
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default BalancesHeader;
