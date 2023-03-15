const { expect } = require('chai')
const { deploy } = require('../scripts/deploy.js')
const { parseJson } = require('./utils/helpers.js')
const { MAX_UINT32 } = require('./utils/constants.js')
const { MOON } = require('./utils/constants')

// Set the test data
const [columns, tests] = parseJson('./coverage_data/weather.json')
var numberTests = tests.length
var startTest = 0

describe('Complex Weather', function () {

  before(async function () {
    [owner,user,user2] = await ethers.getSigners()
    userAddress = user.address
    user2Address = user2.address
    const contracts = await deploy("Test", false, true)
    ownerAddress = contracts.account
    this.diamond = contracts.moonmageDiamond
    this.season = await ethers.getContractAt('MockSeasonFacet', this.diamond.address)
    this.field = await ethers.getContractAt('MockFieldFacet', this.diamond.address)
    this.moon = await ethers.getContractAt('MockToken', MOON)

  });

  [...Array(numberTests).keys()].map(i => i + startTest).forEach(function(v) {
    const testStr = 'Test #'
    describe(testStr.concat((v)), function () {
      before (async function () {
        this.testData = {}
        columns.forEach((key, i) => this.testData[key] = tests[v][i])
        await this.season.setYieldE(this.testData.startingWeather)
        this.moon.connect(user).burn(await this.moon.balanceOf(userAddress))
        this.dsoil = this.testData.lastSoil
        this.startSoil = this.testData.startingSoil
        this.endSoil = this.testData.endingSoil
        this.price = this.testData.priceAvg
        this.pods = this.testData.unharvestablePods
        await this.moon.mint(userAddress, this.testData.totalOutstandingMoons)
        await this.season.setLastSowTimeE(this.testData.lastSowTime)
        await this.season.setNextSowTimeE(this.testData.nextSowTime)
        this.result = await this.season.stepWeatherWithParams(this.pods, this.dsoil, this.startSoil, this.endSoil, this.price, this.testData.wasRaining, this.testData.rainMage)
      })
      it('Checks New Weather', async function () {
        expect(await this.season.yield()).to.eq(this.testData.newWeather)
      })
      it('Emits The Correct Case Weather', async function () {
        if (this.testData.totalOutstandingMoons !== 0) await expect(this.result).to.emit(this.season, 'WeatherChange').withArgs(await this.season.season(), this.testData.Code, this.testData.newWeather-this.testData.startingWeather)
      })
    })
  })

  describe("Extreme Weather", async function () {
    before(async function () {
      await this.season.setLastDSoilE('100000');
      await this.season.setStartSoilE('10000');
      await this.moon.mint(userAddress, '1000000000')
      await this.field.incrementTotalPodsE('100000000000');
    })

    beforeEach(async function () {
      await this.season.setYieldE('10');
    })

    it("nextSowTime immediately", async function () {
        await this.season.setLastSowTimeE('1')
        await this.season.setNextSowTimeE('10')
        await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
        const weather = await this.season.weather();
        expect(weather.yield).to.equal(7)
        expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
        expect(weather.lastSowTime).to.equal(10)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE(MAX_UINT32)
      await this.season.setNextSowTimeE('1000')
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(7)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(1000)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE('1061')
      await this.season.setNextSowTimeE('1000')
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(7)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(1000)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE('1060')
      await this.season.setNextSowTimeE('1000')
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(9)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(1000)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE('940')
      await this.season.setNextSowTimeE('1000')
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(9)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(1000)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE('900')
      await this.season.setNextSowTimeE('1000')
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(10)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(1000)
    })

    it("lastSowTime max", async function () {
      await this.season.setLastSowTimeE('900')
      await this.season.setNextSowTimeE(MAX_UINT32)
      await this.season.stepWeatherE(ethers.utils.parseEther('1'), '1');
      const weather = await this.season.weather();
      expect(weather.yield).to.equal(9)
      expect(weather.nextSowTime).to.equal(parseInt(MAX_UINT32))
      expect(weather.lastSowTime).to.equal(parseInt(MAX_UINT32))
    })
  })
})
