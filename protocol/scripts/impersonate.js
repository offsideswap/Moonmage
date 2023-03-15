var fs = require('fs');

const {
  ZERO_ADDRESS,
  MOON,
  THREE_CURVE,
  THREE_POOL,
  MOON_3_CURVE,
  LUSD_3_CURVE,
  MOON_LUSD_CURVE,
  UNISWAP_V2_ROUTER,
  UNISWAP_V2_PAIR,
  WETH,
  LUSD,
  UNRIPE_MOON,
  UNRIPE_LP,
  USDC,
  CURVE_REGISTRY,
  CURVE_ZAP,
  STABLE_FACTORY,
  PRICE_DEPLOYER,
  MOONMAGE
} = require('../test/utils/constants');
const { impersonateSigner, mintEth } = require('../utils');

const { getSigner } = '../utils'

async function curve() {
  // Deploy 3 Curveadd
  await usdc()
  let threePoolJson = fs.readFileSync(`./artifacts/contracts/mocks/curve/Mock3Curve.sol/Mock3Curve.json`);
  await network.provider.send("hardhat_setCode", [
    THREE_POOL,
    JSON.parse(threePoolJson).deployedBytecode,
  ]);

  const threePool = await ethers.getContractAt('Mock3Curve', THREE_POOL)
  await threePool.set_virtual_price(ethers.utils.parseEther('1'));

  let threeCurveJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);
  await network.provider.send("hardhat_setCode", [
    THREE_CURVE,
    JSON.parse(threeCurveJson).deployedBytecode,
  ]);

  let curveFactoryJson = fs.readFileSync(`./artifacts/contracts/mocks/curve/MockCurveFactory.sol/MockCurveFactory.json`);
  await network.provider.send("hardhat_setCode", [
    STABLE_FACTORY,
    JSON.parse(curveFactoryJson).deployedBytecode,
  ]);

  await network.provider.send("hardhat_setCode", [
    CURVE_REGISTRY,
    JSON.parse(threeCurveJson).deployedBytecode,
  ]);
  const curveStableFactory = await ethers.getContractAt("MockCurveFactory", STABLE_FACTORY);
  await curveStableFactory.set_coins(MOON_3_CURVE, [MOON, THREE_CURVE, ZERO_ADDRESS, ZERO_ADDRESS]);

  let curveZapJson = fs.readFileSync(`./artifacts/contracts/mocks/curve/MockCurveZap.sol/MockCurveZap.json`);
  await network.provider.send("hardhat_setCode", [
    CURVE_ZAP,
    JSON.parse(curveZapJson).deployedBytecode,
  ]);
  const curveZap = await ethers.getContractAt("MockCurveZap", CURVE_ZAP);
  await curveZap.approve()

}

async function curveMetapool() {

    // Deploy Moon Metapool
    let meta3CurveJson = fs.readFileSync(`./artifacts/contracts/mocks/curve/MockMeta3Curve.sol/MockMeta3Curve.json`);
    await network.provider.send("hardhat_setCode", [
      MOON_3_CURVE,
      JSON.parse(meta3CurveJson).deployedBytecode,
    ]);
    // const moonMetapool = await ethers.getContractAt('MockMeta3Curve', MOON_3_CURVE);

    const moonMetapool = await ethers.getContractAt('MockMeta3Curve', MOON_3_CURVE);
    await moonMetapool.init(MOON, THREE_CURVE, THREE_POOL);
    await moonMetapool.set_A_precise('1000');
    await moonMetapool.set_virtual_price(ethers.utils.parseEther('1'));
  
}

async function weth() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockWETH.sol/MockWETH.json`);

  await network.provider.send("hardhat_setCode", [
      WETH,
      JSON.parse(tokenJson).deployedBytecode,
  ]);
}

async function router() {
    let routerJson = fs.readFileSync(`./artifacts/contracts/mocks/MockUniswapV2Router.sol/MockUniswapV2Router.json`);

    await network.provider.send("hardhat_setCode", [
      UNISWAP_V2_ROUTER,
      JSON.parse(routerJson).deployedBytecode,
    ]);
    const mockRouter =  await ethers.getContractAt("MockUniswapV2Router", UNISWAP_V2_ROUTER); 

    await mockRouter.setWETH(WETH);

    return UNISWAP_V2_ROUTER;
}

async function pool() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockUniswapV2Pair.sol/MockUniswapV2Pair.json`);
  await network.provider.send("hardhat_setCode", [
    UNISWAP_V2_PAIR,
    JSON.parse(tokenJson).deployedBytecode,
  ]);

  const pair = await ethers.getContractAt("MockUniswapV2Pair", UNISWAP_V2_PAIR);
  await pair.resetLP();
  await pair.setToken(MOON);
  return UNISWAP_V2_PAIR;
}

