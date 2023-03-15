import { BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { AddLiquidity, RemoveLiquidity, RemoveLiquidityImbalance, RemoveLiquidityOne, TokenExchange, TokenExchangeUnderlying } from "../generated/Moon3CRV/Moon3CRV";
import { CurvePrice } from "../generated/Moon3CRV/CurvePrice";
import { CURVE_PRICE } from "./utils/Constants";
import { ONE_BD, toDecimal, ZERO_BD, ZERO_BI } from "./utils/Decimals";
import { loadMoon, loadMoonDailySnapshot, loadMoonHourlySnapshot, loadCross } from "./utils/EntityLoaders";

export function handleTokenExchange(event: TokenExchange): void {
    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let moon = loadMoon()
    let moonHourly = loadMoonHourlySnapshot(event.block.timestamp)
    let moonDaily = loadMoonDailySnapshot(event.block.timestamp)

    let oldPrice = moon.price
    let newPrice = toDecimal(curve.value.price)
    let moonVolume = ZERO_BI

    if (event.params.sold_id == ZERO_BI) {
        moonVolume = event.params.tokens_sold
    } else if (event.params.bought_id == ZERO_BI) {
        moonVolume = event.params.tokens_bought
    }
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(moon.totalLiquidityUSD)

    moon.totalVolume = moon.totalVolume.plus(moonVolume)
    moon.totalVolumeUSD = moon.totalVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    //moon.totalLiquidity = curve.value.lpBdv
    moon.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    moon.price = toDecimal(curve.value.price)
    moon.save()

    moonHourly.totalVolume = moon.totalVolume
    moonHourly.totalVolumeUSD = moon.totalVolumeUSD
    moonHourly.totalLiquidityUSD = moon.totalLiquidityUSD
    moonHourly.price = moon.price
    moonHourly.hourlyVolume = moonHourly.hourlyVolume.plus(moonVolume)
    moonHourly.hourlyVolumeUSD = moonHourly.hourlyVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    moonHourly.hourlyLiquidityUSD = moonHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    moonHourly.save()

    moonDaily.totalVolume = moon.totalVolume
    moonDaily.totalVolumeUSD = moon.totalVolumeUSD
    moonDaily.totalLiquidityUSD = moon.totalLiquidityUSD
    moonDaily.price = moon.price
    moonDaily.dailyVolume = moonDaily.dailyVolume.plus(moonVolume)
    moonDaily.dailyVolumeUSD = moonDaily.dailyVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    moonDaily.dailyLiquidityUSD = moonDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    moonDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(moon.lastCross)
        cross.above = false
        cross.save()

        moon.lastCross = event.block.timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(moon.lastCross)
        cross.above = true
        cross.save()

        moon.lastCross = event.block.timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {

    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let moon = loadMoon()
    let moonHourly = loadMoonHourlySnapshot(event.block.timestamp)
    let moonDaily = loadMoonDailySnapshot(event.block.timestamp)

    let oldPrice = moon.price
    let newPrice = toDecimal(curve.value.price)
    let moonVolume = ZERO_BI

    if (event.params.sold_id == ZERO_BI) {
        moonVolume = event.params.tokens_sold
    } else if (event.params.bought_id == ZERO_BI) {
        moonVolume = event.params.tokens_bought
    }
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(moon.totalLiquidityUSD)

    moon.totalVolume = moon.totalVolume.plus(moonVolume)
    moon.totalVolumeUSD = moon.totalVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    //moon.totalLiquidity = curve.value.lpBdv
    moon.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    moon.price = toDecimal(curve.value.price)
    moon.save()

    moonHourly.totalVolume = moon.totalVolume
    moonHourly.totalVolumeUSD = moon.totalVolumeUSD
    moonHourly.totalLiquidityUSD = moon.totalLiquidityUSD
    moonHourly.price = moon.price
    moonHourly.hourlyVolume = moonHourly.hourlyVolume.plus(moonVolume)
    moonHourly.hourlyVolumeUSD = moonHourly.hourlyVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    moonHourly.hourlyLiquidityUSD = moonHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    moonHourly.save()

    moonDaily.totalVolume = moon.totalVolume
    moonDaily.totalVolumeUSD = moon.totalVolumeUSD
    moonDaily.totalLiquidityUSD = moon.totalLiquidityUSD
    moonDaily.price = moon.price
    moonDaily.dailyVolume = moonDaily.dailyVolume.plus(moonVolume)
    moonDaily.dailyVolumeUSD = moonDaily.dailyVolumeUSD.plus(toDecimal(moonVolume).times(newPrice))
    moonDaily.dailyLiquidityUSD = moonDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    moonDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(moon.lastCross)
        cross.above = false
        cross.save()

        moon.lastCross = event.block.timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, event.block.timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = event.block.timestamp.minus(moon.lastCross)
        cross.above = true
        cross.save()

        moon.lastCross = event.block.timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }
}

export function handleAddLiquidity(event: AddLiquidity): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amounts[0], event.params.token_amounts[1])
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
    handleLiquidityChange(event.block.timestamp, event.params.token_amount, ZERO_BI)
}

