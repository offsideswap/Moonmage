const { expect } = require('chai');
const { deploy } = require('../scripts/deploy.js');
const { getAltMoonmage, getMoon, getUsdc } = require('../utils/contracts.js');
const { signERC2612Permit } = require("eth-permit");
const { MOON_3_CURVE, THREE_POOL, THREE_CURVE, PIPELINE, MOONMAGE } = require('./utils/constants.js');
const { to6, to18 } = require('./utils/helpers.js');
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

let user, user2, owner;

describe('External Token', function () {
    before(async function () {
        [owner, user, user2] = await ethers.getSigners();
        const contracts = await deploy("Test", false, true);
        this.moonmage = await getAltMoonmage(contracts.moonmageDiamond.address)

        const Token = await ethers.getContractFactory("MockToken");
        this.token = await Token.deploy("Silo", "SILO")
        await this.token.deployed()

        this.erc1155 = await (await ethers.getContractFactory('MockERC1155', owner)).deploy('Mock')
        await this.erc1155.connect(user).setApprovalForAll(this.moonmage.address, true)

        this.erc721 = await (await ethers.getContractFactory('MockERC721', owner)).deploy()
    });

    beforeEach(async function () {
        snapshotId = await takeSnapshot();
    });

    afterEach(async function () {
        await revertToSnapshot(snapshotId);
    });

    describe("Permit ERC-20 token", async function () {
        it('legit', async function () {
            result = await signERC2612Permit(
                ethers.provider,
                this.token.address,
                user.address,
                MOONMAGE,
                '10000000'
            );

            await this.moonmage.connect(user).permitERC20(
                this.token.address,
                user.address,
                MOONMAGE,
                to6('10'),
                result.deadline,
                result.v,
                result.r,
                result.s
            )
        })
        expect(await this.token.allowance(user.address, MOONMAGE)).to.be.equal(to6('10'))

        it('fake', async function () {
            fakeResult = await signERC2612Permit(
                ethers.provider,
                user.address,
                user.address,
                owner.address,
                '10000000'
            );

            await expect(this.moonmage.connect(user).permitERC20(
                this.moon.address,
                user.address,
                MOONMAGE,
                toMoon('10'),
                fakeResult.deadline,
                fakeResult.v,
                fakeResult.r,
                fakeResult.s
            )).to.be.revertedWith('ERC20Permit: invalid signature')
        });

        it('revert deadline passed', async function () {
            endedResult = await signERC2612Permit(
                ethers.provider,
                this.token.address,
                user.address,
                MOONMAGE,
                '10000000',
                '1'
            );

            await expect(this.moonmage.connect(user).permitERC20(
                this.moon.address,
                user.address,
                MOONMAGE,
                toMoon('10'),
                endedResult.deadline,
                endedResult.v,
                endedResult.r,
                endedResult.s
            )).to.be.revertedWith("ERC20Permit: expired deadline")
        });
    })

    describe("Transfer ERC-1155", async function () {
        beforeEach(async function () {
            await this.erc1155.mockMint(user.address, '0', '5')
            await this.moonmage.connect(user).transferERC1155(this.erc1155.address, PIPELINE, '0', '2')
        })

        it('transfers ERC-1155', async function () {
            expect(await this.erc1155.balanceOf(PIPELINE, '0')).to.be.equal('2')
            expect(await this.erc1155.balanceOf(user.address, '0')).to.be.equal('3')
        })
    })

    describe("Batch Transfer ERC-1155", async function () {
        beforeEach(async function () {
            await this.erc1155.mockMint(user.address, '0', '5')
            await this.erc1155.mockMint(user.address, '1', '10')
            await this.moonmage.connect(user).batchTransferERC1155(this.erc1155.address, PIPELINE, ['0', '1'], ['2', '3'])
        })

        it('transfers ERC-1155', async function () {
            const balances = await this.erc1155.balanceOfBatch(
                [PIPELINE, PIPELINE, user.address, user.address],
                ['0', '1', '0', '1']
            )
            expect(balances[0]).to.be.equal('2')
            expect(balances[1]).to.be.equal('3')
            expect(balances[2]).to.be.equal('3')
            expect(balances[3]).to.be.equal('7')
        })
    })

    describe("Transfer ERC-721", async function () {
        beforeEach(async function () {
            await this.erc721.mockMint(user.address, '0')
            await this.erc721.connect(user).approve(this.moonmage.address, '0')
            await this.moonmage.connect(user).transferERC721(this.erc721.address, PIPELINE, '0')
        })

        it('transfers ERC-721', async function () {
            expect(await this.erc721.ownerOf('0')).to.be.equal(PIPELINE)
        })
    })

    describe("Permit and transfer ERC-721", async function () {
        beforeEach(async function () {
            await this.erc721.mockMint(user.address, '0')
            const permit = this.moonmage.interface.encodeFunctionData("permitERC721", [
                this.erc721.address,
                this.moonmage.address,
                '0',
                '0',
                ethers.constants.HashZero
            ])
            const transfer = this.moonmage.interface.encodeFunctionData('transferERC721', [
                this.erc721.address, PIPELINE, '0'
            ])
            await this.moonmage.connect(user).farm([permit, transfer])
        })

        it('transfers ERC-721', async function () {
            expect(await this.erc721.ownerOf('0')).to.be.equal(PIPELINE)
        })
    })
})