import React from 'react';
import {
  Container, Stack,
} from '@mui/material';
import SwapActions from '~/components/Swap/Actions';
import PageHeader from '~/components/Common/PageHeader';
import GuideButton from '~/components/Common/Guide/GuideButton';
import { HOW_TO_TRANSFER_BALANCES, HOW_TO_TRADE_MOONS } from '~/util/Guides';

import { FC } from '~/types';

const SwapPage: FC<{}> = () => (
  <Container maxWidth="sm">
    <Stack gap={2}>
      <PageHeader
        title="Swap"
        description="Trade Moons and transfer Moonmage assets"
        href="https://docs.moon.money/almanac/guides/swap"
        control={
          <GuideButton
            title="The Cosmonauts' Almanac: Swap Guides"
            guides={[
              HOW_TO_TRADE_MOONS,
              HOW_TO_TRANSFER_BALANCES,
            ]}
          />
        }
      />
      <SwapActions />
    </Stack>
  </Container>
);
export default SwapPage;
