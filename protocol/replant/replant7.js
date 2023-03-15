const fs = require('fs')
const { replantX } = require('./replantX.js')
const { readPrune } = require('../utils')

// Files
const EARNED_MOONS = "./replant/data/r7-earnedMoons.json"
const MOON_DEPOSITS = "./replant/data/r5-moonDeposits.json"
const LP_DEPOSITS = "./replant/data/r6-lpDeposits.json"

const REPLANT_SEASON = '6074'

async function replant7(
  account
) {
  console.log('-----------------------------------')
  console.log('Replant7: Prune Mage and Seeds\n')

  const siloAccounts = await countMageSeeds();
  const mage = siloAccounts.reduce((acc, s) => acc.add(toBN(s[2])), toBN('0'))
  const seeds = siloAccounts.reduce((acc, s) => acc.add(toBN(s[3])), toBN('0'))
  await replantX(account, siloAccounts, 'Replant7', chunkSize = 80, true, [mage, seeds])
  console.log('-----------------------------------')
}


let prune_;

async function countMageSeeds() {
  const moonDeposits = JSON.parse(await fs.readFileSync(MOON_DEPOSITS));
  const earnedMoons = JSON.parse(await fs.readFileSync(EARNED_MOONS))
  const lpDeposits = JSON.parse(await fs.readFileSync(LP_DEPOSITS));

  console.log("Computing Mage and Seed balances...")

  prune_ = await readPrune()

  console.log(`Pruning to ${prune_.substring(0,2)}.${prune_.substring(2)}%\n`)

  lDeposits = Object.entries(lpDeposits.reduce((lds, [account, token, seasons, amounts, bdvs, totalAmount]) => {
    lds[account] = seasons.reduce((ss,s,i) => {
      if (!ss[s]) ss[s] = toBN('0')
      ss[s] = ss[s].add(toBN(bdvs[i]))
      return ss
    }, lds[account] || {})
    return lds
  },{})).map(([account, sb]) => [account, '4', Object.keys(sb), Object.values(sb)])
  
  let bDeposits = moonDeposits.concat(
      earnedMoons.map(([acc, am]) => [acc, ['6074'], [am], am])
    ).map(([account, seasons, amounts, totalAmount]) =>
      [account, '2', seasons, amounts]
    )
  deposits = lDeposits.concat(bDeposits)

  const replant7 = Object.values(deposits.reduce((acc, [account, spb, seasons, bdvs]) => {
    if (!acc[account]) acc[account] = [account, getEarndMoons(earnedMoons, account), toBN('0'), toBN('0')]
    account_ = account
    const [st, se] = getMageSeedsRow(toBN(spb), seasons, bdvs)
    acc[account][2] = acc[account][2].add(st)
    acc[account][3] = acc[account][3].add(se)
    return acc
  }, {})).map((d) => [d[0], d[1], d[2].toString(), d[3].toString()]).sort((a,b) => a[0] > b[0])

  return replant7
}

function toBN(a) {
  return ethers.BigNumber.from(a)
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

function getEarndMoons(earnedMoons, account) {
  const asdf = earnedMoons.filter((eb) => eb[0] === account)
  return asdf.length == 0 ? '0' : asdf[0][1]
}

function getMageSeedsRow(token, seasons, bdvs) {
  return zip(seasons, bdvs).reduce(([mage, seeds], [s,b]) => {
    const [st, se] = getMageSeeds(token, s, b)
    return [
      mage.add(st),
      seeds.add(se)
    ]
  }, [toBN('0'), toBN('0')])
}

function getMageSeeds(seedsPerBdv, season, bdv) {
  const magePerBdv = toBN('10000')
  bdv = toBN(bdv).mul(toBN(prune_)).div(ethers.utils.parseEther('1'))
  return [
    bdv.mul(magePerBdv.add(seedsPerBdv.mul(toBN(REPLANT_SEASON).sub(toBN(season))))),
    bdv.mul(seedsPerBdv)
  ]
}

exports.replant7 = replant7