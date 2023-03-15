import { loadMoonDailySnapshot, loadMoonHourlySnapshot } from "./utils/EntityLoaders";
import { Sunrise } from '../generated/Moonmage/Moonmage'

export function handleSunrise(event: Sunrise): void {
    // Update the season for hourly and daily liquidity metrics
    let hourly = loadMoonHourlySnapshot(event.block.timestamp)
    let daily = loadMoonDailySnapshot(event.block.timestamp)

    hourly.season = event.params.season.toI32()
    hourly.timestamp = event.block.timestamp
    hourly.blockNumber = event.block.number
    hourly.save()

    daily.season = event.params.season.toI32()
    daily.timestamp = event.block.timestamp
    daily.blockNumber = event.block.number
    daily.save()
}
