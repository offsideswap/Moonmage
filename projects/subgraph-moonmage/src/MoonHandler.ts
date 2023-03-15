import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Transfer as LegacyTransfer } from "../generated/Moon/ERC20";
import { Transfer } from "../generated/Moon-Replanted/ERC20";
import { Moonmage } from "../generated/schema";
import { ADDRESS_ZERO, MOONMAGE } from "./utils/Constants";
import { loadField } from "./utils/Field";
import { loadSeason } from "./utils/Season";
import { toDecimal, ZERO_BI } from "./utils/Decimals";
import { loadMoonmage } from "./utils/Moonmage";

export function handleLegacyTransfer(event: LegacyTransfer): void {

    if (event.block.number > BigInt.fromI32(14603000)) { return }

    if (event.block.number > BigInt.fromI32(14602789)) {
        let moonmage = loadMoonmage(MOONMAGE)
        let season = loadSeason(MOONMAGE, BigInt.fromI32(moonmage.lastSeason))
        season.deltaMoons = ZERO_BI
        season.moons = ZERO_BI
        season.price = BigDecimal.fromString('1.022')
        season.save()
        return
    }

    if (event.params.from == ADDRESS_ZERO || event.params.to == ADDRESS_ZERO) {

        let moonmage = loadMoonmage(MOONMAGE)
        let season = loadSeason(MOONMAGE, BigInt.fromI32(moonmage.lastSeason))

        log.debug('\nMoonSupply: ============\nMoonSupply: Starting Supply - {}\n', [season.moons.toString()])

        if (event.params.from == ADDRESS_ZERO) {
            season.deltaMoons = season.deltaMoons.plus(event.params.value)
            season.moons = season.moons.plus(event.params.value)
            log.debug('\nMoonSupply: Moons Minted - {}\nMoonSupply: Season - {}\nMoonSupply: Total Supply - {}\n', [event.params.value.toString(), season.season.toString(), season.moons.toString()])
        } else {
            season.deltaMoons = season.deltaMoons.minus(event.params.value)
            season.moons = season.moons.minus(event.params.value)
            log.debug('\nMoonSupply: Moons Burned - {}\nMoonSupply: Season - {}\nMoonSupply: Total Supply - {}\n', [event.params.value.toString(), season.season.toString(), season.moons.toString()])
        }
        season.save()
    }
}

export function handleTransfer(event: Transfer): void {

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
    }
}
