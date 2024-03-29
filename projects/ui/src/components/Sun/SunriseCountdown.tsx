import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '~/state';

import { FC } from '~/types';

const SunriseCountdown : FC<{}> = () => {
  const remaining = useSelector<AppState, AppState['_moonmage']['sun']['sunrise']['remaining']>((state) => state._moonmage.sun.sunrise.remaining);

  return ( 
    <>in {remaining.toFormat('mm:ss')}</>
  );
};

export default SunriseCountdown;
