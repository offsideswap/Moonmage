import React from 'react';
import { Tab } from '@mui/material';
import useTabs from '~/hooks/display/useTabs';
import BadgeTab from '~/components/Common/BadgeTab';
import useCosmonautFertilizer from '~/hooks/cosmomage/useCosmonautFertilizer';
import Rinse from './Rinse';
import Buy from './Buy';
import { Module, ModuleContent, ModuleTabs } from '~/components/Common/Module';

import { FC } from '~/types';

const SLUGS = ['buy', 'rinse'];

const ShipActions : FC<{}> = () => {
  const [tab, handleChange] = useTabs(SLUGS, 'action');
  const cosmomageFertilizer = useCosmonautFertilizer();
  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange}>
        <Tab label="Buy" />
        <BadgeTab showBadge={cosmomageFertilizer.fertilizedSprouts.gt(0)} label="Rinse" />
      </ModuleTabs>
      <ModuleContent>
        {tab === 0 ? <Buy /> : null}
        {tab === 1 ? <Rinse /> : null}
      </ModuleContent>
    </Module>
  );
};

export default ShipActions;
