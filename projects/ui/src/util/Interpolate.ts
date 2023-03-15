import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';
import { TokenMap, ZERO_BN } from '~/constants';
import { MOON, SEEDS, SILO_WHITELIST, MAGE } from '~/constants/tokens';
import { CosmonautSiloRewardsQuery, SeasonalPriceQuery } from '~/generated/graphql';
import { secondsToDate, MAGE_PER_SEED_PER_SEASON, toTokenUnitsBN } from '~/util';
import { BaseDataPoint } from '~/components/Common/Charts/ChartPropProvider';

export type Snapshot = {
  id: string;
  season: number;
  timestamp: string;
  hourlyDepositedBDV: string;
};

/**
 * snapshot type from Moonmage subgraph
 */
export type SnapshotMoonmage = {
  id: string;
  season: number;
  createdAt: string;
  hourlyDepositedBDV: string;
}

/**
 * 
 */
export const addBufferSeasons = (
  points: BaseDataPoint[],
  num: number = 24,
  itemizeByToken: boolean = false,
) => {
  if (points.length === 0) return [];
  const d = DateTime.fromJSDate(points[0].date);
  const n = (
    points[0].season < num
      ? Math.max(points[0].season - 1, 0) // season 1 = fill with 0 points
      : num
  );
  return n > 0 ? [
    ...new Array(n).fill(null).map((_, i) => ({
      season: points[0].season + (i - n),
      date: d.plus({ hours: i - n }).toJSDate(),
      value: 0,
      // FIXME: have the chart default to zero if a key isn't provided?
      ...(
        itemizeByToken
          ? SILO_WHITELIST.reduce<TokenMap<number>>((prev, curr) => {
            prev[curr[1].address] = 0;
            return prev;
          }, {})
          : undefined
      ),
    } as BaseDataPoint)),
    ...points,
  ] : points;
};

/**
 * Interpolate a Cosmonaut's mage in a Season using past snapshots.
 * This calculates the amount of Grown Mage a Cosmonaut gains each season using their Seeds.
 */
export const interpolateCosmonautMage = (
  snapshots: CosmonautSiloRewardsQuery['snapshots'],
  season: BigNumber,
  bufferSeasons : number = 24
) => {
  // Sequence
  let j = 0;
  const minSeason = snapshots[j].season;
  const maxSeason = season.toNumber(); // current season
  let currMage : BigNumber = ZERO_BN;
  let currSeeds : BigNumber = ZERO_BN;
  let currTimestamp = DateTime.fromJSDate(secondsToDate(snapshots[j].createdAt));
  let nextSeason : number | undefined = minSeason;
  
  // Add buffer points before the first snapshot
  const mage : BaseDataPoint[] = [];
  const seeds : BaseDataPoint[] = [];
  
  for (let s = minSeason; s <= maxSeason; s += 1) {
    if (s === nextSeason) {
      // Reached a data point for which we have a snapshot.
      // Use the corresponding total mage value.
      currMage = toTokenUnitsBN(snapshots[j].mage, MAGE.decimals);
      currSeeds = toTokenUnitsBN(snapshots[j].seeds, SEEDS.decimals);
      currTimestamp = DateTime.fromJSDate(secondsToDate(snapshots[j].createdAt));
      j += 1;
      nextSeason = snapshots[j]?.season || undefined;
    } else {
      // Estimate actual amount of mage using seeds
      currMage = currMage.plus(currSeeds.multipliedBy(MAGE_PER_SEED_PER_SEASON)); // Each Seed grows 1/10,000 Mage per Season
      currTimestamp = currTimestamp.plus({ hours: 1 });
    }
    mage.push({
      season: s,
      date:   currTimestamp.toJSDate(),
      value:  currMage.toNumber(),
    } as BaseDataPoint);
    seeds.push({
      season: s,
      date:   currTimestamp.toJSDate(),
      value:  currSeeds.toNumber(),
    } as BaseDataPoint);
  }
  
  return [
    addBufferSeasons(mage, bufferSeasons, false),
    addBufferSeasons(seeds, bufferSeasons, false)
  ] as const;
};

