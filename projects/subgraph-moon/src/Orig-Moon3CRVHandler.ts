import { TokenExchangeUnderlying } from '../generated/Moon3CRV/Moon3CRV'
import { CurvePrice } from '../generated/Moon3CRV/CurvePrice'
import { CURVE_PRICE } from './utils/Constants'
import { toDecimal, ZERO_BI } from './utils/Decimals'
import { loadMoon, loadMoonDayData, loadMoonHourData, loadPool, loadPoolDayData, loadPoolHourData } from './utils/Orig-EntityLoaders'

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
    let curvePrice = CurvePrice.bind(CURVE_PRICE)

    let price = curvePrice.try_getCurve()

    let moon = loadMoon()
    let moonHourly = loadMoonHourData(event.block.timestamp)
    let moonDaily = loadMoonDayData(event.block.timestamp)

    let moonVolume = event.params.sold_id == ZERO_BI ? toDecimal(event.params.tokens_sold) : toDecimal(event.params.tokens_bought)

    moon.price = toDecimal(price.price)
    moon.totalVolume = moon.totalVolume.plus(moonVolume)
    moon.totalVolumeUSD = moon.totalVolumeUSD.plus(moonVolume.times(toDecimal(price.price)))
    moon.save()

    moonHourly.price = toDecimal(price.price)
    moonHourly.totalVolume = moonHourly.totalVolume.plus(moonVolume)
    moonHourly.totalVolumeUSD = moonHourly.totalVolumeUSD.plus(moonVolume.times(toDecimal(price.price)))
    moonHourly.totalLiquidity = toDecimal(price.lpBdv)
    moonHourly.totalLiquidityUSD = toDecimal(price.lpUsd)
    moonHourly.save()

    moonDaily.price = toDecimal(price.price)
    moonDaily.totalVolume = moonDaily.totalVolume.plus(moonVolume)
    moonDaily.totalVolumeUSD = moonDaily.totalVolumeUSD.plus(moonVolume.times(toDecimal(price.price)))
    moonDaily.save()

    let pool = loadPool(event.address)
    let poolHourly = loadPoolHourData(event.block.timestamp, event.address)
    let poolDaily = loadPoolDayData(event.block.timestamp, event.address)


}


/*

export function handleSync(event: Sync): void {
    let pair = Pair.load(event.address.toHex())
    if (pair == null) pair = initializePair(event.address)

    pair.reserve0 = convertTokenToDecimal(event.params.reserve0, pair.decimals0)
    pair.reserve1 = convertTokenToDecimal(event.params.reserve1, pair.decimals1)

    pair.save()

    let moonPair = Pair.load(moonPairAddress.toHex())
    let usdcPair = Pair.load(usdcPairAddress.toHex())

    let moon = getMoon(event.block.timestamp)
    if (moon.lastCross == ZERO_BI) moon.lastCross = event.block.timestamp

    if (moonPair != null && usdcPair != null) {

        let timestamp = event.block.timestamp.toI32()
        let dayId = timestamp / 86400
        let dayData = getDayData(dayId, moon!)

        let hourId = timestamp / 3600
        let hourData = getHourData(hourId, moon!)

        let price = moonPair.reserve0 / moonPair.reserve1 * usdcPair.reserve0 / usdcPair.reserve1
        if ((moon.price.le(ONE_BD) && price.ge(ONE_BD)) ||
            (moon.price.ge(ONE_BD) && price.le(ONE_BD))) {

            let timestamp = event.block.timestamp.toI32()

            createCross(moon.totalCrosses, timestamp, moon.lastCross.toI32(), dayData.id, hourData.id, price.ge(ONE_BD))
            // dayData = updateDayDataWithCross(moon!, dayData, timestamp)
            // hourData = updateHourDataWithCross(moon!, hourData!, timestamp)

            hourData.newCrosses = hourData.newCrosses + 1
            hourData.totalCrosses = hourData.totalCrosses + 1

            dayData.newCrosses = dayData.newCrosses + 1
            dayData.totalCrosses = dayData.totalCrosses + 1

            moon.totalCrosses = moon.totalCrosses + 1

            let timeSinceLastCross = event.block.timestamp.minus(moon.lastCross)
            hourData.totalTimeSinceCross = hourData.totalTimeSinceCross.plus(timeSinceLastCross)
            dayData.totalTimeSinceCross = hourData.totalTimeSinceCross.plus(timeSinceLastCross)
            moon.totalTimeSinceCross = moon.totalTimeSinceCross.plus(timeSinceLastCross)

            moon.lastCross = event.block.timestamp
        }
        moon.price = price
        moon.save()

        let priceId = event.block.timestamp.toString()
        let timestampPrice = Price.load(priceId)
        if (timestampPrice === null) {
            timestampPrice = new Price(priceId)
            timestampPrice.moon = moon.id
            timestampPrice.timestamp = event.block.timestamp
            timestampPrice.price = moon.price
        }
        timestampPrice.save()

        dayData.price = moon.price
        dayData.save()

        hourData.price = moon.price
        hourData.save()
    }

}
*/
