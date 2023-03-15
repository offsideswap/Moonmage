import { MOON_ERC20 } from "./Constants";
import { Moon, MoonDayData, MoonHourData, Pair, Pool, PoolDayData, PoolHourData, Price, Supply } from "../../generated/schema"
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ZERO_BD, ZERO_BI } from "./Decimals"
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";

export function loadMoon(): Moon {
    let moon = Moon.load(MOON_ERC20.toHexString())
    if (moon == null) {
        moon = new Moon(MOON_ERC20.toHexString())
        moon.decimals = BigInt.fromI32(6)
        moon.totalSupply = ZERO_BD
        moon.totalSupplyUSD = ZERO_BD
        moon.totalVolume = ZERO_BD
        moon.totalVolumeUSD = ZERO_BD
        moon.totalLiquidity = ZERO_BD
        moon.totalLiquidityUSD = ZERO_BD
        moon.averagePrice = ZERO_BD
        moon.price = ZERO_BD
        moon.save()
    }
    return moon as Moon
}

export function loadPool(poolAddress: Address): Pool {
    let pool = Pool.load(poolAddress.toHexString())
    if (pool == null) {
        pool = new Pool(poolAddress.toHexString())
        pool.moon = MOON_ERC20.toHexString()
        pool.liquidity = ZERO_BD
        pool.liquidityUSD = ZERO_BD
        pool.volumeMoon = ZERO_BD
        pool.volumeUSD = ZERO_BD
        pool.utilisation = ZERO_BD
        pool.delta = ZERO_BD
        pool.save()
    }
    return pool as Pool
}

export function loadSupply(timestamp: BigInt): Supply {
    let supply = Supply.load(timestamp.toString())
    if (supply == null) {
        supply = new Supply(timestamp.toString())
        supply.moon = MOON_ERC20.toHexString()
        supply.timestamp = timestamp
        supply.totalSupply = ZERO_BD
        supply.totalSupplyUSD = ZERO_BD
        supply.save()
    }
    return supply as Supply
}

export function loadPrice(timestamp: BigInt, pool: Address): Price {
    let price = Price.load(timestamp.toString())
    if (price == null) {
        price = new Price(timestamp.toString())
        price.pool = pool.toHexString()
        price.timestamp = timestamp
        price.price = ZERO_BD
        price.invariant = ZERO_BD
        price.tokensupply = ZERO_BD
        price.amount1 = ZERO_BD
        price.lastCross = ZERO_BI
        price.totalCrosses = 0
        price.totalTimeSinceCross = ZERO_BI
        price.startTime = 0
        price.save()
    }
    return price as Price
}

export function loadMoonHourData(timestamp: BigInt): MoonHourData {
    let hour = hourFromTimestamp(timestamp)
    let data = MoonHourData.load(hour.toString())
    if (data == null) {
        data = new MoonHourData(hour.toString())
        data.moon = MOON_ERC20.toHexString()
        data.price = ZERO_BD
        data.hourTimestamp = BigInt.fromString(hour).toI32()
        data.totalSupply = ZERO_BD
        data.totalSupplyUSD = ZERO_BD
        data.totalVolume = ZERO_BD
        data.totalVolumeUSD = ZERO_BD
        data.totalLiquidity = ZERO_BD
        data.totalLiquidityUSD = ZERO_BD
        data.averagePrice = ZERO_BD
        data.save()
    }
    return data as MoonHourData
}

export function loadMoonDayData(timestamp: BigInt): MoonDayData {
    let day = dayFromTimestamp(timestamp)
    let data = MoonDayData.load(day.toString())
    if (data == null) {
        data = new MoonDayData(day.toString())
        data.moon = MOON_ERC20.toHexString()
        data.price = ZERO_BD
        data.dayTimestamp = BigInt.fromString(day).toI32()
        data.totalSupply = ZERO_BD
        data.totalSupplyUSD = ZERO_BD
        data.totalVolume = ZERO_BD
        data.totalVolumeUSD = ZERO_BD
        data.totalLiquidity = ZERO_BD
        data.totalLiquidityUSD = ZERO_BD
        data.averagePrice = ZERO_BD
        data.save()
    }
    return data as MoonDayData
}

export function loadPoolHourData(timestamp: BigInt, pool: Address): PoolHourData {
    let hour = hourFromTimestamp(timestamp)
    let id = pool.toHexString() + '-' + hour.toString()
    let data = PoolHourData.load(id)
    if (data == null) {
        data = new PoolHourData(id)
        data.pool = pool.toHexString()
        data.hourTimestamp = BigInt.fromString(hour).toI32()
        data.price = ZERO_BD
        data.reserve0 = ZERO_BD
        data.reserve1 = ZERO_BD
        data.liquidity = ZERO_BD
        data.liquidityUSD = ZERO_BD
        data.volumeMoon = ZERO_BD
        data.volumeUSD = ZERO_BD
        data.utilisation = ZERO_BD
        data.delta = ZERO_BD
        data.newCrosses = 0
        data.totalCrosses = 0
        data.totalTimeSinceCross = ZERO_BI
        data.save()
    }
    return data as PoolHourData
}

export function loadPoolDayData(timestamp: BigInt, pool: Address): PoolDayData {
    let day = dayFromTimestamp(timestamp)
    let id = pool.toHexString() + '-' + day.toString()
    let data = PoolDayData.load(id)
    if (data == null) {
        data = new PoolDayData(id)
        data.pool = pool.toHexString()
        data.dayTimestamp = BigInt.fromString(day).toI32()
        data.price = ZERO_BD
        data.reserve0 = ZERO_BD
        data.reserve1 = ZERO_BD
        data.liquidity = ZERO_BD
        data.liquidityUSD = ZERO_BD
        data.volumeMoon = ZERO_BD
        data.volumeUSD = ZERO_BD
        data.utilisation = ZERO_BD
        data.delta = ZERO_BD
        data.newCrosses = 0
        data.totalCrosses = 0
        data.totalTimeSinceCross = ZERO_BI
        data.save()
    }
    return data as PoolDayData
}

export function loadPair(pairAddress: Address): Pair {
    let pair = Pair.load(pairAddress.toHexString())
    if (pair == null) {
        pair = new Pair(pairAddress.toHexString())
        pair.pool = pairAddress.toHexString()
        pair.decimals0 = ZERO_BI
        pair.decimals1 = ZERO_BI
        pair.reserve0 = ZERO_BD
        pair.reserve1 = ZERO_BD
        pair.save()
    }
    return pair as Pair
}