/**
 * Interpolate the total USD value of a Cosmonaut's deposits
 * using (a) snapshots of their Silo (which contain `hourlyDepositedBDV`)
 * and   (b) seasonal Moon price data.
 */
export const interpolateCosmonautDepositedValue = (
  snapshots: SnapshotMoonmage[], // oldest season first
  _prices: SeasonalPriceQuery['seasons'], // most recent season first
  itemizeByToken : boolean = true,
  bufferSeasons : number = 24,
) => {
  const prices = Array.from(_prices).reverse(); // FIXME: inefficient
  if (prices.length === 0) return [];

  // Sequence
  let j = 0;
  const minSeason = snapshots[j].season;
  const maxSeason = prices[prices.length - 1].season;
  let currBDV : BigNumber = ZERO_BN;
  let nextSnapshotSeason : number | undefined = minSeason;

  // null if we don't need to itemize by token
  const currBDVByToken = itemizeByToken 
    ? SILO_WHITELIST.reduce<{ [address: string]: BigNumber }>((prev, curr) => {
      prev[curr[1].address] = ZERO_BN;
      return prev;
    }, {})
    : null;

  // Price data goes all the way back to season 0, find the price index
  // where we should start iterating based on the user's oldest deposit
  let currPriceIndex = prices.findIndex((p) => p && minSeason <= p.season) + 1;
  if (currPriceIndex < 0) currPriceIndex = 0;

  // FIXME: p returning null sometimes during state transitions
  if (!prices[currPriceIndex]) return [];

  // if the subgraph misses some prices or something happens in the frontend
  // we use the last known price until we encounter a price at the current season
  const points : BaseDataPoint[] = [];

  for (let s = minSeason; s <= maxSeason; s += 1) {
    const thisPriceEntity = prices[currPriceIndex];
    const nextPriceEntity = prices[currPriceIndex + 1];
    const thisPriceBN     = new BigNumber(thisPriceEntity.price);
    const thisTimestamp   = DateTime.fromJSDate(secondsToDate(thisPriceEntity.createdAt));
    let thisBDV = currBDV;

    // If there's another price and the season associated with the price is
    // either [the price for this season OR in the past], we'll save this price
    // and use it next time in case some data points are missed
    if (nextPriceEntity && nextPriceEntity?.season <= s) {
      currPriceIndex += 1;
    }

    if (s === nextSnapshotSeason) {
      // Reached a data point for which we have a snapshot.
      // Use the corresponding total deposited BDV.
      // Since we combined multiple tokens together, we may have a deposit for multiple
      // tokens in the same season. Loop through all deposits of any token in season `s`
      // and sum up their BDV as `thisBDV`. Note that this assumes snapshots are sorted by season ascending.
      for (j; snapshots[j]?.season === nextSnapshotSeason; j += 1) {
        const thisSnapshotBDV = toTokenUnitsBN(snapshots[j].hourlyDepositedBDV, MOON[1].decimals);
        thisBDV = thisBDV.plus(thisSnapshotBDV);

        if (currBDVByToken) {
          const tokenAddr = snapshots[j]?.id.split('-')[1].toLowerCase();
          if (tokenAddr && currBDVByToken[tokenAddr]) {
            currBDVByToken[tokenAddr] = currBDVByToken[tokenAddr].plus(thisSnapshotBDV);
          }
        }
      }
      nextSnapshotSeason = snapshots[j]?.season || undefined; // next season for which BDV changes
    }

    points.push({
      season:   s,
      date:     thisTimestamp.toJSDate(),
      value:    thisBDV.multipliedBy(thisPriceBN).toNumber(),
      ...(
        currBDVByToken
          ? SILO_WHITELIST.reduce<TokenMap<number>>((prev, token) => {
            const addr = token[1].address;
            prev[addr] = currBDVByToken[addr].multipliedBy(thisPriceBN).toNumber();
            return prev;
          }, {})
          : undefined
      )
    } as BaseDataPoint);

    currBDV = thisBDV;
  }

  return addBufferSeasons(points, bufferSeasons, Boolean(currBDVByToken));
};
