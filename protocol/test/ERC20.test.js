const { to18, toMoon } = require('./utils/helpers.js')
const { EXTERNAL, INTERNAL, INTERNAL_EXTERNAL, INTERNAL_TOLERANT } = require('./utils/balances.js')
const { WETH, MOONMAGE } = require('./utils/constants');
const { signERC2612Permit } = require("eth-permit");
const { expect } = require('chai');
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let snapshotId

let userAddress, ownerAddress, user2Address

describe('ERC-20', function () {


    before(async function () {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MOONMAGE],
        });

        [owner, user, user2] = await ethers.getSigners()

        const Moon = await ethers.getContractFactory("Moon", owner)
        moon = await Moon.deploy()
        await moon.deployed();
        await moon.mint(user.address, toMoon('100'))
        console.log("Moon deployed to:", moon.address)
    });

    beforeEach(async function () {
        snapshotId = await takeSnapshot();
    });

    afterEach(async function () {
        await revertToSnapshot(snapshotId);
    });

    describe('mint', async function () {
        it('mints if minter', async function () {
            await moon.mint(user2.address, toMoon('100'))
            expect(await moon.balanceOf(user2.address)).to.be.equal(toMoon('100'))
        })

        it('reverts if not minter', async function () {
            await expect(moon.connect(user).mint(user2.address, toMoon('100'))).to.be.revertedWith("!Minter")
        })
    })

    describe('permit', async function () {
        before(async function () {
            // signERC2612Permit: (provider: any, token: string | Domain, owner: string, spender: string, value?: string | number, deadline?: number | undefined, nonce?: number | undefined) => Promise<ERC2612PermitMessage & RSV>;   
            result = await signERC2612Permit(
                ethers.provider,
                moon.address,
                user.address,
                owner.address,
                '10000000'
            );

            fakeResult = await signERC2612Permit(
                ethers.provider,
                user.address,
                user.address,
                owner.address,
                '10000000'
            );

            endedResult = await signERC2612Permit(
                ethers.provider,
                user.address,
                user.address,
                owner.address,
                '10000000',
                '1'
            );
        })

        it('revert if fake permit', async function () {
            await expect(moon.connect(user).permit(
                user.address, 
                owner.address, 
                toMoon('10'), 
                fakeResult.deadline, 
                fakeResult.v, 
                fakeResult.r, 
                fakeResult.s
            )).to.be.revertedWith('ERC20Permit: invalid signature')
        })

        it('revert when too much', async function () {
            await moon.connect(user).permit(
                user.address, 
                owner.address, 
                toMoon('10'), 
                result.deadline, 
                result.v, 
                result.r, 
                result.s
            )

            await expect(moon.connect(owner).transferFrom(user.address, user2.address, toMoon('20'))).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
        })

        it('revert deadline passed', async function () {
            await expect(moon.connect(user).permit(
                user.address, 
                owner.address, 
                toMoon('10'), 
                endedResult.deadline, 
                endedResult.v, 
                endedResult.r, 
                endedResult.s
            )).to.be.revertedWith("ERC20Permit: expired deadline")
        })

        it('transfers all', async function () {
            await moon.connect(user).permit(
                user.address, 
                owner.address, 
                toMoon('10'), 
                result.deadline, 
                result.v, 
                result.r, 
                result.s
            )
            await moon.connect(owner).transferFrom(user.address, user2.address, toMoon('10'))

            expect(await moon.balanceOf(user2.address)).to.be.equal(toMoon('10'))
            expect(await moon.balanceOf(user.address)).to.be.equal(toMoon('90'))
        })

        it('transfers some', async function () {
            await moon.connect(user).permit(
                user.address, 
                owner.address, 
                toMoon('10'), 
                result.deadline, 
                result.v, 
                result.r, 
                result.s
            )
            await moon.connect(owner).transferFrom(user.address, user2.address, toMoon('5'))

            expect(await moon.balanceOf(user2.address)).to.be.equal(toMoon('5'))
            expect(await moon.balanceOf(user.address)).to.be.equal(toMoon('95'))
            expect(await moon.allowance(user.address, owner.address)).to.be.equal(toMoon('5'))
        })

    })

});
