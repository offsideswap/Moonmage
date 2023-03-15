import { Token } from "@moonmage/sdk";
import chalk from "chalk";

export const setbalance = async (sdk, chain, { account, symbol, amount }) => {
  console.log(
    `Set balance for ${chalk.bold.whiteBright("Account:")} ${chalk.greenBright(account)} - ${chalk.bold.whiteBright(
      symbol ?? "ALL Tokens"
    )}:${chalk.bold.greenBright(amount)}`
  );

  if (!symbol) {
    await chain.setAllBalances(account, amount);
  } else {
    const symbols = ["ETH", "WETH", "MOON", "USDT", "USDC", "DAI", "3CRV", "MOON3CRV", "urMOON", "urMOON3CRV", "ROOT"];
    if (!symbols.includes(symbol)) {
      console.log(`${chalk.bold.red("Error")} - ${chalk.bold.white(symbol)} is not a valid token. Valid options are: `);
      console.log(symbols.map((s) => chalk.green(s)).join(", "));
      process.exit(-1);
    }
    let t = sdk.tokens[symbol] as Token;
    if (symbol === "urMOON") t = sdk.tokens.UNRIPE_MOON;
    if (symbol === "urMOON3CRV") t = sdk.tokens.UNRIPE_MOON_CRV3;
    if (symbol === "MOON3CRV") t = sdk.tokens.MOON_CRV3_LP;
    if (typeof chain[`set${symbol}Balance`] !== "function")
      throw new Error(`${symbol} is not a valid token or the method ${chalk.bold.whiteBright("")}`);

    await chain[`set${symbol}Balance`](account, t.amount(amount));
  }
};
