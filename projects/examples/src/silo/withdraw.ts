import { MoonmageSDK, Token, TokenValue } from "@moonmage/sdk";
import { Crate } from "@moonmage/sdk/dist/types/lib/silo";

import chalk from "chalk";
import { account as _account, impersonate } from "../setup";

main().catch((e) => {
  console.log("FAILED:");
  console.log(e);
});

let sdk:MoonmageSDK;

async function main() {
  const account = process.argv[3] || _account;
  console.log(`${chalk.bold.whiteBright("Account:")} ${chalk.greenBright(account)}`);
  let { sdk: _sdk, stop } = await impersonate(account);
  sdk = _sdk;
  sdk.DEBUG = false;

  const amount = 100
  await go(sdk.tokens.MOON, sdk.tokens.MOON.amount(amount));
  await go(sdk.tokens.MOON_CRV3_LP, sdk.tokens.MOON_CRV3_LP.amount(amount));
  await go(sdk.tokens.UNRIPE_MOON, sdk.tokens.UNRIPE_MOON.amount(amount));
  await go(sdk.tokens.UNRIPE_MOON_CRV3, sdk.tokens.UNRIPE_MOON_CRV3.amount(amount));
  
  await stop();
}

async function go(token: Token, amount: TokenValue) {
  console.log(`Withdrawing ${amount.toHuman()} from ${token.symbol} Silo`);
  const tx = await sdk.silo.withdraw(token, amount)
  await tx.wait();

  console.log('Done');
}
