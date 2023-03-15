import BigNumber from 'bignumber.js';
import { MOON } from '~/constants/tokens';
import { DepositCrate } from '~/state/cosmomage/silo';
import { MAGE_PER_SEED_PER_SEASON } from '~/util';
import Moonmage from '../index';

type WResult = ReturnType<typeof Moonmage.Silo.Withdraw.selectCratesToWithdraw>;

// Setup
const currentSeason = new BigNumber(100);
export const depositedCrates = [
  // Deposit: 10 Moons in Season 24
  {
    season: new BigNumber(24),
    amount: new BigNumber(10),
    bdv:    new BigNumber(10),
    mage:  new BigNumber(10),
    seeds:  new BigNumber(20),
  },
  // Deposit: 5 Moons in Season 77
  {
    season: new BigNumber(77),
    amount: new BigNumber(5),
    bdv:    new BigNumber(5),
    mage:  new BigNumber(5),
    seeds:  new BigNumber(10),
  }
] as DepositCrate[];

// --------------------------------------------------------

it('selects a single Deposit crate to Withdraw', () => {
  const withdrawAmount = new BigNumber(2);

  // Expected results
  const expectedBDVRemoved   = withdrawAmount;
  const expectedSeedsRemoved = new BigNumber(4);
  const expectedMageRemoved = new BigNumber(2).plus(expectedSeedsRemoved.times(100 - 77).times(MAGE_PER_SEED_PER_SEASON));
  const result = Moonmage.Silo.Withdraw.selectCratesToWithdraw(
    MOON[1],
    withdrawAmount,
    depositedCrates,
    currentSeason
  );

  expect(result)
    .toStrictEqual({
      deltaAmount: withdrawAmount.negated(),
      deltaBDV:    expectedBDVRemoved.negated(),
      deltaMage:  expectedMageRemoved.negated(),
      deltaCrates: [{
        season: new BigNumber(77),
        amount: withdrawAmount.negated(),
        bdv:    expectedBDVRemoved.negated(),
        mage:  expectedMageRemoved.negated(),
        seeds:  expectedSeedsRemoved.negated(),
      }],
    } as WResult);
});

it('selects multiple Deposit Crates to Withdraw', () => {
  const withdrawAmount = new BigNumber(12);
  
  // Expected results
  const expectedMageRemoved77 = new BigNumber(5).plus(new BigNumber(10 * (100 - 77)).times(MAGE_PER_SEED_PER_SEASON));
  const expectedMageRemoved24 = new BigNumber(7).plus(new BigNumber(14 * (100 - 24)).times(MAGE_PER_SEED_PER_SEASON));
  const expectedMageRemoved = expectedMageRemoved77.plus(expectedMageRemoved24);
  const result = Moonmage.Silo.Withdraw.selectCratesToWithdraw(
    MOON[1],
    withdrawAmount,
    depositedCrates,
    currentSeason
  );

  expect(result)
    .toStrictEqual({
      deltaAmount: withdrawAmount.negated(),
      deltaBDV:    new BigNumber(12).negated(),
      deltaMage:  expectedMageRemoved.negated(),
      deltaCrates: [
        // All of the most recent crate is now removed.
        {
          season: new BigNumber(77),
          amount: new BigNumber(5).negated(),
          bdv:    new BigNumber(5).negated(),
          mage:  expectedMageRemoved77.negated(),
          seeds:  new BigNumber(10).negated()
        },
        // Part of the older crate is removed.
        {
          season: new BigNumber(24),
          amount: new BigNumber(7).negated(),
          bdv:    new BigNumber(7).negated(),
          mage:  expectedMageRemoved24.negated(),
          seeds:  new BigNumber(14).negated()
        }
      ],
    } as WResult);
});
