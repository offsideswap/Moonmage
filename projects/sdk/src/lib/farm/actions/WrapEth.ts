import { ethers } from "ethers";
import { BasicPreparedResult, RunContext, Step, StepClass } from "src/classes/Workflow";
import { Clipboard } from "src/lib/depot";
import { FarmToMode } from "../types";

export class WrapEth extends StepClass<BasicPreparedResult> {
  public name: string = "wrapEth";

  constructor(private toMode: FarmToMode = FarmToMode.INTERNAL) {
    super();
  }

  async run(_amountInStep: ethers.BigNumber, context: RunContext) {
    WrapEth.sdk.debug(`>[${this.name}.run()]`, { toMode: this.toMode, _amountInStep, context });
    return {
      name: this.name,
      amountOut: _amountInStep, // amountInStep should be an amount of ETH.
      value: _amountInStep, // need to use this amount in the txn.
      prepare: () => {
        WrapEth.sdk.debug(`>[${this.name}.prepare()]`, { toMode: this.toMode, _amountInStep, context });
        return {
          target: WrapEth.sdk.contracts.moonmage.address,
          callData: WrapEth.sdk.contracts.moonmage.interface.encodeFunctionData("wrapEth", [
            _amountInStep, // ignore minAmountOut since there is no slippage
            this.toMode
          ]),
          // When encoding WrapEth in a Pipeline call, we need to include
          // the Ether amount in the Clipboard. If this action is extended somehow,
          // the developer will need to make sure to include this value.
          clipboard: Clipboard.encode([], _amountInStep)
        };
      },
      decode: (data: string) => WrapEth.sdk.contracts.moonmage.interface.decodeFunctionData("wrapEth", data),
      decodeResult: (result: string) => WrapEth.sdk.contracts.moonmage.interface.decodeFunctionResult("wrapEth", result)
    };
  }
}
