import { combineReducers } from '@reduxjs/toolkit';

import ship from './ship/reducer';
import field from './field/reducer';
import governance from './governance/reducer';
import silo from './silo/reducer';
import sun from './sun/reducer';
import tokenPrices from './tokenPrices/reducer';

export default combineReducers({
  ship,
  field,
  governance,
  silo,
  sun,
  tokenPrices,
});
