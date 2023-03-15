import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Silo, SiloHourlySnapshot, SiloDailySnapshot } from "../../generated/schema";
import { MOONMAGE } from "./Constants";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadSilo(account: Address): Silo {
    let silo = Silo.load(account.toHexString())
    if (silo == null) {
        silo = new Silo(account.toHexString())
        silo.moonmage = MOONMAGE.toHexString()
        if (account !== MOONMAGE) { silo.cosmomage = account.toHexString() }
        silo.whitelistedTokens = []
        silo.depositedBDV = ZERO_BI
        silo.mage = ZERO_BI
        silo.plantableMage = ZERO_BI
        silo.seeds = ZERO_BI
        silo.roots = ZERO_BI
        silo.moonMints = ZERO_BI
        silo.activeCosmonauts = 0
        silo.save()
    }
    return silo as Silo
}

export function loadSiloHourlySnapshot(account: Address, season: i32, timestamp: BigInt): SiloHourlySnapshot {
    let hour = hourFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + season.toString()
    let snapshot = SiloHourlySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new SiloHourlySnapshot(id)
        let silo = loadSilo(account)
        snapshot.season = season
        snapshot.silo = account.toHexString()
        snapshot.depositedBDV = silo.depositedBDV
        snapshot.mage = silo.mage
        snapshot.plantableMage = silo.plantableMage
        snapshot.seeds = silo.seeds
        snapshot.roots = silo.roots
        snapshot.moonMints = silo.moonMints
        snapshot.activeCosmonauts = silo.activeCosmonauts
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaMage = ZERO_BI
        snapshot.deltaPlantableMage = ZERO_BI
        snapshot.deltaSeeds = ZERO_BI
        snapshot.deltaRoots = ZERO_BI
        snapshot.deltaMoonMints = ZERO_BI
        snapshot.deltaActiveCosmonauts = 0
        snapshot.createdAt = BigInt.fromString(hour)
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot as SiloHourlySnapshot
}

export function loadSiloDailySnapshot(account: Address, timestamp: BigInt): SiloDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + day.toString()
    let snapshot = SiloDailySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new SiloDailySnapshot(id)
        let silo = loadSilo(account)
        snapshot.season = 0
        snapshot.silo = account.toHexString()
        snapshot.depositedBDV = silo.depositedBDV
        snapshot.mage = silo.mage
        snapshot.plantableMage = silo.plantableMage
        snapshot.seeds = silo.seeds
        snapshot.roots = silo.roots
        snapshot.moonMints = silo.moonMints
        snapshot.activeCosmonauts = silo.activeCosmonauts
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaMage = ZERO_BI
        snapshot.deltaPlantableMage = ZERO_BI
        snapshot.deltaSeeds = ZERO_BI
        snapshot.deltaRoots = ZERO_BI
        snapshot.deltaMoonMints = ZERO_BI
        snapshot.deltaActiveCosmonauts = 0
        snapshot.createdAt = BigInt.fromString(day)
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot as SiloDailySnapshot
}
