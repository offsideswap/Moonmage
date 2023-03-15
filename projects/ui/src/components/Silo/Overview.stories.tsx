import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import BigNumber from 'bignumber.js';
import { initialCosmonautSilo } from '~/state/cosmomage/silo/reducer';
import { initialMoonmageSilo } from '~/state/moonmage/silo/reducer';

import Overview from './Overview';

export default {
  component: Overview,
} as ComponentMeta<typeof Overview>;

const n = new BigNumber(60_740);
const s = {
  value: n,
  byToken: {}
};

const Template: ComponentStory<typeof Overview> = (args: any) => (
  <Overview
    cosmomageSilo={initialCosmonautSilo}
    moonmageSilo={initialMoonmageSilo}
    breakdown={{
      totalValue: n,
      states: {
        circulating: s,
        farm:      s,
        claimable: s,
        deposited: s,
        withdrawn: s,
      }
    }}
    season={new BigNumber(6074)}
  />
);

export const Main = Template.bind({});
