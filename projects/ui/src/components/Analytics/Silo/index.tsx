import { Alert, Box, Card, Link, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';
import {
  MOON,
  MOON_CRV3_LP,
  UNRIPE_MOON,
  UNRIPE_MOON_CRV3,
} from '~/constants/tokens';
import { MOONMAGE_ADDRESSES } from '~/constants';
import { clearApolloCache } from '~/util';
import useTabs from '~/hooks/display/useTabs';
import Mage from '~/components/Analytics/Silo/Mage';
import Seeds from '~/components/Analytics/Silo/Seeds';
import DepositedAsset from '~/components/Analytics/Silo/DepositedAsset';
import WarningIcon from '~/components/Common/Alert/WarningIcon';
import APY from '~/components/Analytics/Silo/APY';
import { FC } from '~/types';

const SLUGS = [
  'deposited_moon',
  'deposited_lp',
  'deposited_urmoon',
  'deposited_urlp',
  'mage',
  'seeds',
  'moon_vAPY',
  'lp_vAPY',
];

const SiloAnalytics: FC<{}> = () => {
  const [tab, handleChangeTab] = useTabs(SLUGS, 'silo');
  return (
    <Card>
      <Tabs
        value={tab}
        onChange={handleChangeTab}
        sx={{ px: 2, pt: 2, pb: 1.5 }}
      >
        <Tab label="Deposited MOON" />
        <Tab label="Deposited MOON3CRV" />
        <Tab label="Deposited urMOON" />
        <Tab label="Deposited urMOON3CRV" />
        <Tab label="Mage" />
        <Tab label="Seeds" />
        <Tab label="Moon vAPY" />
        <Tab label="LP vAPY" />
      </Tabs>
      <Box px={1} mb={1.5}>
        <Alert variant="standard" color="warning" icon={<WarningIcon />}>
          Silo analytics are under active development. Data shown may be
          incorrect.
          <br />
          <Typography fontSize="small">
            Graphs not working?{' '}
            <Link
              href="#/analytics"
              underline="hover"
              onClick={() => clearApolloCache()}
            >
              Clear cache
            </Link>
          </Typography>
        </Alert>
      </Box>
      {tab === 0 && (
        <DepositedAsset
          asset={MOON[1]}
          account={MOONMAGE_ADDRESSES[1]}
          height={300}
        />
      )}
      {tab === 1 && (
        <DepositedAsset
          asset={MOON_CRV3_LP[1]}
          account={MOONMAGE_ADDRESSES[1]}
          height={300}
        />
      )}
      {tab === 2 && (
        <DepositedAsset
          asset={UNRIPE_MOON[1]}
          account={MOONMAGE_ADDRESSES[1]}
          height={300}
        />
      )}
      {tab === 3 && (
        <DepositedAsset
          asset={UNRIPE_MOON_CRV3[1]}
          account={MOONMAGE_ADDRESSES[1]}
          height={300}
        />
      )}
      {tab === 4 && <Mage height={300} />}
      {tab === 5 && <Seeds height={300} />}
      {tab === 6 && <APY height={300} metric="Moon" />}
      {tab === 7 && <APY height={300} metric="LP" />}
    </Card>
  );
};
export default SiloAnalytics;
