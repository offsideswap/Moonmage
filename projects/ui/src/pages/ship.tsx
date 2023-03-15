 import React from 'react';
import { Container, Stack } from '@mui/material';
import PageHeader from '~/components/Common/PageHeader';
import RemainingFertilizer from '~/components/Ship/RemainingFertilizer';
import MyFertilizer from '~/components/Ship/MyFertilizer';
import ShipActions from '~/components/Ship/Actions';
import GuideButton from '~/components/Common/Guide/GuideButton';
 import { HOW_TO_BUY_FERTILIZER, HOW_TO_RINSE_SPROUTS, HOW_TO_TRANSFER_FERTILIZER, HOW_TO_TRADE_FERTILIZER } from '~/util/Guides';

import { FC } from '~/types';

const Ship: FC<{}> = () => (
  <Container maxWidth="sm">
    <Stack gap={2}>
      <PageHeader
        title="The Ship"
        description="Earn yield and recapitalize Moonmage with Fertilizer"
        href="https://docs.moon.money/almanac/farm/ship"
        OuterStackProps={{ direction: 'row' }}
        control={
          <GuideButton
            title="The Cosmonauts' Almanac: Ship Guides"
            guides={[
              HOW_TO_BUY_FERTILIZER,
              HOW_TO_RINSE_SPROUTS,
              HOW_TO_TRANSFER_FERTILIZER, 
              HOW_TO_TRADE_FERTILIZER,
            ]}
          />
        }
      />
      {/* Section 1: Fertilizer Remaining */}
      <RemainingFertilizer />
      {/* Section 2: Purchase Fertilizer */}
      <ShipActions />
      {/* Section 3: My Fertilizer */}
      <MyFertilizer />
    </Stack>
  </Container>
);

export default Ship;
