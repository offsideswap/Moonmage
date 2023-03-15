import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Cosmonaut, Fertilizer, FertilizerBalance, FertilizerToken } from "../../generated/schema"
import { ZERO_BD, ZERO_BI } from "./Decimals"
import { MOONMAGE, INITIAL_HUMIDITY } from "./Constants"
import { Moonmage } from "../../generated/Fertilizer/Moonmage"

export function loadFertilizer(fertilizerAddress: Address): Fertilizer {
    let fertilizer = Fertilizer.load(fertilizerAddress.toHexString())
    if (fertilizer == null) {
        fertilizer = new Fertilizer(fertilizerAddress.toHexString())
        fertilizer.supply = ZERO_BI
        fertilizer.save()
    }
    return fertilizer
}

export function loadFertilizerToken(fertilizer: Fertilizer, id: BigInt, blockNumber: BigInt): FertilizerToken {
    let fertilizerToken = FertilizerToken.load(id.toString())
    if (fertilizerToken == null) {
        let moonmage = Moonmage.bind(MOONMAGE)
        fertilizerToken = new FertilizerToken(id.toString())
        fertilizerToken.fertilizer = fertilizer.id
        if (blockNumber.gt(BigInt.fromString('15278963'))) {
            fertilizerToken.humidity = BigDecimal.fromString(moonmage.getCurrentHumidity().toString()).div(BigDecimal.fromString('10'))
            fertilizerToken.season = moonmage.season().toI32()
            fertilizerToken.startBpf = moonmage.moonsPerFertilizer()
        } else {
            fertilizerToken.humidity = BigDecimal.fromString('500')
            fertilizerToken.season = 6074
            fertilizerToken.startBpf = ZERO_BI
        }
        fertilizerToken.endBpf = id
        fertilizerToken.supply = ZERO_BI
        fertilizerToken.save()
    }
    return fertilizerToken
}

export function loadFertilizerBalance(fertilizerToken: FertilizerToken, cosmomage: Cosmonaut): FertilizerBalance {
    const id = `${fertilizerToken.id}-${cosmomage.id}`
    let fertilizerBalance = FertilizerBalance.load(id)
    if (fertilizerBalance == null) {
        fertilizerBalance = new FertilizerBalance(id)
        fertilizerBalance.cosmomage = cosmomage.id
        fertilizerBalance.fertilizerToken = fertilizerToken.id
        fertilizerBalance.amount = ZERO_BI
        fertilizerBalance.save()
    }
    return fertilizerBalance
}
