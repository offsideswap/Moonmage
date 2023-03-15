import { Container, Stack } from '@mui/material';
import React from 'react';
import MoonAnalytics from '~/components/Analytics/Moon';
import FieldAnalytics from '~/components/Analytics/Field';
import SiloAnalytics from '~/components/Analytics/Silo';
import PageHeader from '~/components/Common/PageHeader';

import { FC } from '~/types';

const AnalyticsPage: FC<{}> = () => (
  <Container maxWidth="lg">
    <Stack gap={2}>
      <PageHeader
        title="Analytics"
        description="View historical data on Moonmage"
        href="https://analytics.moon.money/"
      />
      <MoonAnalytics />
      <SiloAnalytics />
      <FieldAnalytics />
    </Stack>
  </Container>
);

export default AnalyticsPage;
