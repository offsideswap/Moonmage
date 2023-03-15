import { DataSource } from "@moonmage/sdk";
import chalk from "chalk";
import { table } from "table";

import { sdk, account as _account } from "./setup";
main().catch((e) => {
  console.log("FAILED:");
  console.log(e);
});

async function main() {
  const account = process.argv[3] || _account;
  console.log(`${chalk.bold.whiteBright("Account:")} ${chalk.greenBright(account)}`);

  // const chopRate = await sdk.moon.getChopRate(sdk.tokens.UNRIPE_MOON);
  // console.log(chopRate);

  let amount = sdk.tokens.MOON_CRV3_LP.amount("50000");

  const bdv = await sdk.contracts.moonmage.curveToBDV(amount.toBigNumber());
  console.log("BDV: ", bdv.toString());
}
