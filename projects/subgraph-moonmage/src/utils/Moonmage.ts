import { Address } from "@graphprotocol/graph-ts";
import { Moonmage } from "../../generated/schema";
import { ZERO_BI } from "./Decimals";

export function loadMoonmage(protocol: Address): Moonmage {
    let moonmage = Moonmage.load(protocol.toHexString())
    if (moonmage == null) {
        moonmage = new Moonmage(protocol.toHexString())
        moonmage.name = 'Moonmage'
        moonmage.slug = 'moonmage'
        moonmage.schemaVersion = '2.0.0'
        moonmage.subgraphVersion = '2.0.0'
        moonmage.methodologyVersion = '2.0.0'
        moonmage.lastUpgrade = ZERO_BI
        moonmage.lastSeason = 1
        moonmage.activeCosmonauts = []
        moonmage.cosmomagesToUpdate = []
        moonmage.save()
    }
    return moonmage as Moonmage
}
