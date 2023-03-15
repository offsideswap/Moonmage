const { expect } = require('chai');
const { deploy } = require('../scripts/deploy.js');
const { deployPipeline, impersonatePipeline, } = require('../scripts/pipeline.js');
const { getAltMoonmage, getMoon, getUsdc } = require('../utils/contracts.js');
const { toBN, encodeAdvancedData } = require('../utils/index.js');
const { impersonateSigner } = require('../utils/signer.js');
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js');
const { MOON_3_CURVE, THREE_POOL, THREE_CURVE, STABLE_FACTORY, WETH, ZERO_ADDRESS } = require('./utils/constants.js');
const { to6, to18 } = require('./utils/helpers.js');
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let user, user2, owner;
let userAddress, ownerAddress, user2Address;
let timestamp;

async function getTimestamp() {
  return (await ethers.provider.getBlock('latest')).timestamp
}

async function getTimepassed() {
  return ethers.BigNumber.from(`${(await getTimestamp()) - timestamp}`)
}

describe('Farm Advanced', function () {
  before(async function () {
    [owner, user, user2] = await ethers.getSigners();
    userAddress = user.address;
    user2Address = user2.address;
    const contracts = await deploy("Test", false, true);
    this.moonmage = await getAltMoonmage(contracts.moonmageDiamond.address)
    this.moon = await getMoon()
    this.usdc = await getUsdc()
    this.threeCurve = await ethers.getContractAt('MockToken', THREE_CURVE)
    this.threePool = await ethers.getContractAt('Mock3Curve', THREE_POOL)
    this.moonMetapool = await ethers.getContractAt('MockMeta3Curve', MOON_3_CURVE)
    this.weth = await ethers.getContractAt("MockWETH", WETH)

    const account = impersonateSigner('0x533545dE45Bd44e6B5a6D649256CCfE3b6E1abA6')
    pipeline = await impersonatePipeline(account)

    this.mockContract = await (await ethers.getContractFactory('MockContract', owner)).deploy()
    await this.mockContract.deployed()
    await this.mockContract.setAccount(user2.address)

    await this.moon.mint(user.address, to6('1000'))
    await this.usdc.mint(user.address, to6('1000'))

    await this.moon.connect(user).approve(this.moonmage.address, to18('1'))
    await this.usdc.connect(user).approve(this.moonmage.address, to18('1'))

    await this.moon.connect(user).approve(this.moonmage.address, '100000000000')
    await this.moon.connect(user).approve(this.moonMetapool.address, '100000000000')
    await this.moon.mint(userAddress, to6('10000'))

    await this.threeCurve.mint(userAddress, to18('1000'))
    await this.threePool.set_virtual_price(to18('1'))
    await this.threeCurve.connect(user).approve(this.moonMetapool.address, to18('100000000000'))

    await this.moonMetapool.set_A_precise('1000')
    await this.moonMetapool.set_virtual_price(ethers.utils.parseEther('1'))
    await this.moonMetapool.connect(user).approve(this.threeCurve.address, to18('100000000000'))
    await this.moonMetapool.connect(user).approve(this.moonmage.address, to18('100000000000'))
    await this.threeCurve.connect(user).approve(this.moonmage.address, to18('100000000000'))
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  it('reverts if non-existent type', async function () {
    selector = this.moonmage.interface.encodeFunctionData('sunrise', [])
    data = encodeAdvancedData(9)
    await expect(this.moonmage.connect(user).advancedFarm(
      [[selector, data]]
    )).to.be.revertedWith('Function: Advanced Type not supported')
  })
                      
  describe("1 Return data", async function () {
    beforeEach(async function () {
      await this.moonmage.connect(user).transferToken(this.moon.address, user.address, to6('100'), 0, 1)
      selector = this.moonmage.interface.encodeFunctionData('getInternalBalance', [user.address, this.moon.address])
      data = encodeAdvancedData(0)
      selector2 = this.moonmage.interface.encodeFunctionData('transferToken', [this.moon.address, user2.address, to6('0'), 1, 1])
      // [read from 0th return value, copy from 32nd byte result, paste starting from 100th byte]
      data2 = encodeAdvancedData(1, value = to6('0'), [0, 32, 100])
      await this.moonmage.connect(user).advancedFarm([
        [selector, data],
        [selector2, data2]
      ])
    })

    it("Transfers Moons to user internal", async function () {
      expect(await this.moonmage.getInternalBalance(user.address, this.moon.address)).to.be.equal(toBN('0'))
      expect(await this.moonmage.getInternalBalance(user2.address, this.moon.address)).to.be.equal(to6('100'))
    })
  })

  describe("Multiple return data", async function () {
    beforeEach(async function () {
      await this.moonmage.connect(user).transferToken(this.moon.address, user.address, to6('100'), 0, 1)
      selector = this.moonmage.interface.encodeFunctionData('getInternalBalance', [user.address, this.moon.address])
      pipe = this.mockContract.interface.encodeFunctionData('getAccount', [])
      selector2 = this.moonmage.interface.encodeFunctionData('readPipe', [[this.mockContract.address, pipe]])
      data12 = encodeAdvancedData(0)
      selector3 = this.moonmage.interface.encodeFunctionData('transferToken', [this.moon.address, ZERO_ADDRESS, to6('0'), 1, 1])
      data3 = encodeAdvancedData(2, toBN('0'), [[0, 32, 100], [1, 96, 68]])
      await this.moonmage.connect(user).advancedFarm([
        [selector, data12],
        [selector2, data12],
        [selector3, data3]
      ])
    })

    it("Transfers Moons to user internal", async function () {
      expect(await this.moonmage.getInternalBalance(user.address, this.moon.address)).to.be.equal(toBN('0'))
      expect(await this.moonmage.getInternalBalance(user2.address, this.moon.address)).to.be.equal(to6('100'))
    })
  })
})