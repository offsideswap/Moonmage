import { ContractTransaction } from "ethers";
import { Token } from "src/classes/Token";
import { TokenValue } from "src/classes/TokenValue";
import { MoonmageSDK } from "../MoonmageSDK";

export class Transfer {
  static sdk: MoonmageSDK;

  constructor(sdk: MoonmageSDK) {
    Transfer.sdk = sdk;
  }

  /**
   * Initates a transfer from the silo.
   * @param token The token to transfer.
   * @param amount The desired amount to transfer. Must be 0 < amount <= total deposits for token
   * @param destinationAddress The destination address for the transfer
   * @returns Promise of Transaction
   */
  async transfer(token: Token, amount: TokenValue, destinationAddress: string): Promise<ContractTransaction> {
    if (!Transfer.sdk.tokens.siloWhitelist.has(token)) {
      throw new Error(`Transfer error; token ${token.symbol} is not a whitelisted asset`);
    }

    Transfer.sdk.debug("silo.transfer()", { token, amount, destinationAddress });

    const { deposited } = await Transfer.sdk.silo.getBalance(token);
    Transfer.sdk.debug("silo.transfer(): deposited balance", { deposited });

    if (deposited.amount.lt(amount)) {
      throw new Error("Insufficient balance");
    }

    const season = await Transfer.sdk.sun.getSeason();

    const transferData = await Transfer.sdk.silo.calculateWithdraw(token, amount, deposited.crates, season);
    Transfer.sdk.debug("silo.transfer(): transferData", { transferData });

    const seasons = transferData.crates.map((crate) => crate.season.toString());
    const amounts = transferData.crates.map((crate) => crate.amount.toBlockchain());

    let contractCall;

    if (seasons.length === 0) {
      throw new Error("Malformatted crates");
    }

    const sender = await Transfer.sdk.getAccount();
    if (seasons.length === 1) {
      contractCall = Transfer.sdk.contracts.moonmage.transferDeposit(
        sender,
        destinationAddress,
        token.address,
        seasons[0],
        amounts[0]
      );
    } else {
      contractCall = Transfer.sdk.contracts.moonmage.transferDeposits(
        sender,
        destinationAddress,
        token.address,
        seasons,
        amounts
      );
    }

    return contractCall;
  }
}
