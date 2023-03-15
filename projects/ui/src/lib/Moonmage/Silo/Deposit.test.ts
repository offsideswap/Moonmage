import BigNumber from 'bignumber.js';
import { ZERO_BN } from '~/constants';
import { MOON } from '~/constants/tokens';
import Moonmage from '../index';

it('has a bdv of 0 with no token state', () => {
  const result = Moonmage.Silo.Deposit.deposit(
    MOON[1],
    [{ token: MOON[1], amount: ZERO_BN }],
    (amount) => amount,
  );
  expect(result.bdv).toStrictEqual(new BigNumber(0));
});
