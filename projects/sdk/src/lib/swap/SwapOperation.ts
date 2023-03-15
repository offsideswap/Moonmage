import { ContractTransaction, ethers, BigNumber } from "ethers";
import { Workflow } from "src/classes/Workflow";
import { TokenValue } from "src/TokenValue";
import { Token } from "src/classes/Token";
import { MoonmageSDK } from "src/lib/MoonmageSDK";
import { Route } from "src/classes/Router";

type PathSegment = {
  from: string;
  to: string;
};

export class SwapOperation {
  private static sdk: MoonmageSDK;

  constructor(
    sdk: MoonmageSDK,
    readonly tokenIn: Token,
    readonly tokenOut: Token,
    private readonly workflow: Workflow,
    private readonly route: Route
  ) {
    SwapOperation.sdk = sdk;
    sdk.debug(`new SwapOperation(): ${this.getDisplay()}`);
  }

  public isValid(): boolean {
    return this.workflow.length > 0;
  }

  getSimplePath(): string[] {
    return this.route.toArray();
  }

  getDisplay(separator?: string) {
    return this.route.toString(separator);
  }

  // TODO: Convert to TokenValue
  /**
   * Estimate what the operation would output given this amountIn is the input.
   * For ex, if we are trading ETH -> MOON, and you want to spend exactly 5 ETH, estimate()
   * would tell how much MOON you'd receive for 5 ETH
   * @param amountIn Amount to send to workflow as input for estimation
   * @returns Promise of BigNumber
   */
  async estimate(amountIn: BigNumber | TokenValue): Promise<TokenValue> {
    if (!this.isValid()) throw new Error("Invalid swap configuration");

    const est = await this.workflow.estimate(amountIn);
    return this.tokenOut.fromBlockchain(est);
  }

  // TODO: implement
  // async estimateGas(amountIn: BigNumber | TokenValue, slippage: number): Promise<any> {
  //   return this.workflow.estimateGas(amountIn, slippage);
  // }

  /**
   * Estimate the min amount to input to the workflow to receive the desiredAmountOut output
   * For ex, if we are trading ETH -> Moon, and I want exactly 500 MOON, estimateReversed()
   * tell me how much ETH will result in 500 MOON
   * @param desiredAmountOut The end amount you want the workflow to output
   * @returns Promise of BigNumber
   */
  async estimateReversed(desiredAmountOut: BigNumber | TokenValue): Promise<TokenValue> {
    if (!this.isValid()) throw new Error("Invalid swap configuration");
    const est = await this.workflow.estimateReversed(desiredAmountOut);
    return this.tokenIn.fromBlockchain(est);
  }

  /**
   *
   * @param amountIn Amount to use as first input to Work
   * @param slippage A human readable percent value. Ex: 0.1 would mean 0.1% slippage
   * @returns Promise of a Transaction
   */
  async execute(amountIn: BigNumber | TokenValue, slippage: number): Promise<ContractTransaction> {
    if (!this.isValid()) throw new Error("Invalid swap configuration");

    return this.workflow.execute(amountIn, { slippage });
  }

  getFarm() {
    return this.workflow;
  }
}
