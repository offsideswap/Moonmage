import { Token } from "src/classes/Token";
import { TokenValue } from "src/TokenValue";
import { getTestUtils } from "src/utils/TestUtils/provider";
import { FarmFromMode, FarmToMode } from "src/lib/farm/types";

const { sdk, account, utils } = getTestUtils();
jest.setTimeout(30000);
async function reset() {
  await utils.resetFork();
}

beforeAll(async () => {
  // TODO: will reset() screw up other tests (files) that run in parallel?
  await reset();

  // add a bit of each coin
  await Promise.all([
    utils.setDAIBalance(account, sdk.tokens.DAI.amount(30000)),
    utils.setUSDCBalance(account, sdk.tokens.USDC.amount(30000)),
    utils.setUSDTBalance(account, sdk.tokens.USDT.amount(30000)),
    utils.setCRV3Balance(account, sdk.tokens.CRV3.amount(30000)),
    utils.setWETHBalance(account, sdk.tokens.WETH.amount(30000)),
    utils.setMOONBalance(account, sdk.tokens.MOON.amount(30000))
  ]);
  await utils.mine();

  // set max allowance
  await Promise.all([
    await sdk.tokens.DAI.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber()),
    await sdk.tokens.USDC.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber()),
    await sdk.tokens.USDT.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber()),
    await sdk.tokens.CRV3.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber()),
    await sdk.tokens.WETH.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber()),
    await sdk.tokens.MOON.approve(sdk.contracts.moonmage.address, TokenValue.MAX_UINT256.toBigNumber())
  ]);
});

describe("Swap", function () {
  describe.each([
    // ETH => x
    [sdk.tokens.ETH, sdk.tokens.WETH],
    [sdk.tokens.ETH, sdk.tokens.USDT],
    [sdk.tokens.ETH, sdk.tokens.USDC],
    [sdk.tokens.ETH, sdk.tokens.DAI],
    [sdk.tokens.ETH, sdk.tokens.MOON],
    [sdk.tokens.ETH, sdk.tokens.CRV3],

    // MOON => x
    [sdk.tokens.MOON, sdk.tokens.ETH],
    [sdk.tokens.MOON, sdk.tokens.WETH],
    [sdk.tokens.MOON, sdk.tokens.MOON],
    [sdk.tokens.MOON, sdk.tokens.USDT],
    [sdk.tokens.MOON, sdk.tokens.USDC],
    [sdk.tokens.MOON, sdk.tokens.DAI],
    [sdk.tokens.MOON, sdk.tokens.MOON],
    [sdk.tokens.MOON, sdk.tokens.CRV3]
  ])("MOON->x", (tokenIn, tokenOut) => {
    it.each([
      [FarmFromMode.EXTERNAL, FarmToMode.EXTERNAL],
      [FarmFromMode.EXTERNAL, FarmToMode.INTERNAL]
    ])(`swap(${tokenIn.symbol}, ${tokenOut.symbol}, %s, %s)`, async (from, to) => {
      if (tokenOut.symbol === "ETH" && to === FarmToMode.INTERNAL) {
        return;
      }
      await swapTest(tokenIn, tokenOut, from, to);
    });
  });

  // x => MOON
  describe.each([sdk.tokens.USDC, sdk.tokens.USDT, sdk.tokens.DAI, sdk.tokens.CRV3, sdk.tokens.MOON])("Buy MOON", (tokenIn) => {
    const MOON = sdk.tokens.MOON;

    beforeAll(async () => {
      await transferToFarmBalance(tokenIn, "10000");
    });

    it(`${tokenIn.symbol}:MOON - EXTERNAL -> INTERNAL`, async () => {
      await swapTest(tokenIn, MOON, FarmFromMode.EXTERNAL, FarmToMode.INTERNAL, "2000");
    });
    it(`${tokenIn.symbol}:MOON - EXTERNAL -> EXTERNAL`, async () => {
      await swapTest(tokenIn, MOON, FarmFromMode.EXTERNAL, FarmToMode.EXTERNAL, "2000");
    });
    it(`${tokenIn.symbol}:MOON - INTERNAL -> INTERNAL`, async () => {
      await swapTest(tokenIn, MOON, FarmFromMode.INTERNAL, FarmToMode.INTERNAL, "2000");
    });
    it(`${tokenIn.symbol}:MOON - INTERNAL -> EXTERNAL`, async () => {
      await swapTest(tokenIn, MOON, FarmFromMode.INTERNAL, FarmToMode.EXTERNAL, "2000");
    });
  });
});

async function transferToFarmBalance(tokenIn: Token, _amount: string) {
  const tx = await sdk.contracts.moonmage.transferToken(
    tokenIn.address,
    account,
    tokenIn.amount(_amount).toBlockchain(),
    FarmFromMode.EXTERNAL,
    FarmToMode.INTERNAL
  );
  await tx.wait();
}

async function swapTest(tokenIn: Token, tokenOut: Token, from: FarmFromMode, to: FarmToMode, _amount?: string) {
  const tokenInBalanceBefore = await getBalance(tokenIn, from);
  const tokenOutBalanceBefore = await getBalance(tokenOut, to);
  const v = ["ETH", "WETH"].includes(tokenIn.symbol) ? 30 : 300;
  const amount = tokenIn.fromHuman(_amount ? _amount : v);
  const slippage = 0.5;
  const amountWithSlippage = amount.pct(100 - slippage);

  // Checks there are tokens to spend
  expect(tokenInBalanceBefore.gte(amount)).toBe(true);

  // Checks the swap is valid
  const op = sdk.swap.buildSwap(tokenIn, tokenOut, account, from, to);
  expect(op.isValid()).toBe(true);

  let tx = await (await op.execute(amount, slippage)).wait();
  expect(tx.status).toBe(1);

  const tokenInBalanceAfter = await getBalance(tokenIn, from);
  const tokenOutBalanceAfter = await getBalance(tokenOut, to);

  // There are less tokenIn than before the swapped
  expect(tokenInBalanceAfter.lt(tokenInBalanceBefore));
  // There are more tokenOut after the swap
  expect(tokenOutBalanceAfter.gt(tokenOutBalanceBefore));
  // tokenOut balance is bigger than desired swap ammount, with some slippage tollerance
  expect(tokenOutBalanceAfter.gte(amountWithSlippage));
}

async function getBalance(token: Token, mode: string) {
  const balances = await sdk.tokens.getBalance(token, account);
  if (mode === "0") {
    return balances.external;
  }
  if (mode === "1") {
    return balances.internal;
  }
  if (mode === "all") {
    return balances.total;
  }
  throw new Error("Unknow mode");
}
