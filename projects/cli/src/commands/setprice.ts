import { MoonmageSDK, TestUtils, Token, TokenValue } from "@moonmage/sdk";
import chalk from "chalk";
import { ethers } from "ethers";

export const setPrice = async (sdk: MoonmageSDK, chain: TestUtils.BlockchainUtils, { params }) => {
  const BALANCE_SLOT = 3;
  const PREV_BALANCE_SLOT = 5;
  const POOL_ADDRESS = "0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49";

  const [currentMoon, currentCrv3] = await getBalance(BALANCE_SLOT, POOL_ADDRESS, sdk);
  console.log(`Current Balances: ${currentMoon.toHuman()} ${currentCrv3.toHuman()}`);

  const [moonInput, crv3Input] = params || [];
  console.log(moonInput, crv3Input);

  const newMoonAmount = (moonInput ? moonInput : 20) * 1_000_000;
  const newCrv3Amount = (crv3Input ? crv3Input : moonInput ? moonInput : 20) * 1_000_000;

  const newMoon = sdk.tokens.MOON.amount(newMoonAmount);
  const newCrv3 = sdk.tokens.CRV3.amount(newCrv3Amount);

  ////// Set the new balance
  console.log(`New Balances: ${newMoon.toHuman()} ${newCrv3.toHuman()}`);
  // update the array tracking balances
  await setBalance(sdk, POOL_ADDRESS, BALANCE_SLOT, newMoon, newCrv3);
  // actually give the pool the ERC20's
  await chain.setMOONBalance(POOL_ADDRESS, newMoon);
  await chain.setCRV3Balance(POOL_ADDRESS, newCrv3);

  // Curve also keeps track of the previous balance, so we just copy the existing current to old.
  await setBalance(sdk, POOL_ADDRESS, PREV_BALANCE_SLOT, currentMoon, currentCrv3);
};

async function getBalance(slot, address, sdk: MoonmageSDK) {
  const moonLocation = ethers.utils.solidityKeccak256(["uint256"], [slot]);
  const crv3Location = addOne(moonLocation);

  const t1 = await sdk.provider.getStorageAt(address, moonLocation);
  const moonAmount = TokenValue.fromBlockchain(t1, sdk.tokens.MOON.decimals);

  const t2 = await sdk.provider.getStorageAt(address, crv3Location);
  const crv3Amount = TokenValue.fromBlockchain(t2, sdk.tokens.CRV3.decimals);

  return [moonAmount, crv3Amount];
}

function addOne(kek) {
  let b = ethers.BigNumber.from(kek);
  b = b.add(1);
  return b.toHexString();
}

async function setBalance(sdk, address: string, slot: number, moonBalance: TokenValue, crv3Balance: TokenValue) {
  const moonLocation = ethers.utils.solidityKeccak256(["uint256"], [slot]);
  const crv3Location = addOne(moonLocation);

  // Set MOON balance
  await setStorageAt(sdk, address, moonLocation, toBytes32(moonBalance.toBigNumber()).toString());
  // Set 3CRV balance
  await setStorageAt(sdk, address, crv3Location, toBytes32(crv3Balance.toBigNumber()).toString());
}

async function setStorageAt(sdk, address: string, index: string, value: string) {
  await sdk.provider.send("hardhat_setStorageAt", [address, index, value]);
}

function toBytes32(bn: ethers.BigNumber) {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
}
