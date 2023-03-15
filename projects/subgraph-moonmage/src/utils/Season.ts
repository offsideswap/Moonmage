import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Season } from "../../generated/schema";
import { loadMoonmage } from "./Moonmage";
import { ONE_BI, ZERO_BD, ZERO_BI } from "./Decimals";

export function loadSeason(diamondAddress: Address, id: BigInt): Season {
    let season = Season.load(id.toString())
    if (season == null) {
        season = new Season(id.toString())
        season.moonmage = diamondAddress.toHexString()
        season.season = id.toI32()
        season.createdAt = ZERO_BI
        season.price = ZERO_BD
        season.moons = ZERO_BI
        season.marketCap = ZERO_BD
        season.deltaB = ZERO_BI
        season.deltaMoons = ZERO_BI
        season.rewardMoons = ZERO_BI
        season.incentiveMoons = ZERO_BI
        season.harvestableIndex = ZERO_BI
        season.save()
        if (id > ZERO_BI) {
            let lastSeason = loadSeason(diamondAddress, id.minus(ONE_BI))
            season.moons = lastSeason.moons
            season.harvestableIndex = lastSeason.harvestableIndex
            season.save()
        }

        // Update moonmage season
        let moonmage = loadMoonmage(diamondAddress)
        moonmage.lastSeason = season.season
        moonmage.save()
    }
    return season
}
