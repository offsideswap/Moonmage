import { SiloYield } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadSiloYield(season: i32): SiloYield {
    let siloYield = SiloYield.load(season.toString())
    if (siloYield == null) {
        siloYield = new SiloYield(season.toString())
        siloYield.season = season
        siloYield.beta = ZERO_BD
        siloYield.u = 0
        siloYield.moonsPerSeasonEMA = ZERO_BD
        siloYield.twoSeedMoonAPY = ZERO_BD
        siloYield.twoSeedMageAPY = ZERO_BD
        siloYield.fourSeedMoonAPY = ZERO_BD
        siloYield.fourSeedMageAPY = ZERO_BD
        siloYield.createdAt = ZERO_BI
        siloYield.save()
    }
    return siloYield as SiloYield
}
