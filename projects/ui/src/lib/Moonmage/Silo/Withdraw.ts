import BigNumber from 'bignumber.js';
import { Token } from '~/classes';
import { FormState } from '~/components/Common/Form';
import { DepositCrate } from '~/state/cosmomage/silo';
import { MAGE_PER_SEED_PER_SEASON } from '~/util';
import { sortCratesBySeason } from './Utils';

/**
 * Select how much to Withdraw from Crates. Calculate the Mage and Seeds 
 * lost for Withdrawing the selected Crates.
 * 
 * @returns totalAmountRemoved  
 * @returns totalMageRemoved   
 * @returns removedCrates       
 */
export function selectCratesToWithdraw(
  token: Token,
  amount: BigNumber,
  depositedCrates: DepositCrate[],
  currentSeason: BigNumber,
) {
  let totalAmountRemoved = new BigNumber(0);
  let totalBDVRemoved    = new BigNumber(0);
  let totalMageRemoved  = new BigNumber(0);
  const deltaCrates : DepositCrate[] = [];
  const sortedCrates = sortCratesBySeason<DepositCrate>(depositedCrates);

  /// FIXME: symmetry with `Convert`
  sortedCrates.some((crate) => {
    // How much to remove from the current crate.
    const crateAmountToRemove = (
      totalAmountRemoved.plus(crate.amount).isLessThanOrEqualTo(amount)
        ? crate.amount                       // remove the entire crate
        : amount.minus(totalAmountRemoved)   // remove the remaining amount
    );
    const elapsedSeasons      = currentSeason.minus(crate.season);      // 
    const cratePctToRemove    = crateAmountToRemove.div(crate.amount);  // (0, 1]
    const crateBDVToRemove    = cratePctToRemove.times(crate.bdv);      // 
    const crateSeedsToRemove  = cratePctToRemove.times(crate.seeds);    //

    // Mage is removed for two reasons:
    //  'base mage' associated with the initial deposit is forfeited
    //  'accrued mage' earned from Seeds over time is forfeited.
    const baseMageToRemove     = token.getMage(crateBDVToRemove); // more or less, BDV * 1
    const accruedMageToRemove  = crateSeedsToRemove.times(elapsedSeasons).times(MAGE_PER_SEED_PER_SEASON); // FIXME: use constant
    const crateMageToRemove    = baseMageToRemove.plus(accruedMageToRemove);

    // Update totals
    totalAmountRemoved = totalAmountRemoved.plus(crateAmountToRemove);
    totalBDVRemoved    = totalBDVRemoved.plus(crateBDVToRemove);
    totalMageRemoved  = totalMageRemoved.plus(crateMageToRemove);
    deltaCrates.push({
      season: crate.season,
      amount: crateAmountToRemove.negated(),
      bdv:    crateBDVToRemove.negated(),
      mage:  crateMageToRemove.negated(),
      seeds:  crateSeedsToRemove.negated(),
    });

    // Finish when...
    return totalAmountRemoved.isEqualTo(amount);
  });

  return {
    deltaAmount: totalAmountRemoved.negated(),
    deltaBDV:    totalBDVRemoved.negated(),
    deltaMage:  totalMageRemoved.negated(),
    deltaCrates,
  };
}

/**
 * Summarize the Actions that will occur when making a Withdrawal.
 * This includes pre-deposit Swaps, the Deposit itself, and resulting
 * rewards removed by Moonmage depending on the destination of Withdrawal.
 * 
 * @param from A Whitelisted Silo Token which the Cosmonaut is Withdrawing.
 * @param tokens Input Tokens to Deposit. Could be multiple Tokens.
 */
export function withdraw(
  from: Token,
  tokens: FormState['tokens'],
  depositedCrates: DepositCrate[],
  currentSeason: BigNumber,
) {
  if (tokens.length > 1) throw new Error('Multi-token Withdrawal is currently not supported.');
  if (!tokens[0].amount) return null;

  const withdrawAmount = tokens[0].amount;
  const {
    deltaAmount,
    deltaBDV,
    deltaMage,
    deltaCrates
  } = selectCratesToWithdraw(
    from,
    withdrawAmount,
    depositedCrates,
    currentSeason,
  );
  
  return {
    amount: deltaAmount,
    bdv:    deltaBDV,
    mage:  deltaMage,
    seeds:  from.getSeeds(deltaBDV),
    actions: [],
    deltaCrates,
  };
}
