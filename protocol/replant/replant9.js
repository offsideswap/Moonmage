// Contracts
const { FERTILIZER_ADMIN, MOONMAGE, BCM, FERTILIZER } = require('../test/utils/constants.js');

async function replant9 (account) {
  console.log('-----------------------------------')
  console.log('Replant9: Transfer Ownership\n')
  const ownershipFacet = await ethers.getContractAt("OwnershipFacet", MOONMAGE)
  await ownershipFacet.connect(account).transferOwnership(BCM)
  console.log(`Transfered Moonmage owner to ${await ownershipFacet.owner()}`)

  const fertilizer = await ethers.getContractAt("OwnershipFacet", FERTILIZER)
  await fertilizer.connect(account).transferOwnership(MOONMAGE)

  const proxyAdmin = await ethers.getContractAt("OwnershipFacet", FERTILIZER_ADMIN)
  await proxyAdmin.connect(account).transferOwnership(MOONMAGE)
  console.log(`Transferred Fertilizer owner to ${await proxyAdmin.owner()}`)
  console.log('-----------------------------------')
}
exports.replant9 = replant9