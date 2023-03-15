const { expect } = require('chai');
const { deploy } = require('../scripts/deploy.js')
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js')
const { MOON, THREE_CURVE, THREE_POOL, MOON_3_CURVE } = require('./utils/constants')
const { ConvertEncoder } = require('./utils/encoder.js')
const { to18, toMoon, toMage, to6 } = require('./utils/helpers.js')
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");
let user, user2, owner;
let userAddress, ownerAddress, user2Address;

describe('Curve Convert', function () {
  before(async function () {
    [owner, user, user2] = await ethers.getSigners();
    userAddress = user.address;
    user2Address = user2.address;
    const contracts = await deploy("Test", false, true);
    ownerAddress = contracts.account;
    this.diamond = contracts.moonmageDiamond;
    this.season = await ethers.getContractAt('MockSeasonFacet', this.diamond.address);
    this.diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', this.diamond.address)
    this.silo = await ethers.getContractAt('SiloFacet', this.diamond.address);
    this.convert = await ethers.getContractAt('ConvertFacet', this.diamond.address);
    this.moon = await ethers.getContractAt('MockToken', MOON);
    this.threePool = await ethers.getContractAt('Mock3Curve', THREE_POOL);
    this.threeCurve = await ethers.getContractAt('MockToken', THREE_CURVE);
    this.moonMetapool = await ethers.getContractAt('IMockCurvePool', MOON_3_CURVE);

    await this.threeCurve.mint(userAddress, to18('100000'));
    await this.threePool.set_virtual_price(to18('1'));
    await this.threeCurve.connect(user).approve(this.moonMetapool.address, to18('100000000000'));

    await this.moonMetapool.set_A_precise('1000');
    await this.moonMetapool.set_virtual_price(ethers.utils.parseEther('1'));
    await this.moonMetapool.connect(user).approve(this.threeCurve.address, to18('100000000000'));
    await this.moonMetapool.connect(user).approve(this.silo.address, to18('100000000000'));

    await this.season.siloSunrise(0);
    await this.moon.mint(userAddress, toMoon('1000000000'));
    await this.moon.mint(user2Address, toMoon('1000000000'));
    await this.moon.connect(user).approve(this.moonMetapool.address, to18('100000000000'));
    await this.moon.connect(user2).approve(this.moonMetapool.address, to18('100000000000'));
    await this.moon.connect(user).approve(this.silo.address, '100000000000');
    await this.moon.connect(user2).approve(this.silo.address, '100000000000');
    await this.moonMetapool.connect(user).add_liquidity([toMoon('1000'), to18('1000')], to18('2000'));
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  describe('calclates moons to peg', async function () {
    it('p > 1', async function () {
      await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      expect(await this.convert.getMaxAmountIn(this.moon.address, this.moonMetapool.address)).to.be.equal(ethers.utils.parseUnits('200', 6));
    });

    it('p = 1', async function () {
      expect(await this.convert.getMaxAmountIn(this.moon.address, this.moonMetapool.address)).to.be.equal('0');
    });

    it('p < 1', async function () {
      await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
      expect(await this.convert.getMaxAmountIn(this.moon.address, this.moonMetapool.address)).to.be.equal('0');
    });
  });

  describe('calclates lp to peg', async function () {
    it('p > 1', async function () {
      await this.moonMetapool.connect(user2).add_liquidity([toMoon('200'), to18('0')], to18('150'));
      expect(await this.convert.getMaxAmountIn(this.moonMetapool.address, this.moon.address)).to.be.equal('199185758314813528598');
    });

    it('p = 1', async function () {
      expect(await this.convert.getMaxAmountIn(this.moonMetapool.address, this.moon.address)).to.be.equal('0');
    });

    it('p < 1', async function () {
      await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      expect(await this.convert.getMaxAmountIn(this.moonMetapool.address, this.moon.address)).to.be.equal('0');
    });
  })

  describe('convert moons to lp', async function () {

    describe('revert', async function () {
      it('not enough LP', async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('200'), EXTERNAL);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
        await expect(this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('200'), to18('201'), this.moonMetapool.address), ['2'], [toMoon('200')]))
          .to.be.revertedWith('Curve: Not enough LP');
      });

      it('p >= 1', async function () {
        await this.silo.connect(user).deposit(this.moon.address, '1000', EXTERNAL);
        await expect(this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('200'), to18('190'), this.moonMetapool.address), ['1'], ['1000']))
          .to.be.revertedWith('Convert: P must be >= 1.');
      });

    });

    describe('below max', async function () {
      beforeEach(async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('200'), EXTERNAL);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      });

      it('it gets amount out', async function () {
        expect(await this.convert.getAmountOut(
          MOON,
          MOON_3_CURVE,
          toMoon('100')
        )).to.be.equal('100634476734756985505')
      })

      it('returns correct values', async function () {
        this.result = await this.convert.connect(user).callStatic.convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('100'), to18('99'), this.moonMetapool.address), ['2'], [toMoon('100')])
        expect(this.result.toSeason).to.be.equal(2)
        expect(this.result.fromAmount).to.be.equal(to6('100'))
        expect(this.result.toAmount).to.be.equal('100634476734756985505')
        expect(this.result.fromBdv).to.be.equal(to6('100'))
        expect(this.result.toBdv).to.be.equal(to6('100'))

      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('100'), to18('99'), this.moonMetapool.address), ['2'], [toMoon('100')])
        })

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq(toMoon('100'));
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('100634476734756985505');
          expect(await this.silo.totalSeeds()).to.eq(toMoon('600'));
          expect(await this.silo.totalMage()).to.eq(toMage('200'));
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(toMoon('600'));
          expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('200'));
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq(toMoon('100'));
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq('100634476734756985505');
          expect(deposit[1]).to.eq(toMoon('100'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moon.address, [2], [toMoon('100')], toMoon('100'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moonMetapool.address, 2, '100634476734756985505', toMoon('100'));
        });
      })
    });

    describe('above max', function () {
      beforeEach(async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('300'), EXTERNAL);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      });

      it('it gets amount out', async function () {
        expect(await this.convert.getAmountOut(
          MOON,
          MOON_3_CURVE,
          toMoon('200')
        )).to.be.equal('200832430692705624354')
      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('250'), to18('190'), this.moonMetapool.address), ['2'], [toMoon('250')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq(toMoon('100'));
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('200832430692705624354');
          expect(await this.silo.totalSeeds()).to.eq(toMoon('1000'));
          expect(await this.silo.totalMage()).to.eq(toMage('300'));
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(toMoon('1000'));
          expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('300'));
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq(toMoon('100'));
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq('200832430692705624354');
          expect(deposit[1]).to.eq(toMoon('200'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moon.address, [2], [toMoon('200')], toMoon('200'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moonMetapool.address, 2, '200832430692705624354', toMoon('200'));
        });
      });
    });

    describe('after one season', function () {
      beforeEach(async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('200'), EXTERNAL);
        await this.season.siloSunrise(0);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      });

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('250'), to18('190'), this.moonMetapool.address), ['2'], [toMoon('250')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq(toMoon('0'));
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('200832430692705624354');
          expect(await this.silo.totalSeeds()).to.eq(toMoon('800'));
          expect(await this.silo.totalMage()).to.eq(toMage('200'));
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(toMoon('800'));
          expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('200'));
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq(toMoon('0'));
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 3);
          expect(deposit[0]).to.eq('200832430692705624354');
          expect(deposit[1]).to.eq(toMoon('200'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moon.address, [2], [toMoon('200')], toMoon('200'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moonMetapool.address, 3, '200832430692705624354', toMoon('200'));
        });
      })
    });

    describe('after multiple season', function () {
      beforeEach(async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('200'), EXTERNAL);
        await this.season.siloSunrise(0);
        await this.season.siloSunrise(0);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      });

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('250'), to18('190'), this.moonMetapool.address), ['2'], [toMoon('250')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq(toMoon('0'));
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('200832430692705624354');
          expect(await this.silo.totalSeeds()).to.eq(toMoon('800'));
          expect(await this.silo.totalMage()).to.eq(toMage('200.08'));
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(toMoon('800'));
          expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('200.08'));
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq(toMoon('0'));
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 3);
          expect(deposit[0]).to.eq('200832430692705624354');
          expect(deposit[1]).to.eq(toMoon('200'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moon.address, [2], [toMoon('200')], toMoon('200'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moonMetapool.address, 3, '200832430692705624354', toMoon('200'));
        });
      });
    })

    describe('multiple crates', function () {
      beforeEach(async function () {
        await this.silo.connect(user).deposit(this.moon.address, toMoon('100'), EXTERNAL);
        await this.season.siloSunrise(0);
        await this.season.siloSunrise(0);
        await this.season.siloSunrise(0);
        await this.season.siloSunrise(0);
        await this.silo.connect(user).deposit(this.moon.address, toMoon('100'), EXTERNAL);
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('200')], to18('150'));
      });

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertMoonsToCurveLP(toMoon('250'), to18('190'), this.moonMetapool.address), ['2', '6'], [toMoon('100'), toMoon('100')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq(toMoon('0'));
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('200832430692705624354');
          expect(await this.silo.totalSeeds()).to.eq(toMoon('800'));
          expect(await this.silo.totalMage()).to.eq(toMage('200.08'));
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq(toMoon('800'));
          expect(await this.silo.balanceOfMage(userAddress)).to.eq(toMage('200.08'));
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq(toMoon('0'));
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 6))[0]).to.eq(toMoon('0'));
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 5);
          expect(deposit[0]).to.eq('200832430692705624354');
          expect(deposit[1]).to.eq(toMoon('200'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moon.address, [2, 6], [toMoon('100'), toMoon('100')], toMoon('200'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moonMetapool.address, 5, '200832430692705624354', toMoon('200'));
        });
      })
    });
  });

  describe('convert lp to moons', async function () {

    describe('revert', async function () {
      it('not enough Moons', async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('1000'), EXTERNAL);

        await expect(this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('200'), toMoon('250'), this.moonMetapool.address), ['2'], [to18('200')]))
          .to.be.revertedWith('Curve: Insufficient Output');
      });

      it('p < 1', async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('0'), to18('1')], to18('0.5'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('1000'), EXTERNAL);
        await expect(this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('200'), toMoon('190'), this.moonMetapool.address), ['1'], ['1000']))
          .to.be.revertedWith('Convert: P must be < 1.');
      });
    });

    describe('below max', function () {
      beforeEach(async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('1000'), EXTERNAL);
      });


      it('it gets amount out', async function () {
        expect(await this.convert.getAmountOut(
          MOON_3_CURVE,
          MOON,
          to18('100')
        )).to.be.equal('100618167')
      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('100'), toMoon('99'), this.moonMetapool.address), ['2'], [to18('100')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq('100618167');
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq(to18('900'));
          expect(await this.silo.totalSeeds()).to.eq('3801236334');
          expect(await this.silo.totalMage()).to.eq('10006181670000');
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq('3801236334');
          expect(await this.silo.balanceOfMage(userAddress)).to.eq('10006181670000');
        });

        it('properly updates user deposits', async function () {
          let deposit = await this.silo.getDeposit(userAddress, this.moon.address, 2);
          expect(deposit[0]).to.eq(toMoon('100.618167'));
          expect(deposit[1]).to.eq(toMoon('100.618167'));
          deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq(to18('900'));
          expect(deposit[1]).to.eq(toMoon('900'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moonMetapool.address, [2], [to18('100')], to18('100'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moon.address, 2, '100618167', '100618167');
        });
      });
    });

    describe('above max', function () {
      beforeEach(async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('1000'), EXTERNAL);
      });


      it('it gets amount out', async function () {
        expect(await this.convert.getAmountOut(
          MOON_3_CURVE,
          MOON,
          '199185758314813528598',
        )).to.be.equal('200018189')
      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('300'), toMoon('150'), this.moonMetapool.address), ['2'], [to18('300')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq('200018189');
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq('800814241685186471402');
          expect(await this.silo.totalSeeds()).to.eq('3603293346');
          expect(await this.silo.totalMage()).to.eq('10008324310000');
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq('3603293346');
          expect(await this.silo.balanceOfMage(userAddress)).to.eq('10008324310000');
        });

        it('properly updates user deposits', async function () {
          let deposit = await this.silo.getDeposit(userAddress, this.moon.address, 2);
          expect(deposit[0]).to.eq('200018189');
          expect(deposit[1]).to.eq('200018189');
          deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq('800814241685186471402');
          expect(deposit[1]).to.eq('800814242');
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moonMetapool.address, [2], ['199185758314813528598'], '199185758314813528598');
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moon.address, 2, '200018189', '200018189');
        });
      });
    });

    describe('after 1 season', function () {
      beforeEach(async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('1000'), EXTERNAL);
        await this.season.siloSunrise(0);
      });


      it('it gets amount out', async function () {

      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('100'), toMoon('99'), this.moonMetapool.address), ['2'], [to18('100')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq('100618167');
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq(to18('900'));
          expect(await this.silo.totalSeeds()).to.eq('3801236334');
          expect(await this.silo.totalMage()).to.eq('10009982906334');
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq('3801236334');
          expect(await this.silo.balanceOfMage(userAddress)).to.eq('10009982906334');
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 2))[0]).to.eq('100618167');
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq(to18('900'));
          expect(deposit[1]).to.eq(toMoon('900'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moonMetapool.address, [2], [to18('100')], to18('100'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moon.address, 2, '100618167', '100618167');
        });
      });
    });

    describe('multiple crates', function () {
      beforeEach(async function () {
        await this.moonMetapool.connect(user).add_liquidity([toMoon('200'), to18('0')], to18('150'));
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('500'), EXTERNAL);
        await this.season.siloSunrise(0);
        await this.silo.connect(user).deposit(this.moonMetapool.address, to18('500'), EXTERNAL);
      });


      it('it gets amount out', async function () {

      })

      describe('it converts', async function () {
        beforeEach(async function () {
          this.result = await this.convert.connect(user).convert(ConvertEncoder.convertCurveLPToMoons(to18('100'), toMoon('99'), this.moonMetapool.address), ['2', '3'], [to18('50'), to18('50')])
        });

        it('properly updates total values', async function () {
          expect(await this.silo.getTotalDeposited(this.moon.address)).to.eq('100618167');
          expect(await this.silo.getTotalDeposited(this.moonMetapool.address)).to.eq(to18('900'));
          expect(await this.silo.totalSeeds()).to.eq('3801236334');
          expect(await this.silo.totalMage()).to.eq('10007981670000');
        });

        it('properly updates user values', async function () {
          expect(await this.silo.balanceOfSeeds(userAddress)).to.eq('3801236334');
          expect(await this.silo.balanceOfMage(userAddress)).to.eq('10007981670000');
        });

        it('properly updates user deposits', async function () {
          expect((await this.silo.getDeposit(userAddress, this.moon.address, 3))[0]).to.eq('100618167');
          const deposit = await this.silo.getDeposit(userAddress, this.moonMetapool.address, 2);
          expect(deposit[0]).to.eq(to18('450'));
          expect(deposit[1]).to.eq(toMoon('450'));
        });

        it('emits events', async function () {
          await expect(this.result).to.emit(this.silo, 'RemoveDeposits')
            .withArgs(userAddress, this.moonMetapool.address, [2, 3], [to18('50'), to18('50')], to18('100'));
          await expect(this.result).to.emit(this.silo, 'AddDeposit')
            .withArgs(userAddress, this.moon.address, 3, '100618167', '100618167');
        });
      });
    });
  });
});
