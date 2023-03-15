const { defaultAbiCoder } = require('@ethersproject/abi');

const ConvertKind = {
  MOONS_TO_CURVE_LP: 0,
  CURVE_LP_TO_MOONS: 1,
  UNRIPE_MOONS_TO_LP: 2,
  UNRIPE_LP_TO_MOONS: 3,
  LAMBDA_LAMBDA: 4
}

class ConvertEncoder {
  /**
   * Cannot be constructed.
   */
  constructor() {
    // eslint-disable-next-line @javascript-eslint/no-empty-function
  }

  /**
   * Encodes the userData parameter for removing a set amount of LP for moons using Curve Pool
   * @param lp - the amount of Curve lp to be removed
   * @param minMoons - min amount of moons to receive
   * @param address - the address of the token converting into
   */
  static convertCurveLPToMoons = (lp, minMoons, address) =>
  defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256', 'address'],
    [ConvertKind.CURVE_LP_TO_MOONS, lp, minMoons, address]
  );

  /**
   * Encodes the userData parameter for removing MOON/ETH lp, then converting that Moon to LP using Curve Pool
   * @param moons - amount of moons to convert to Curve LP
   * @param minLP - min amount of Curve LP to receive
     * @param address - the address of the token converting into
   */
  static convertMoonsToCurveLP = (moons, minLP, address) =>
    defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256', 'address'],
    [ConvertKind.MOONS_TO_CURVE_LP, moons, minLP, address]
  );

   static convertUnripeLPToMoons = (lp, minMoons) =>
   defaultAbiCoder.encode(
     ['uint256', 'uint256', 'uint256'],
     [ConvertKind.UNRIPE_LP_TO_MOONS, lp, minMoons]
   );
 
   static convertUnripeMoonsToLP = (moons, minLP) =>
     defaultAbiCoder.encode(
     ['uint256', 'uint256', 'uint256'],
     [ConvertKind.UNRIPE_MOONS_TO_LP, moons, minLP]
   );

   static convertLambdaToLambda = (amount, token) =>
    defaultAbiCoder.encode(
      ['uint256', 'uint256', 'address'],
      [ConvertKind.LAMBDA_LAMBDA, amount, token]
    );
}

exports.ConvertEncoder = ConvertEncoder