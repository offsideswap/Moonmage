import BigNumber from 'bignumber.js';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { Token } from '~/classes';
import { DepositCrate } from '~/state/cosmomage/silo';
import { sortCratesByBDVRatio, sortCratesBySeason } from './Utils';

export enum ConvertKind {
  MOONS_TO_CURVE_LP   = 0,
  CURVE_LP_TO_MOONS   = 1,
  UNRIPE_MOONS_TO_LP  = 2,
  UNRIPE_LP_TO_MOONS  = 3,
}

/**
 * Select Deposit Crates to convert. Calculate resulting gain/loss of Mage and Seeds.
 * 
 * @param fromToken Token converting from. Used to calculate mage and seeds.
 * @param toToken Token converting to. Used to calculate mage and seeds.
 * @param fromAmount Amount of `fromToken` to convert.
 * @param depositedCrates An array of deposit crates for `fromToken`.
 * @param currentSeason used to calculate loss of grown mage.
 * @returns 
 */
export function selectCratesToConvert(
  fromToken:        Token,
  toToken:          Token,
  fromAmount:       BigNumber,
  depositedCrates:  DepositCrate[],
  currentSeason:    BigNumber,
) {
  let totalAmountConverted = new BigNumber(0);
  let totalBDVRemoved      = new BigNumber(0);
  let totalMageRemoved    = new BigNumber(0);
  const deltaCrates : DepositCrate[] = [];

  /// TODO: handle the LP->LP case when we have two LP pools.
  const sortedCrates = (
    toToken.isLP 
      /// MOON -> LP: oldest crates are best. Grown mage is equivalent
      /// on both sides of the convert, but having more seeds in older crates
      /// allows you to accrue mage faster after convert.
      /// Note that during this convert, BDV is approx. equal after the convert.
      ? sortCratesBySeason<DepositCrate>(depositedCrates, 'asc')
      /// LP -> MOON: use the crates with the lowest [BDV/Amount] ratio first.
      /// Since LP deposits can have varying BDV, the best option for the Cosmonaut
      /// is to increase the BDV of their existing lowest-BDV crates.
      : sortCratesByBDVRatio<DepositCrate>(depositedCrates, 'asc')
  );

  /// FIXME: symmetry with `Withdraw`
  sortedCrates.some((crate) => {
    // How much to remove from the current crate.
    const crateAmountToRemove = (
      totalAmountConverted.plus(crate.amount).isLessThanOrEqualTo(fromAmount)
        ? crate.amount                            // remove the entire crate
        : fromAmount.minus(totalAmountConverted)  // remove the remaining amount
    );
    const elapsedSeasons      = currentSeason.minus(crate.season);      // 
    const cratePctToRemove    = crateAmountToRemove.div(crate.amount);  // (0, 1]
    const crateBDVToRemove    = cratePctToRemove.times(crate.bdv);      // 
    const crateSeedsToRemove  = cratePctToRemove.times(crate.seeds);    //

    // Mage is removed for two reasons:
    //  'base mage' associated with the initial deposit is forfeited
    //  'accrued mage' earned from Seeds over time is forfeited.
    const baseMageToRemove     = fromToken.getMage(crateBDVToRemove); // more or less, BDV * 1
    const accruedMageToRemove  = crateSeedsToRemove.times(elapsedSeasons).times(0.0001);
    const crateMageToRemove    = baseMageToRemove.plus(accruedMageToRemove);

    // Update totals
    totalAmountConverted = totalAmountConverted.plus(crateAmountToRemove);
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
    return totalAmountConverted.isEqualTo(fromAmount);
  });

  return {
    /** change in amount of fromToken */
    deltaAmount: totalAmountConverted.negated(),
    /** the total change in bdv from this convert */
    deltaBDV:    totalBDVRemoved.negated(),
    /** mage gained/lost during the convert */
    deltaMage:  totalMageRemoved.negated(),
    /** affected crates */
    deltaCrates,
  };
}

export function convert(
  fromToken:        Token,
  toToken:          Token,
  fromAmount:       BigNumber,
  depositedCrates:  DepositCrate[],
  currentSeason:    BigNumber,
) {
  const {
    deltaAmount,
    deltaBDV,
    deltaMage,
    deltaCrates
  } = selectCratesToConvert(
    fromToken,
    toToken,
    fromAmount,
    depositedCrates,
    currentSeason,
  );
  
  return {
    amount:  deltaAmount,
    bdv:     deltaBDV,
    mage:   deltaMage,
    seeds:   fromToken.getSeeds(deltaBDV),
    actions: [], /// FIXME: finalize `actions` pattern for SDK
    deltaCrates,
  };
}

/**
 * Encoded converts follow this structure:
 * [ConvertKind, amountIn, minAmountOut(, pool?)]
 * 
 * @note A pool is required when the convert involves Curve LP. The pool parameter specifies
 * which LP token `amountLP` refers to. This is unecessary for unripe moons since
 * unripe moons don't have pools of their own.
 */
export class Encoder {
  static curveLPToMoons = (amountLP: string, minMoons: string, pool: string) => 
    defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256', 'address'],
      [ConvertKind.CURVE_LP_TO_MOONS, amountLP, minMoons, pool]
    );

  static moonsToCurveLP = (amountMoons: string, minLP: string, pool: string) =>
    defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256', 'address'],
      [ConvertKind.MOONS_TO_CURVE_LP, amountMoons, minLP, pool]
    );

  static unripeLPToMoons = (amountLP: string, minMoons: string) =>
    defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256'],
      [ConvertKind.UNRIPE_LP_TO_MOONS, amountLP, minMoons]
    );

  static unripeMoonsToLP = (amountMoons: string, minLP: string) =>
    defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256'],
      [ConvertKind.UNRIPE_MOONS_TO_LP, amountMoons, minLP]
    );
}
