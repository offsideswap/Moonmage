import { Token } from "src/classes/Token";
import { TokenValue } from "src/classes/TokenValue";
import { MoonmageSDK } from "./MoonmageSDK";

export class Moon {
  static sdk: MoonmageSDK;

  constructor(sdk: MoonmageSDK) {
    Moon.sdk = sdk;
  }

  /**
   * Returns the current MOON price
   */
  async getPrice() {
    const [price, totalSupply, deltaB] = await Moon.sdk.contracts.moonmagePrice.price();

    return TokenValue.fromBlockchain(price, 6);
  }

    /**
   * Returns the deltaB
   */
    async getDeltaB() {
      const [price, totalSupply, deltaB] = await Moon.sdk.contracts.moonmagePrice.price();
  
      return TokenValue.fromBlockchain(deltaB, 6);
    }

  /**
   * Get the chop rate for an Unripe asset.
   * `chopRate` is the conversion rate between Unripe -> Ripe, for ex: 0.5%
   * `chopPenalty` is the inverse, the % penalty if chopping, (1 - Chop Rate) x 100%, for ex, 99.5%
   * @param urToken
   * @returns
   */
  async getChopRate(urToken: Token) {
    if (!urToken.isUnripe) throw new Error("Token must be unripe to get chop rate");
    const [chopRate, underlying, supply] = await Promise.all([
      Moon.sdk.contracts.moonmage.getPercentPenalty(urToken.address).then((x) => TokenValue.fromBlockchain(x, urToken.decimals)),
      Moon.sdk.contracts.moonmage.getTotalUnderlying(urToken.address).then((x) => TokenValue.fromBlockchain(x, urToken.decimals)),
      urToken.getTotalSupply()
    ]);

    const result = {
      chopRate,
      chopPenalty: TokenValue.ONE.sub(chopRate).mul(100),
      underlying,
      supply
    };

    return result;
  }

  /**
   * Returns the "Moon Denominated Value" of the specified token amount
   * @param token
   * @param amount
   * @returns TokenValue of BDV, with 6 decimals
   * @todo cache these results?
   */
  async getBDV(token: Token, amount: TokenValue): Promise<TokenValue> {
    const bdv = await Moon.sdk.contracts.moonmage.bdv(token.address, amount.toBigNumber());

    // We treat BDV as a TokenValue with 6 decimals, like MOON
    return TokenValue.fromBlockchain(bdv, 6);
  }
}
