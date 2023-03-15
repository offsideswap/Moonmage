const { impersonateMoonmageOwner } = require('../utils/signer.js');
const { upgradeWithNewFacets } = require('../scripts/diamond.js');
const { MOONMAGE } = require('../test/utils/constants.js');

async function replantMock (
        account
    ) {
    console.log('-----------------------------------')
    console.log('Mock Replant:\n')
    console.log('Mocking Replant')
    const signer = await impersonateMoonmageOwner()
    await upgradeWithNewFacets({
      diamondAddress: MOONMAGE,
      facetNames: ['MockAdminFacet'],
      bip: false,
      verbose: false,
      account: signer
    });
    console.log('-----------------------------------')
}
exports.replantMock = replantMock
