const { expect } = require('chai');
const { deploy } = require('../scripts/deploy.js')
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js')
const { to18, to6, toMage } = require('./utils/helpers.js')
const { MOON } = require('./utils/constants')
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let user,user2,owner;
let userAddress, ownerAddress, user2Address;

describe('Silo', function () {
  before(async function () {
    [owner,user,user2] = await ethers.getSigners();
    userAddress = user.address;
    user2Address = user2.address;
    const contracts = await deploy("Test", false, true);
    ownerAddress = contracts.account;
    this.diamond = contracts.moonmageDiamond;
    this.season = await ethers.getContractAt('MockSeasonFacet', this.diamond.address);
    this.silo = await ethers.getContractAt('MockSiloFacet', this.diamond.address);
    this.moon = await ethers.getContractAt('Moon', MOON);

    await this.season.lightSunrise();
    await this.moon.connect(user).approve(this.silo.address, '100000000000');
    await this.moon.connect(user2).approve(this.silo.address, '100000000000'); 
    await this.moon.mint(userAddress, to6('10000'));
    await this.moon.mint(user2Address, to6('10000'));
    await this.silo.update(userAddress);
    this.result = await this.silo.connect(user).deposit(this.moon.address, to6('1000'), EXTERNAL)
    this.result = await this.silo.connect(user2).deposit(this.moon.address, to6('1000'), EXTERNAL)
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  describe('Silo Balances After Deposits', function () {
    it('properly updates the user balances', async function () {
      expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(to6('2000'));
      expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('1000'));
      expect(await this.silo.balanceOfRoots(userAddress)).to.eq(toMage('1000000000000000'));
    });

    it('properly updates the total balances', async function () {
      expect(await this.silo.totalSeeds()).to.eq(to6('4000'));
      expect(await this.silo.totalMage()).to.eq(toMage('2000'));
      expect(await this.silo.totalRoots()).to.eq(toMage('2000000000000000'));
    });
  });

  describe('Silo Balances After Withdrawal', function () {
    beforeEach(async function () {
      await this.silo.connect(user).withdrawDeposit(this.moon.address, '2', to6('500'))
    })

    it('properly updates the total balances', async function () {
      expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(to6('1000'));
      expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('500'));
      expect(await this.silo.balanceOfRoots(userAddress)).to.eq(toMage('500000000000000'));
    });

    it('properly updates the total balances', async function () {
      expect(await this.silo.totalSeeds()).to.eq(to6('3000'));
      expect(await this.silo.totalMage()).to.eq(toMage('1500'));
      expect(await this.silo.totalRoots()).to.eq(toMage('1500000000000000'));
    });
  });

  describe("Silo Sunrise", async function () {
    describe("Single", async function () {
      beforeEach(async function () {
        await this.season.siloSunrise(to6('100'))
      })

      it('properly updates the earned balances', async function () {
        expect(await this.silo.balanceOfGrownMage(userAddress)).to.eq(toMage('0.2'));
        expect(await this.silo.balanceOfEarnedMoons(userAddress)).to.eq(to6('50'));
        expect(await this.silo.balanceOfEarnedSeeds(userAddress)).to.eq(to6('100'));
        expect(await this.silo.balanceOfEarnedMage(userAddress)).to.eq(toMage('50'));
        expect(await this.silo.totalEarnedMoons()).to.eq(to6('100'));
      });

      it('properly updates the total balances', async function () {
        expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(to6('2000'));
        expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('1050'));
        expect(await this.silo.balanceOfRoots(userAddress)).to.eq(toMage('1000000000000000'));
      });
  
      it('properly updates the total balances', async function () {
        expect(await this.silo.totalSeeds()).to.eq(to6('4000'));
        expect(await this.silo.totalMage()).to.eq(toMage('2100'));
        expect(await this.silo.totalRoots()).to.eq(toMage('2000000000000000'));
      });
    })
  })

  describe("Single Earn", async function () {
    beforeEach(async function () {
      await this.season.siloSunrise(to6('100'))
      await this.silo.update(user2Address)
      this.result = await this.silo.connect(user).plant()
    })

    it('properly updates the earned balances', async function () {
      expect(await this.silo.balanceOfGrownMage(userAddress)).to.eq('0');
      expect(await this.silo.balanceOfEarnedMoons(userAddress)).to.eq('0');
      expect(await this.silo.balanceOfEarnedSeeds(userAddress)).to.eq('0');
      expect(await this.silo.balanceOfEarnedMage(userAddress)).to.eq('0');
      expect(await this.silo.totalEarnedMoons()).to.eq(to6('50'));
    });

    it('properly updates the total balances', async function () {
      expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(to6('2100'));
      expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('1050.2'));
      expect(await this.silo.balanceOfRoots(userAddress)).to.eq('10001904761904761904761904');
    });

    it('properly updates the total balances', async function () {
      expect(await this.silo.totalSeeds()).to.eq(to6('4100'));
      expect(await this.silo.totalMage()).to.eq(to6('21004000'));
      expect(await this.silo.totalRoots()).to.eq('20003809523809523809523808');
    });

    it('properly emits events', async function () {
      expect(this.result).to.emit(this.silo, 'Earn')
    })

    it('user2 earns rest', async function () {
      await this.silo.connect(user2).plant()
      expect(await this.silo.totalEarnedMoons()).to.eq('0');
    });
  })
});