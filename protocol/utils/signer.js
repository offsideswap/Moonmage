const { getMoonmage } = require('./contracts.js')

async function impersonateSigner(signerAddress) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signerAddress],
  });
  return await ethers.getSigner(signerAddress)
}

async function impersonateMoonmageOwner() {
  const owner = await (await getMoonmage()).owner()
  return await impersonateSigner(owner)
}

exports.impersonateSigner = impersonateSigner;
exports.impersonateMoonmageOwner = impersonateMoonmageOwner;