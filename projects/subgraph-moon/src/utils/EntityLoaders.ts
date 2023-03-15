import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Moon, MoonDailySnapshot, MoonHourlySnapshot, Cross } from "../../generated/schema";
import { MOON_ERC20 } from "./Constants";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadMoon(): Moon {
    let moon = Moon.load(MOON_ERC20.toHexString())
    if (moon == null) {
        moon = new Moon(MOON_ERC20.toHexString())
        moon.decimals = BigInt.fromI32(6)
        moon.totalSupply = ZERO_BI
        moon.marketCap = ZERO_BD
        moon.totalVolume = ZERO_BI
        moon.totalVolumeUSD = ZERO_BD
        moon.totalLiquidity = ZERO_BI
        moon.totalLiquidityUSD = ZERO_BD
        moon.price = BigDecimal.fromString('1.072')
        moon.totalCrosses = 0
        moon.lastCross = ZERO_BI
        moon.save()
    }
    return moon as Moon
}

export function loadMoonHourlySnapshot(timestamp: BigInt): MoonHourlySnapshot {
    let hour = hourFromTimestamp(timestamp)
    let snapshot = MoonHourlySnapshot.load(hour)
    if (snapshot == null) {
        let moon = loadMoon()
        snapshot = new MoonHourlySnapshot(hour)
        snapshot.moon = MOON_ERC20.toHexString()
        snapshot.totalSupply = ZERO_BI
        snapshot.marketCap = moon.marketCap
        snapshot.totalVolume = moon.totalVolume
        snapshot.totalVolumeUSD = moon.totalVolumeUSD
        snapshot.totalLiquidity = moon.totalLiquidity
        snapshot.totalLiquidityUSD = moon.totalLiquidityUSD
        snapshot.price = moon.price
        snapshot.totalCrosses = moon.totalCrosses
        snapshot.deltaMoons = ZERO_BI
        snapshot.hourlyVolume = ZERO_BI
        snapshot.hourlyVolumeUSD = ZERO_BD
        snapshot.hourlyLiquidity = ZERO_BI
        snapshot.hourlyLiquidityUSD = ZERO_BD
        snapshot.hourlyCrosses = 0
        snapshot.season = 6074
        snapshot.timestamp = timestamp
        snapshot.blockNumber = ZERO_BI
        snapshot.save()
    }
    return snapshot as MoonHourlySnapshot
}

export function loadMoonDailySnapshot(timestamp: BigInt): MoonDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let snapshot = MoonDailySnapshot.load(day)
    if (snapshot == null) {
        let moon = loadMoon()
        snapshot = new MoonDailySnapshot(day)
        snapshot.moon = MOON_ERC20.toHexString()
        snapshot.totalSupply = ZERO_BI
        snapshot.marketCap = moon.marketCap
        snapshot.totalVolume = moon.totalVolume
        snapshot.totalVolumeUSD = moon.totalVolumeUSD
        snapshot.totalLiquidity = moon.totalLiquidity
        snapshot.totalLiquidityUSD = moon.totalLiquidityUSD
        snapshot.price = moon.price
        snapshot.totalCrosses = moon.totalCrosses
        snapshot.deltaMoons = ZERO_BI
        snapshot.dailyVolume = ZERO_BI
        snapshot.dailyVolumeUSD = ZERO_BD
        snapshot.dailyLiquidity = ZERO_BI
        snapshot.dailyLiquidityUSD = ZERO_BD
        snapshot.dailyCrosses = 0
        snapshot.season = 6074
        snapshot.timestamp = timestamp
        snapshot.blockNumber = ZERO_BI
        snapshot.save()
    }
    return snapshot as MoonDailySnapshot
}

export function loadCross(id: i32, timestamp: BigInt): Cross {
    let cross = Cross.load(id.toString())
    if (cross == null) {
        let hour = hourFromTimestamp(timestamp)
        let day = dayFromTimestamp(timestamp)
        cross = new Cross(id.toString())
        //cross.pool == '1'
        cross.price = ZERO_BD
        cross.timestamp = timestamp
        cross.timeSinceLastCross = ZERO_BI
        cross.above = false
        cross.hourlySnapshot = hour
        cross.dailySnapshot = day
        //cross.poolHourlySnapshot = '1'
        //cross.poolDailySnapshot = '1'
        cross.save()
    }
    return cross as Cross
}
