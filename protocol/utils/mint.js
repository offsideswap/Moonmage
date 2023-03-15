const { USDC_MINTER, MOON } = require('../test/utils/constants')
const { getUsdc, getMoon, getMoonmageAdminControls } = require('./contracts.js')
const { impersonateSigner, impersonateMoonmageOwner } = require('./signer.js')

async function mintUsdc(address, amount) {
    const signer = await impersonateSigner(USDC_MINTER)
    const usdc = await getUsdc()
    await usdc.connect(signer).mint(address, amount)
}

async function mintMoons(address, amount) {
    const moonmageAdmin = await getMoonmageAdminControls()
    await moonmageAdmin.mintMoons(address, amount)
}

async function mintEth(address) {
    await hre.network.provider.send("hardhat_setBalance", [address, "0x3635C9ADC5DEA00000"]);
}

exports.mintEth = mintEth
exports.mintUsdc = mintUsdc
exports.mintMoons = mintMoons