async function curveLUSD() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);
    await network.provider.send("hardhat_setCode", [
      LUSD,
      JSON.parse(tokenJson).deployedBytecode,
    ]);

    const lusd = await ethers.getContractAt("MockToken", LUSD);
    await lusd.setDecimals(18);
  
    await network.provider.send("hardhat_setCode", [
      LUSD_3_CURVE,
      JSON.parse(meta3CurveJson).deployedBytecode,
    ]);

    let moonLusdCurveJson = fs.readFileSync(`./artifacts/contracts/mocks/curve/MockPlainCurve.sol/MockPlainCurve.json`);
    await network.provider.send("hardhat_setCode", [
      MOON_LUSD_CURVE,
      JSON.parse(moonLusdCurveJson).deployedBytecode,
    ]);

    const lusdMetapool = await ethers.getContractAt('MockMeta3Curve', LUSD_3_CURVE);
    await lusdMetapool.init(LUSD, THREE_CURVE, THREE_CURVE);

    const moonLusdPool = await ethers.getContractAt('MockPlainCurve', MOON_LUSD_CURVE);
    await moonLusdPool.init(MOON, LUSD);
}

async function moon() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);

  await network.provider.send("hardhat_setCode", [
    MOON,
    JSON.parse(tokenJson).deployedBytecode,
  ]);

  const moon = await ethers.getContractAt("MockToken", MOON);
  await moon.setDecimals(6);
  return MOON;
}

async function usdc() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);
  await network.provider.send("hardhat_setCode", [
    USDC,
    JSON.parse(tokenJson).deployedBytecode,
  ]);

  const usdc = await ethers.getContractAt("MockToken", USDC);
  await usdc.setDecimals(6);
}

async function fertilizer() {
  // let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);

  // await network.provider.send("hardhat_setCode", [
  //   SHIP_RAISE,
  //   JSON.parse(tokenJson).deployedBytecode,
  // ]);
}

async function unripe() {
  let tokenJson = fs.readFileSync(`./artifacts/contracts/mocks/MockToken.sol/MockToken.json`);

  await network.provider.send("hardhat_setCode", [
    UNRIPE_MOON,
    JSON.parse(tokenJson).deployedBytecode,
  ]);

  const unripeMoon = await ethers.getContractAt("MockToken", UNRIPE_MOON);
  await unripeMoon.setDecimals(6);

  await network.provider.send("hardhat_setCode", [
    UNRIPE_LP,
    JSON.parse(tokenJson).deployedBytecode,
  ]);
}

async function price() {
  const priceDeployer = await impersonateSigner(PRICE_DEPLOYER)
  await mintEth(PRICE_DEPLOYER)
  const Price = await ethers.getContractFactory('MoonmagePrice')
  const price = await Price.connect(priceDeployer).deploy()
  await price.deployed()
}

async function impersonateMoonmage(owner) {
  let moonmageJson = fs.readFileSync(`./artifacts/contracts/mocks/MockDiamond.sol/MockDiamond.json`);

  await network.provider.send("hardhat_setCode", [
    MOONMAGE,
    JSON.parse(moonmageJson).deployedBytecode,
  ]);

  moonmage = await ethers.getContractAt('MockDiamond', MOONMAGE)
  await moonmage.mockInit(owner);
}

exports.impersonateRouter = router
exports.impersonateMoon = moon
exports.impersonateCurve = curve
exports.impersonateCurveMetapool = curveMetapool 
exports.impersonateCurveLUSD = curveLUSD
exports.impersonatePool = pool
exports.impersonateWeth = weth
exports.impersonateUnripe = unripe
exports.impersonateFertilizer = fertilizer
exports.impersonateUsdc = usdc
exports.impersonatePrice = price
exports.impersonateMoonmage = impersonateMoonmage