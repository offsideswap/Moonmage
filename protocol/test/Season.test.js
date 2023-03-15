const { expect } = require('chai');
const { deploy } = require('../scripts/deploy.js');
const { getAltMoonmage, getMoon, getUsdc } = require('../utils/contracts.js');
const { signERC2612Permit } = require("eth-permit");
const { MOON_3_CURVE, THREE_POOL, THREE_CURVE, PIPELINE, MOONMAGE } = require('./utils/constants.js');
const { to6, to18 } = require('./utils/helpers.js');
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let user, user2, owner;

async function setToSecondsAfterHour(seconds = 0) {
    const lastTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const hourTimestamp = parseInt(lastTimestamp/3600 + 1) * 3600 + seconds
    await network.provider.send("evm_setNextBlockTimestamp", [hourTimestamp])
}

describe('Season', function () {
    before(async function () {
        [owner, user, user2] = await ethers.getSigners();
        const contracts = await deploy("Test", false, true);
        moonmage = await getAltMoonmage(contracts.moonmageDiamond.address)
        moon = await getMoon()
        await setToSecondsAfterHour(0)
        await owner.sendTransaction({to: user.address, value: 0})
    })

    beforeEach(async function () {
        snapshotId = await takeSnapshot();
    });
    
    afterEach(async function () {
        await revertToSnapshot(snapshotId);
    });

    it('season incentive', async function () {
        await setToSecondsAfterHour(0)
        await moonmage.connect(owner).sunrise();
        expect(await moon.balanceOf(owner.address)).to.be.equal(to6('25'))
    })

    it('30 seconds after season incentive', async function () {
        await setToSecondsAfterHour(30)
        await moonmage.connect(owner).sunrise();
        expect(await moon.balanceOf(owner.address)).to.be.equal('33696207')
    })

    it('300 seconds after season incentive', async function () {
        await setToSecondsAfterHour(300)
        await moonmage.connect(owner).sunrise();
        expect(await moon.balanceOf(owner.address)).to.be.equal('494705494')
    })

    it('1500 seconds after season incentive', async function () {
        await setToSecondsAfterHour(1500)
        await moonmage.connect(owner).sunrise();
        expect(await moon.balanceOf(owner.address)).to.be.equal('494705494')
    })
})