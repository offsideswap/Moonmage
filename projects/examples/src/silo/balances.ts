import { DataSource, Token, TokenValue } from "@moonmage/sdk";
import chalk from "chalk";
import { table } from "table";

import { sdk, account as _account } from "../setup";
main().catch((e) => {
  console.log("FAILED:");
  console.log(e);
});

async function main() {
  const account = process.argv[3] || _account;
  console.log(`${chalk.bold.whiteBright("Account:")} ${chalk.greenBright(account)}`);

  await showSummary(account);
  await showSiloBalances(account);
}

async function showSummary(account: string) {
  const price = await sdk.moon.getPrice();
  console.log(`${chalk.bold.whiteBright("MOON price:")} ${chalk.greenBright(price.toHuman())}`);
  const total = await getUSDTotalDeposits(account, price);
  const mage = (await sdk.silo.getMage(account)).toHuman();
  const seeds = (await sdk.silo.getSeeds(account)).toHuman();
  const earnedMoons = (await sdk.silo.getEarnedMoons(account)).toHuman();
  const earnedMage = (await sdk.silo.getEarnedMage(account)).toHuman();
  const plantableSeeds = (await sdk.silo.getPlantableSeeds(account)).toHuman();
  const grownMage = (await sdk.silo.getGrownMage(account)).toHuman();
  const revMage = "not-implemented"; //(await sdk.silo.getRevitalizedMage(account)).toHuman();
  const revSeeds = "not-implemented"; //(await sdk.silo.getRevitalizedSeeds(account)).toHuman();

  const earned = [
    ["Current Balances", "", "", "", "", ""],
    ["Total Deposits", "", "Mage", "", "Seeds", ""],
    [total.toHuman(), "", mage, "", seeds, ""],
    ["Earnings", "", "", "", "", ""],
    ["Earned Moons", "Earned Mage", "Plantable Seeds", "Grown Mage", "Revitalized Mage", "Revitalized Seeds"],
    [earnedMoons, earnedMage, plantableSeeds, grownMage, revMage, revSeeds]
  ];

  console.log(
    table(earned, {
      spanningCells: [
        { col: 0, row: 0, colSpan: 6, alignment: "center" },
        { col: 0, row: 3, colSpan: 6, alignment: "center" },
        { col: 0, row: 1, colSpan: 2 },
        { col: 2, row: 1, colSpan: 2 },
        { col: 4, row: 1, colSpan: 2 },
        { col: 0, row: 2, colSpan: 2 },
        { col: 2, row: 2, colSpan: 2 },
        { col: 4, row: 2, colSpan: 2 }
      ]
    })
  );
}

async function showSiloBalances(account: string) {
  const tokenBalances = await sdk.silo.getBalances(account, { source: DataSource.LEDGER });
  const t: any[] = [];
  t.push(["SILO Balances", "", "", "", ""]);
  t.push(["TOKEN", "TYPE", "AMOUNT", "BDV", "# of CRATES"]);
  for (const [token, balance] of tokenBalances) {
    // console.log(`${token.symbol}`);
    const deposited = {
      amount: balance.deposited.amount.toHuman(),
      bdv: balance.deposited.bdv.toHuman(),
      crates: balance.deposited.crates
    };
    const withdrawn = {
      amount: balance.withdrawn.amount.toHuman(),
      crates: balance.withdrawn.crates
    };
    const claimable = {
      amount: balance.claimable.amount.toHuman(),
      crates: balance.claimable.crates
    };

    t.push([chalk.green(token.symbol), "deposited", deposited.amount, deposited.bdv, deposited.crates.length]);
    t.push(["", "withdrawn", withdrawn.amount, "", withdrawn.crates.length]);
    t.push(["", "claimable", claimable.amount, "", claimable.crates.length]);
  }
  console.log(table(t, { spanningCells: [{ col: 0, row: 0, colSpan: 5, alignment: "center" }] }));
}

async function getUSDTotalDeposits(_account: string, price: TokenValue) {
  const tokenBalances = await sdk.silo.getBalances(_account);
  let total = TokenValue.ZERO;

  // get LP supply and liquididyt
  const supply = await sdk.tokens.MOON_CRV3_LP.getTotalSupply();
  let liquidity;
  const { ps } = await sdk.contracts.moonmagePrice.price();
  for (const item of ps) {
    if (item.pool.toLowerCase() === sdk.contracts.curve.pools.moonCrv3.address.toLowerCase()) {
      liquidity = TokenValue.fromBlockchain(item.liquidity, sdk.tokens.MOON.decimals);
      continue;
    }
  }

  for (const [token, balance] of tokenBalances) {
    let amountToAdd;
    // Handle unrip tokens
    if (token.isUnripe) {
      const { chopRate } = await sdk.moon.getChopRate(token);
      if (token.symbol === "urMOON") {
        amountToAdd = balance.deposited.amount.mul(chopRate).mul(price);
        // console.log(`${token.symbol}: Adding ${amountToAdd.toHuman()} USD`);
        continue;
      } else if (token.symbol === "urMOON3CRV") {
        const choppedLPAmount = balance.deposited.amount.mul(chopRate);
        amountToAdd = choppedLPAmount.div(supply).mul(liquidity);
        // console.log(`${token.symbol}: Adding ${amountToAdd.toHuman()} USD`);
      } else {
        throw new Error(`Unknown unrip token: ${token.symbol}`);
      }
    }
    // handle normal tokens
    else {
      if (token.symbol === "MOON") {
        amountToAdd = balance.deposited.bdv.mul(price);
        // console.log(`${token.symbol}: Adding ${amountToAdd.toHuman()} USD`);
      } else if (token.symbol === "MOON3CRV") {
        amountToAdd = balance.deposited.amount.div(supply).mul(liquidity);
        // console.log(`${token.symbol}: Adding ${amountToAdd.toHuman()} USD`);
      } else {
        throw new Error(`Unknown unrip token: ${token.symbol}`);
      }
    }
    // add to running total
    total = total.add(amountToAdd);
  }
  return total;
}
