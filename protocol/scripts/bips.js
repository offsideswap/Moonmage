const { MOONMAGE } = require("../test/utils/constants");
const { getMoonmage, impersonateMoonmageOwner, mintEth } = require("../utils")
const { upgradeWithNewFacets } = require("./diamond");
const { impersonatePipeline, deployPipeline } = require('./pipeline')

async function bip30(mock = true, account = undefined) {
    if (account == undefined) {
        account = await impersonateMoonmageOwner()
        await mintEth(account.address)
    }

    await upgradeWithNewFacets({
        diamondAddress: MOONMAGE,
        facetNames: [
            'DepotFacet', // Add Depot
            'TokenSupportFacet', // Add ERC-20 permit function
            'FarmFacet', // Add AdvancedFarm
            'SeasonFacet'
        ],
        bip: false,
        object: !mock,
        verbose: true,
        account: account
      });
}

async function bip29(mock = true, account = undefined) {
    if (account == undefined) {
        account = await impersonateMoonmageOwner()
        await mintEth(account.address)
    }

    moonmage = await getMoonmage()
    await upgradeWithNewFacets({
        diamondAddress: MOONMAGE,
        facetNames: [
            'MarketplaceFacet', // Marketplace V2
            'SiloFacet',  // Add Deposit Permit System
            'TokenFacet' // Add ERC-20 Token Approval System
        ],
        selectorsToRemove: [
            '0xeb6fa84f',
            '0xed778f8e',
            '0x72db799f',
            '0x56e70811',
            '0x6d679775',
            '0x1aac9789'
        ],
        bip: false,
        object: !mock,
        verbose: true,
        account: account
      });
}

exports.bip29 = bip29
exports.bip30 = bip30