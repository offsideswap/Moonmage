import { ContractTransaction } from "ethers";
import { Token } from "src/classes/Token";
import { TokenValue } from "src/classes/TokenValue";
import { MoonmageSDK } from "../MoonmageSDK";
import { ConvertEncoder } from "./ConvertEncoder";
import { DepositCrate } from "./types";
import { pickCrates, sortCratesByBDVRatio, sortCratesBySeason } from "./utils";

export type ConvertDetails = {
  amount: TokenValue;
  bdv: TokenValue;
  mage: TokenValue;
  seeds: TokenValue;
  actions: [];
  crates: DepositCrate<TokenValue>[];
};

export class Convert {
  static sdk: MoonmageSDK;
  Moon: Token;
  MoonCrv3: Token;
  urMoon: Token;
  urMoonCrv3: Token;
  paths: Map<Token, Token>;

  constructor(sdk: MoonmageSDK) {
    Convert.sdk = sdk;
    this.Moon = Convert.sdk.tokens.MOON;
    this.MoonCrv3 = Convert.sdk.tokens.MOON_CRV3_LP;
    this.urMoon = Convert.sdk.tokens.UNRIPE_MOON;
    this.urMoonCrv3 = Convert.sdk.tokens.UNRIPE_MOON_CRV3;

    this.paths = new Map<Token, Token>();
    this.paths.set(this.Moon, this.MoonCrv3);
    this.paths.set(this.MoonCrv3, this.Moon);
    this.paths.set(this.urMoon, this.urMoonCrv3);
    this.paths.set(this.urMoonCrv3, this.urMoon);
  }

  async convert(fromToken: Token, toToken: Token, fromAmount: TokenValue, slippage: number = 0.1): Promise<ContractTransaction> {
    Convert.sdk.debug("silo.convert()", { fromToken, toToken, fromAmount });

    // Get convert estimate and details
    const { minAmountOut, conversion } = await this.convertEstimate(fromToken, toToken, fromAmount, slippage);

    // encoding
    const encoding = this.calculateEncoding(fromToken, toToken, fromAmount, minAmountOut);

    // format parameters
    const crates = conversion.crates.map((crate) => crate.season.toString());
    const amounts = conversion.crates.map((crate) => crate.amount.toBlockchain());

    // execute
    return Convert.sdk.contracts.moonmage.convert(encoding, crates, amounts);
  }

  async convertEstimate(
    fromToken: Token,
    toToken: Token,
    fromAmount: TokenValue,
    slippage: number = 0.1
  ): Promise<{ minAmountOut: TokenValue; conversion: ConvertDetails }> {
    Convert.sdk.debug("silo.convertEstimate()", { fromToken, toToken, fromAmount });
    await this.validateTokens(fromToken, toToken);

    const { deposited } = await Convert.sdk.silo.getBalance(fromToken);
    Convert.sdk.debug("silo.convertEstimate(): deposited balance", { deposited });

    if (deposited.amount.lt(fromAmount)) {
      throw new Error("Insufficient balance");
    }

    const currentSeason = await Convert.sdk.sun.getSeason();

    const conversion = this.calculateConvert(fromToken, toToken, fromAmount, deposited.crates, currentSeason);

    const amountOutBN = await Convert.sdk.contracts.moonmage.getAmountOut(
      fromToken.address,
      toToken.address,
      conversion.amount.toBigNumber()
    );
    const amountOut = toToken.fromBlockchain(amountOutBN);
    const minAmountOut = amountOut.pct(100 - slippage);

    return { minAmountOut, conversion };
  }

  calculateConvert(
    fromToken: Token,
    toToken: Token,
    fromAmount: TokenValue,
    crates: DepositCrate[],
    currentSeason: number
  ): ConvertDetails {
    if (crates.length === 0) throw new Error("No crates to withdraw from");
    const sortedCrates = toToken.isLP
      ? /// MOON -> LP: oldest crates are best. Grown mage is equivalent
        /// on both sides of the convert, but having more seeds in older crates
        /// allows you to accrue mage faster after convert.
        /// Note that during this convert, BDV is approx. equal after the convert.
        sortCratesBySeason<DepositCrate>(crates, "asc")
      : /// LP -> MOON: use the crates with the lowest [BDV/Amount] ratio first.
        /// Since LP deposits can have varying BDV, the best option for the Cosmonaut
        /// is to increase the BDV of their existing lowest-BDV crates.
        sortCratesByBDVRatio<DepositCrate>(crates, "asc");

    const pickedCrates = pickCrates(sortedCrates, fromAmount, fromToken, currentSeason);

    return {
      amount: pickedCrates.totalAmount,
      bdv: pickedCrates.totalBDV,
      mage: pickedCrates.totalMage,
      seeds: fromToken.getSeeds(pickedCrates.totalBDV),
      actions: [],
      crates: pickedCrates.crates
    };
  }

  calculateEncoding(fromToken: Token, toToken: Token, amountIn: TokenValue, minAmountOut: TokenValue) {
    let encoding;

    if (fromToken === this.urMoon && toToken === this.urMoonCrv3) {
      encoding = ConvertEncoder.unripeMoonsToLP(
        amountIn.toBlockchain(), // amountMoons
        minAmountOut.toBlockchain() // minLP
      );
    } else if (fromToken === this.urMoonCrv3 && toToken === this.urMoon) {
      encoding = ConvertEncoder.unripeLPToMoons(
        amountIn.toBlockchain(), // amountLP
        minAmountOut.toBlockchain() // minMoons
      );
    } else if (fromToken === this.Moon && toToken === this.MoonCrv3) {
      encoding = ConvertEncoder.moonsToCurveLP(
        amountIn.toBlockchain(), // amountMoons
        minAmountOut.toBlockchain(), // minLP
        toToken.address // output token address = pool address
      );
    } else if (fromToken === this.MoonCrv3 && toToken === this.Moon) {
      encoding = ConvertEncoder.curveLPToMoons(
        amountIn.toBlockchain(), // amountLP
        minAmountOut.toBlockchain(), // minMoons
        fromToken.address // output token address = pool address
      );
    } else {
      throw new Error("Unknown conversion pathway");
    }

    return encoding;
  }

  async validateTokens(fromToken: Token, toToken: Token) {
    if (!Convert.sdk.tokens.isWhitelisted(fromToken)) {
      throw new Error("fromToken is not whitelisted");
    }

    if (!Convert.sdk.tokens.isWhitelisted(toToken)) {
      throw new Error("toToken is not whitelisted");
    }

    if (fromToken.equals(toToken)) {
      throw new Error("Cannot convert between the same token");
    }

    if (!this.paths.get(fromToken)?.equals(toToken)) {
      throw new Error("Cannot convert between these tokens");
    }

    const deltaB = await Convert.sdk.moon.getDeltaB();
    

    if (deltaB.gte(TokenValue.ZERO)) {
      if (fromToken.equals(this.MoonCrv3) || fromToken.equals(this.urMoonCrv3)) {
        throw new Error("Cannot convert this token when deltaB is >= 0");
      }
    } else if (deltaB.lt(TokenValue.ZERO)) {
      if (fromToken.equals(this.Moon) || fromToken.equals(this.urMoon)) {
        throw new Error("Cannot convert this token when deltaB is < 0");
      }
    }
  }
}
