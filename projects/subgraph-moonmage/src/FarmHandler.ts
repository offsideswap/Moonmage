import { Address, BigInt } from "@graphprotocol/graph-ts";
import { InternalBalanceChanged } from "../generated/Farm/Moonmage";
import { loadMoonmage } from "./utils/Moonmage";
import { MOONMAGE } from "./utils/Constants";
import { loadSiloAsset, loadSiloAssetDailySnapshot, loadSiloAssetHourlySnapshot } from "./utils/SiloAsset";
import { loadCosmonaut } from "./utils/Cosmonaut";


export function handleInternalBalanceChanged(event: InternalBalanceChanged): void {

    let moonmage = loadMoonmage(MOONMAGE)

    loadCosmonaut(event.params.user)

    updateFarmTotals(MOONMAGE, event.params.token, moonmage.lastSeason, event.params.delta, event.block.timestamp)
    updateFarmTotals(event.params.user, event.params.token, moonmage.lastSeason, event.params.delta, event.block.timestamp)

}

function updateFarmTotals(account: Address, token: Address, season: i32, delta: BigInt, timestamp: BigInt): void {
    let asset = loadSiloAsset(account, token)
    let assetHourly = loadSiloAssetHourlySnapshot(account, token, season, timestamp)
    let assetDaily = loadSiloAssetDailySnapshot(account, token, timestamp)

    asset.farmAmount = asset.farmAmount.plus(delta)
    asset.save()

    assetHourly.farmAmount = asset.farmAmount
    assetHourly.deltaFarmAmount = assetHourly.deltaFarmAmount.plus(delta)
    assetHourly.updatedAt = timestamp
    assetHourly.save()

    assetDaily.season = season
    assetDaily.farmAmount = asset.farmAmount
    assetDaily.deltaFarmAmount = assetDaily.deltaFarmAmount.plus(delta)
    assetDaily.updatedAt = timestamp
    assetDaily.save()
}
