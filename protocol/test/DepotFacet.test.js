const { expect } = require('chai');
const { defaultAbiCoder } = require('ethers/lib/utils.js');
const { deploy } = require('../scripts/deploy.js');
const { deployPipeline, impersonatePipeline } = require('../scripts/pipeline.js');
const { getAltMoonmage, getMoon, getUsdc } = require('../utils/contracts.js');
const { toBN, encodeAdvancedData } = require('../utils/index.js');
const { impersonateSigner } = require('../utils/signer.js');
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js');
const { MOON_3_CURVE, THREE_POOL, THREE_CURVE, STABLE_FACTORY, WETH, MOON } = require('./utils/constants.js');
const { to6, to18 } = require('./utils/helpers.js');
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let user, user2, owner;

describe('Depot Facet', function () {
  before(async function () {
    [owner, user, user2] = await ethers.getSigners();
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
    await this.moon.mint(user.address, to6('10000'))

    await this.threeCurve.mint(user.address, to18('1000'))
    await this.threePool.set_virtual_price(to18('1'))
    await this.threeCurve.connect(user).approve(this.moonMetapool.address, to18('100000000000'))

    await this.moonMetapool.set_A_precise('1000')
    await this.moonMetapool.set_virtual_price(ethers.utils.parseEther('1'))
    await this.moonMetapool.connect(user).approve(this.threeCurve.address, to18('100000000000'))
    await this.moonMetapool.connect(user).approve(this.moonmage.address, to18('100000000000'))
    await this.threeCurve.connect(user).approve(this.moonmage.address, to18('100000000000'))
    this.result = await this.moonmage.connect(user).addLiquidity(
      MOON_3_CURVE,
      STABLE_FACTORY,
      [to6('1000'), to18('1000')],
      to18('2000'),
      EXTERNAL,
      EXTERNAL
    )
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  describe("Normal Pipe", async function () {
    describe("1 Pipe", async function () {
      beforeEach(async function () {
        const mintMoons = this.moon.interface.encodeFunctionData('mint', [
          pipeline.address,
          to6('100')
        ])
        await this.moonmage.connect(user).pipe([this.moon.address, mintMoons])
      })

      it('mints moons', async function () {
        expect(await this.moon.balanceOf(pipeline.address)).to.be.equal(to6('100'))
      })
    })

    describe("Multi Pipe", async function () {
      beforeEach(async function () {
        const mintMoons = this.moon.interface.encodeFunctionData('mint', [
          pipeline.address,
          to6('100')
        ])
        const approve = await this.moon.interface.encodeFunctionData('approve', [
          this.moonmage.address,
          to6('100')
        ])
        const tokenTransfer = this.moonmage.interface.encodeFunctionData('transferToken', [
          this.moon.address, user.address, to6('100'), 0, 1 
        ])
        await this.moonmage.connect(user).multiPipe(
          [[this.moon.address, mintMoons], [this.moon.address, approve], [this.moonmage.address, tokenTransfer]]
        )
      })

      it('mints and transfers moons', async function () {
        expect(await this.moonmage.getInternalBalance(user.address, this.moon.address)).to.be.equal(to6('100'))
      })
    })
  })

  describe("Ether Pipe", async function () {
    beforeEach(async function () {
      selector = this.weth.interface.encodeFunctionData('deposit', [])
      await this.moonmage.connect(user).etherPipe([WETH, selector], to18('1'), {value: to18('1')})
    })

    it("wraps Eth", async function () {
      expect(await this.weth.balanceOf(pipeline.address)).to.be.equal(to18('1'))
      expect(await ethers.provider.getBalance(WETH)).to.be.equal(to18('1'))
    })
  })

  describe("Advanced Pipe", async function () {
    it('reverts if non-existent type', async function () {
      selector = this.weth.interface.encodeFunctionData('deposit', [])
      data = encodeAdvancedData(9)
      await expect(this.moonmage.connect(user).advancedPipe(
        [[WETH, selector, data]], to18('0')
      )).to.be.revertedWith('Function: Advanced Type not supported')
    })

    describe("Ether Pipe to Internal", async function () {
      beforeEach(async function () {
        selector = this.weth.interface.encodeFunctionData('deposit', [])
        selector2 = await this.weth.interface.encodeFunctionData('approve', [
          this.moonmage.address,
          to18('1')
        ])
        selector3 = this.moonmage.interface.encodeFunctionData('transferToken', [
          WETH, user.address, to18('1'), 0, 1 
        ])
        data = encodeAdvancedData(0, to18('1'))
        data23 = encodeAdvancedData(0)
        await this.moonmage.connect(user).advancedPipe(
        [
          [WETH, selector, data],
          [WETH, selector2, data23],
          [this.moonmage.address, selector3, data23]
        ], to18('1'), {value: to18('1')}
        )
      })

      it("wraps Eth and transfers to user internal", async function () {
        expect(await this.weth.balanceOf(moonmage.address)).to.be.equal(to18('1'))
        expect(await this.moonmage.getInternalBalance(user.address, this.weth.address)).to.be.equal(to18('1'))
        expect(await ethers.provider.getBalance(WETH)).to.be.equal(to18('1'))
      })
    })

    describe("Return data", async function () {
      beforeEach(async function () {
        await this.moon.connect(user).transfer(pipeline.address, to6('1'))
        selector = this.moon.interface.encodeFunctionData('balanceOf', [pipeline.address])
        data = encodeAdvancedData(0)
        selector2 = this.moon.interface.encodeFunctionData('transfer', [user2.address, '0'])
        data2 = encodeAdvancedData(1, value=to6('0'), copyData=[0, 32, 68])
        await this.moonmage.connect(user).advancedPipe(
        [
          [this.moon.address, selector, data],
          [this.moon.address, selector2, data2],
        ], to18('0')
        )
      })

      it("wraps Eth and transfers to user internal", async function () {
        expect(await this.moon.balanceOf(pipeline.address)).to.be.equal(toBN('0'))
        expect(await this.moon.balanceOf(user2.address)).to.be.equal(to6('1'))
      })
    })

    describe("Multiple return data", async function () {
      beforeEach(async function () {
        await this.moon.connect(user).transfer(pipeline.address, to6('1'))
        selector = this.moon.interface.encodeFunctionData('balanceOf', [pipeline.address])
        selector2 = this.mockContract.interface.encodeFunctionData('getAccount', [])
        data12 = encodeAdvancedData(0)
        selector3 = this.moon.interface.encodeFunctionData('transfer', [user.address, to6('1')])
        data3 = encodeAdvancedData(2, value=to6('0'), copyData=[[0, 32, 68], [1, 32, 36]])
        await this.moonmage.connect(user).advancedPipe(
        [
          [this.moon.address, selector, data12],
          [this.mockContract.address, selector2, data12],
          [this.moon.address, selector3, data3],
        ], to18('0')
        )
      })

      it("wraps Eth and transfers to user internal", async function () {
        expect(await this.moon.balanceOf(pipeline.address)).to.be.equal(toBN('0'))
        expect(await this.moon.balanceOf(user2.address)).to.be.equal(to6('1'))
      })
    })
  })

  describe("Read Pipe", async function () {
    it("returns a value", async function () {
      selector = this.moon.interface.encodeFunctionData('balanceOf', [user.address])
      const pipeResult = await this.moonmage.readPipe([MOON, selector])
      expect(defaultAbiCoder.decode(['uint256'], pipeResult)[0]).to.be.equal(to6('10000'))
    })
  })
})