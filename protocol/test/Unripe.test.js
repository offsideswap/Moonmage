const { expect } = require('chai')
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js')
const { deploy } = require('../scripts/deploy.js')
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot")
const { MOON, UNRIPE_MOON, UNRIPE_LP } = require('./utils/constants')
const { to6, to18, toMage } = require('./utils/helpers.js')
const ZERO_BYTES = ethers.utils.formatBytes32String('0x0')

let user, user2, owner;
let userAddress, ownerAddress, user2Address;

describe('Unripe', function () {
  before(async function () {
    [owner, user, user2] = await ethers.getSigners()
    userAddress = user.address;
    user2Address = user2.address;
    const contracts = await deploy("Test", false, true)
    ownerAddress = contracts.account;
    this.diamond = contracts.moonmageDiamond;
    this.season = await ethers.getContractAt('MockSeasonFacet', this.diamond.address)
    this.unripe = await ethers.getContractAt('MockUnripeFacet', this.diamond.address)
    this.fertilizer = await ethers.getContractAt('MockFertilizerFacet', this.diamond.address)
    this.token = await ethers.getContractAt('TokenFacet', this.diamond.address)
    this.moon = await ethers.getContractAt('MockToken', MOON)
    await this.moon.connect(owner).approve(this.diamond.address, to6('100000000'))

    this.unripeMoon = await ethers.getContractAt('MockToken', UNRIPE_MOON)
    this.unripeLP = await ethers.getContractAt('MockToken', UNRIPE_LP)
    await this.unripeLP.mint(userAddress, to6('1000'))
    await this.unripeLP.connect(user).approve(this.diamond.address, to6('100000000'))
    await this.unripeMoon.mint(userAddress, to6('1000'))
    await this.unripeMoon.connect(user).approve(this.diamond.address, to6('100000000'))
    await this.fertilizer.setFertilizerE(true, to6('10000'))
    await this.unripe.addUnripeToken(UNRIPE_MOON, MOON, ZERO_BYTES)
    await this.moon.mint(ownerAddress, to6('100'))

    await this.season.siloSunrise(0)
  })

  beforeEach(async function () {
    snapshotId = await takeSnapshot()
  })

  afterEach(async function () {
    await revertToSnapshot(snapshotId)
  })

  it('reverts on non-unripe address', async function () {
    await expect(this.unripe.getPenalty(this.moon.address)).to.be.reverted;
    await expect(this.unripe.getRecapFundedPercent(this.moon.address)).to.be.reverted;
  })

  it('getters', async function () {
    expect(await this.unripe.getRecapPaidPercent()).to.be.equal('0')
    expect(await this.unripe.getUnderlyingPerUnripeToken(UNRIPE_MOON)).to.be.equal('0')
    expect(await this.unripe.getPenalty(UNRIPE_MOON)).to.be.equal(to6('0'))
    expect(await this.unripe.getTotalUnderlying(UNRIPE_MOON)).to.be.equal('0')
    expect(await this.unripe.isUnripe(UNRIPE_MOON)).to.be.equal(true)
    expect(await this.unripe.getPenalizedUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal('0')
    expect(await this.unripe.getUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal('0')
    expect(await this.unripe.balanceOfUnderlying(UNRIPE_MOON, userAddress)).to.be.equal('0')
  })

  describe('deposit underlying', async function () {
    beforeEach(async function () {
      await this.unripe.connect(owner).addUnderlying(
        UNRIPE_MOON,
        to6('100')
      )
      await this.fertilizer.connect(owner).setPenaltyParams(to6('100'), to6('0'))
    })

    it('getters', async function () {
      expect(await this.unripe.getUnderlyingPerUnripeToken(UNRIPE_MOON)).to.be.equal(to6('0.1'))
      expect(await this.unripe.getPenalty(UNRIPE_MOON)).to.be.equal(to6('0'))
      expect(await this.unripe.getPenalizedUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal('0')
      expect(await this.unripe.getTotalUnderlying(UNRIPE_MOON)).to.be.equal(to6('100'))
      expect(await this.unripe.isUnripe(UNRIPE_MOON)).to.be.equal(true)
      expect(await this.unripe.getUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.1'))
      expect(await this.unripe.balanceOfUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('100'))
      expect(await this.unripe.balanceOfPenalizedUnderlying(UNRIPE_MOON, userAddress)).to.be.equal('0')
    })

    it('gets percents', async function () {
      expect(await this.unripe.getRecapPaidPercent()).to.be.equal('0')
      expect(await this.unripe.getRecapFundedPercent(UNRIPE_MOON)).to.be.equal(to6('0.1'))
      expect(await this.unripe.getRecapFundedPercent(UNRIPE_LP)).to.be.equal(to6('0.188459'))
      expect(await this.unripe.getPercentPenalty(UNRIPE_MOON)).to.be.equal(to6('0'))
      expect(await this.unripe.getPercentPenalty(UNRIPE_LP)).to.be.equal(to6('0'))
    })
  })

  describe('penalty go down', async function () {
    beforeEach(async function () {
      await this.unripe.connect(owner).addUnderlying(
        UNRIPE_MOON,
        to6('100')
      )
      await this.fertilizer.connect(owner).setPenaltyParams(to6('100'), to6('100'))
    })

    it('getters', async function () {
      expect(await this.unripe.getUnderlyingPerUnripeToken(UNRIPE_MOON)).to.be.equal(to6('0.1'))
      expect(await this.unripe.getPenalty(UNRIPE_MOON)).to.be.equal(to6('0.001'))
      expect(await this.unripe.getTotalUnderlying(UNRIPE_MOON)).to.be.equal(to6('100'))
      expect(await this.unripe.isUnripe(UNRIPE_MOON)).to.be.equal(true)
      expect(await this.unripe.getPenalizedUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.001'));
      expect(await this.unripe.getUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.1'))
      expect(await this.unripe.balanceOfUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('100'))
      expect(await this.unripe.balanceOfPenalizedUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('1'))
    })

    it('gets percents', async function () {
      expect(await this.unripe.getRecapPaidPercent()).to.be.equal(to6('0.01'))
      expect(await this.unripe.getRecapFundedPercent(UNRIPE_MOON)).to.be.equal(to6('0.1'))
      expect(await this.unripe.getRecapFundedPercent(UNRIPE_LP)).to.be.equal(to6('0.188459'))
      expect(await this.unripe.getPercentPenalty(UNRIPE_MOON)).to.be.equal(to6('0.001'))
      expect(await this.unripe.getPercentPenalty(UNRIPE_LP)).to.be.equal(to6('0.001884'))
    })
  })

  describe('chop', async function () {
    beforeEach(async function () {
      await this.unripe.connect(owner).addUnderlying(
        UNRIPE_MOON,
        to6('100')
      )
      await this.fertilizer.connect(owner).setPenaltyParams(to6('100'), to6('100'))
      this.result = await this.unripe.connect(user).chop(UNRIPE_MOON, to6('1'), EXTERNAL, EXTERNAL)
    })

    it('getters', async function () {
      expect(await this.unripe.getRecapPaidPercent()).to.be.equal(to6('0.01'))
      expect(await this.unripe.getUnderlyingPerUnripeToken(UNRIPE_MOON)).to.be.equal('100099')
      expect(await this.unripe.getPenalty(UNRIPE_MOON)).to.be.equal(to6('0.001'))
      expect(await this.unripe.getTotalUnderlying(UNRIPE_MOON)).to.be.equal(to6('99.999'))
      expect(await this.unripe.isUnripe(UNRIPE_MOON)).to.be.equal(true)
      expect(await this.unripe.getPenalizedUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.001'))
      expect(await this.unripe.getUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.100099'))
      expect(await this.unripe.balanceOfUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('99.999'))
      expect(await this.unripe.balanceOfPenalizedUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('0.99999'))
    })

    it('changes balaces', async function () {
      expect(await this.unripeMoon.balanceOf(userAddress)).to.be.equal(to6('999'))
      expect(await this.moon.balanceOf(userAddress)).to.be.equal(to6('0.001'))
      expect(await this.unripeMoon.totalSupply()).to.be.equal(to6('999'))
      expect(await this.moon.balanceOf(this.unripe.address)).to.be.equal(to6('99.999'))
    })

    it('emits an event', async function () {
      await expect(this.result).to.emit(this.unripe, 'Chop').withArgs(
        user.address,
        UNRIPE_MOON,
        to6('1'),
        to6('0.001')
      )
    })
  })

  describe('chop', async function () {
    beforeEach(async function () {
      await this.unripe.connect(owner).addUnderlying(
        UNRIPE_MOON,
        to6('100')
      )
      await this.fertilizer.connect(owner).setPenaltyParams(to6('100'), to6('100'))
      await this.token.connect(user).transferToken(
        UNRIPE_MOON,
        user.address,
        to6('1'),
        EXTERNAL,
        INTERNAL
    )
    this.result = await this.unripe.connect(user).chop(UNRIPE_MOON, to6('10'), INTERNAL_TOLERANT, EXTERNAL)
    })

    it('getters', async function () {
      expect(await this.unripe.getRecapPaidPercent()).to.be.equal(to6('0.01'))
      expect(await this.unripe.getUnderlyingPerUnripeToken(UNRIPE_MOON)).to.be.equal('100099')
      expect(await this.unripe.getPenalty(UNRIPE_MOON)).to.be.equal(to6('0.001'))
      expect(await this.unripe.getTotalUnderlying(UNRIPE_MOON)).to.be.equal(to6('99.999'))
      expect(await this.unripe.isUnripe(UNRIPE_MOON)).to.be.equal(true)
      expect(await this.unripe.getPenalizedUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.001'))
      expect(await this.unripe.getUnderlying(UNRIPE_MOON, to6('1'))).to.be.equal(to6('0.100099'))
      expect(await this.unripe.balanceOfUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('99.999'))
      expect(await this.unripe.balanceOfPenalizedUnderlying(UNRIPE_MOON, userAddress)).to.be.equal(to6('0.99999'))
    })

    it('changes balaces', async function () {
      expect(await this.unripeMoon.balanceOf(userAddress)).to.be.equal(to6('999'))
      expect(await this.moon.balanceOf(userAddress)).to.be.equal(to6('0.001'))
      expect(await this.unripeMoon.totalSupply()).to.be.equal(to6('999'))
      expect(await this.moon.balanceOf(this.unripe.address)).to.be.equal(to6('99.999'))
    })

    it('emits an event', async function () {
      await expect(this.result).to.emit(this.unripe, 'Chop').withArgs(
        user.address,
        UNRIPE_MOON,
        to6('1'),
        to6('0.001')
      )
    })
  })
})