import React from 'react';
import { Tab } from '@mui/material';
import useTabs from '~/hooks/display/useTabs';
import Supply from '~/components/Analytics/Moon/Supply';
import MarketCap from '~/components/Analytics/Moon/MarketCap';
import Volume from '~/components/Analytics/Moon/Volume';
import Liquidity from '~/components/Analytics/Moon/Liquidity';
import { Module, ModuleTabs } from '~/components/Common/Module';

const SLUGS = ['liquidity', 'volume', 'delta-b', 'price'];
const WellCharts: React.FC<{}> = () => {
  const [tab, handleChangeTab] = useTabs(SLUGS, 'moon');

  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChangeTab}>
        <Tab label="Liquidity" />
        <Tab label="Volume" />
        <Tab label="deltaB" />
        <Tab label="Price (MOON/ETH)" />
        <Tab label="Price (ETH/MOON)" />
      </ModuleTabs>
      {tab === 0 && <Liquidity height={240} />}
      {tab === 1 && <Volume height={240} />}
      {tab === 2 && <MarketCap height={240} />}
      {tab === 3 && <Supply height={240} />}
      {tab === 3 && <Supply height={240} />}
    </Module>
  );
};

export default WellCharts;
