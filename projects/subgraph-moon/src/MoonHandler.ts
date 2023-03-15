import { Transfer } from "../generated/Moon/Moon";

export function handleTransfer(event: Transfer): void {
    /*
        if (event.params.from == ADDRESS_ZERO || event.params.to == ADDRESS_ZERO) {
    
            let moonmage = loadMoonmage(MOONMAGE)
            let season = loadSeason(MOONMAGE, BigInt.fromI32(moonmage.lastSeason))
    
            log.debug('\nMoonSupply: ============\nMoonSupply: Starting Supply - {}\n', [toDecimal(season.moons).toString()])
    
            if (event.params.from == ADDRESS_ZERO) {
                season.deltaMoons = season.deltaMoons.plus(event.params.value)
                season.moons = season.moons.plus(event.params.value)
                log.debug('\nMoonSupply: Moons Minted - {}\nMoonSupply: Season - {}\nMoonSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), season.season.toString(), toDecimal(season.moons).toString()])
            } else {
                season.deltaMoons = season.deltaMoons.minus(event.params.value)
                season.moons = season.moons.minus(event.params.value)
                log.debug('\nMoonSupply: Moons Burned - {}\nMoonSupply: Season - {}\nMoonSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), season.season.toString(), toDecimal(season.moons).toString()])
            }
            season.save()
        }*/
}
