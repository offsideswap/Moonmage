const fs = require('fs')
const { replantX } = require('./replantX.js')

// Files
const MOON_DEPOSITS = "./replant/data/r5-moonDeposits.json"

async function replant5(
  account
) {
  console.log('-----------------------------------')
  console.log('Replant5: Migrate Moon Deposits\n')
  const moonDeposits = JSON.parse(await fs.readFileSync(MOON_DEPOSITS));
  await replantX(account, moonDeposits, 'Replant5', chunkSize = 180) // 180
  console.log('-----------------------------------')
}
exports.replant5 = replant5