function handleLiquidityChange(timestamp: BigInt, token0Amount: BigInt, token1Amount: BigInt): void {
    // Get Curve Price Details
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let curve = curvePrice.try_getCurve()

    if (curve.reverted) { return }

    let moon = loadMoon()
    let moonHourly = loadMoonHourlySnapshot(timestamp)
    let moonDaily = loadMoonDailySnapshot(timestamp)

    let oldPrice = moon.price
    let newPrice = toDecimal(curve.value.price)
    let deltaLiquidityUSD = toDecimal(curve.value.liquidity).minus(moon.totalLiquidityUSD)

    let volumeUSD = deltaLiquidityUSD < ZERO_BD ? deltaLiquidityUSD.div(BigDecimal.fromString('2')).times(BigDecimal.fromString('-1')) : deltaLiquidityUSD.div(BigDecimal.fromString('2'))
    let moonVolume = BigInt.fromString(volumeUSD.div(newPrice).times(BigDecimal.fromString('1000000')).truncate(0).toString())

    if (token0Amount !== ZERO_BI && token1Amount !== ZERO_BI) {
        volumeUSD = ZERO_BD
        moonVolume = ZERO_BI
    }
    moon.totalVolume = moon.totalVolume.plus(moonVolume)
    moon.totalVolumeUSD = moon.totalVolumeUSD.plus(volumeUSD)
    moon.totalLiquidityUSD = toDecimal(curve.value.liquidity)
    moon.price = toDecimal(curve.value.price)
    moon.save()

    moonHourly.totalVolume = moon.totalVolume
    moonHourly.totalVolumeUSD = moon.totalVolumeUSD
    moonHourly.totalLiquidityUSD = moon.totalLiquidityUSD
    moonHourly.price = moon.price
    moonHourly.hourlyLiquidityUSD = moonHourly.hourlyLiquidityUSD.plus(deltaLiquidityUSD)
    moonHourly.hourlyVolume = moonHourly.hourlyVolume.plus(moonVolume)
    moonHourly.hourlyVolumeUSD = moonHourly.hourlyVolumeUSD.plus(volumeUSD)
    moonHourly.save()

    moonHourly.totalVolume = moon.totalVolume
    moonHourly.totalVolumeUSD = moon.totalVolumeUSD
    moonDaily.totalLiquidityUSD = moon.totalLiquidityUSD
    moonDaily.price = moon.price
    moonDaily.dailyLiquidityUSD = moonDaily.dailyLiquidityUSD.plus(deltaLiquidityUSD)
    moonDaily.dailyVolume = moonDaily.dailyVolume.plus(moonVolume)
    moonDaily.dailyVolumeUSD = moonDaily.dailyVolumeUSD.plus(volumeUSD)
    moonDaily.save()

    // Handle a peg cross
    if (oldPrice >= ONE_BD && newPrice < ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = timestamp.minus(moon.lastCross)
        cross.above = false
        cross.save()

        moon.lastCross = timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }

    if (oldPrice < ONE_BD && newPrice >= ONE_BD) {
        let cross = loadCross(moon.totalCrosses + 1, timestamp)
        cross.price = newPrice
        cross.timeSinceLastCross = timestamp.minus(moon.lastCross)
        cross.above = true
        cross.save()

        moon.lastCross = timestamp
        moon.totalCrosses += 1
        moon.save()

        moonHourly.totalCrosses += 1
        moonHourly.hourlyCrosses += 1
        moonHourly.save()

        moonDaily.totalCrosses += 1
        moonDaily.dailyCrosses += 1
        moonDaily.save()
    }
}
