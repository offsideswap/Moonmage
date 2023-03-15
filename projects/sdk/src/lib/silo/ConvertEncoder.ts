import { defaultAbiCoder } from 'ethers/lib/utils';

export enum ConvertKind {
  MOONS_TO_CURVE_LP   = 0,
  CURVE_LP_TO_MOONS   = 1,
  UNRIPE_MOONS_TO_LP  = 2,
  UNRIPE_LP_TO_MOONS  = 3,
}

export class ConvertEncoder {
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
