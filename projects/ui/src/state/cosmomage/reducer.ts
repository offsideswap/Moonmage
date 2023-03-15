import { combineReducers } from '@reduxjs/toolkit';

import allowances from './allowances/reducer';
import balances from './balances/reducer';
import ship from './ship/reducer';
import events2 from './events2/reducer';
import field from './field/reducer';
import market from './market/reducer';
import silo from './silo/reducer';

export default combineReducers({
  allowances,
  balances,
  ship,
  events2,
  field,
  market,
  silo,
});
