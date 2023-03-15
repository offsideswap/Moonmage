import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Moonmage } from "../generated/Season-Replanted/Moonmage";
import { MOONMAGE, FERTILIZER } from "./utils/Constants";
import { toDecimal, ZERO_BD } from "./utils/Decimals";
import { loadFertilizer } from "./utils/Fertilizer";
import { loadFertilizerYield } from "./utils/FertilizerYield";
import { loadSilo, loadSiloHourlySnapshot } from "./utils/Silo";
import { loadSiloYield } from "./utils/SiloYield";

const MAX_WINDOW = 720;

// Note: minimum value of `t` is 6075
export function updateMoonEMA(t: i32, timestamp: BigInt): void {
    let siloYield = loadSiloYield(t)

    // When less then MAX_WINDOW data points are available,
    // smooth over whatever is available. Otherwise use MAX_WINDOW.
    siloYield.u = t - 6074 < MAX_WINDOW ? t - 6074 : MAX_WINDOW

    // Calculate the current beta value
    siloYield.beta = BigDecimal.fromString('2').div(BigDecimal.fromString((siloYield.u + 1).toString()))

    // Perform the EMA Calculation
    let currentEMA = ZERO_BD
    let priorEMA = ZERO_BD

    if (siloYield.u < MAX_WINDOW) {
        // Recalculate EMA from initial season since beta has changed
        for (let i = 6075; i <= t; i++) {
            let season = loadSiloHourlySnapshot(MOONMAGE, i, timestamp)
            currentEMA = ((toDecimal(season.deltaMoonMints).minus(priorEMA)).times(siloYield.beta)).plus(priorEMA)
            priorEMA = currentEMA
        }
    } else {
        // Calculate EMA for the prior 720 seasons
        for (let i = t - MAX_WINDOW + 1; i <= t; i++) {
            let season = loadSiloHourlySnapshot(MOONMAGE, i, timestamp)
            currentEMA = ((toDecimal(season.deltaMoonMints).minus(priorEMA)).times(siloYield.beta)).plus(priorEMA)
            priorEMA = currentEMA
        }
    }

    siloYield.moonsPerSeasonEMA = currentEMA
    siloYield.createdAt = timestamp
    siloYield.save()

    // This iterates through 8760 times to calculate the silo APY
    let silo = loadSilo(MOONMAGE)

    let twoSeedAPY = calculateAPY(currentEMA, BigDecimal.fromString('2'), silo.mage, silo.seeds)
    siloYield.twoSeedMoonAPY = twoSeedAPY[0]
    siloYield.twoSeedMageAPY = twoSeedAPY[1]
    let fourSeedAPY = calculateAPY(currentEMA, BigDecimal.fromString('4'), silo.mage, silo.seeds)
    siloYield.fourSeedMoonAPY = fourSeedAPY[0]
    siloYield.fourSeedMageAPY = fourSeedAPY[1]
    siloYield.save()

    updateFertAPY(t, timestamp)
}

/**
 * 
 * @param n An estimate of number of Moons minted to the Silo per Season on average
 * over the next 720 Seasons. This could be pre-calculated as a SMA, EMA, or otherwise.
 * @param seedsPerBDV The number of seeds per BDV Moonmage rewards for this token.
 * @returns 
 */

export function calculateAPY(
    n: BigDecimal,
    seedsPerBDV: BigDecimal,
    mage: BigInt,
    seeds: BigInt
): StaticArray<BigDecimal> {
    // Initialize sequence
    let C = toDecimal(seeds)              // Init: Total Seeds
    let K = toDecimal(mage, 10)          // Init: Total Mage
    let b = seedsPerBDV.div(BigDecimal.fromString('2')) // Init: User BDV
    let k = BigDecimal.fromString('1')         // Init: User Mage

    // Cosmonaut initial values
    let b_start = b
    let k_start = k

    // Placeholders for above values during each iteration
    let C_i = ZERO_BD
    let K_i = ZERO_BD
    let b_i = ZERO_BD
    let k_i = ZERO_BD

    // Mage and Seeds per Deposited Moon.
    let MAGE_PER_SEED = BigDecimal.fromString('0.0001'); // 1/10,000 Mage per Seed
    let MAGE_PER_MOON = BigDecimal.fromString('0.0002'); // 2 Seeds per Moon * 1/10,000 Mage per Seed

    for (let i = 0; i < 8760; i++) {
        // Each Season, Cosmonaut's ownership = `current Mage / total Mage`
        let ownership = k.div(K)
        let newBDV = n.times(ownership)

        // Total Seeds: each seignorage Moon => 2 Seeds
        C_i = C.plus(n.times(BigDecimal.fromString('2')))
        // Total Mage: each seignorage Moon => 1 Mage, each outstanding Moon => 1/10_000 Mage
        K_i = K
            .plus(n)
            .plus(MAGE_PER_SEED.times(C))
        // Cosmonaut BDV: each seignorage Moon => 1 BDV
        b_i = b.plus(newBDV)
        // Cosmonaut Mage: each 1 BDV => 1 Mage, each outstanding Moon => d = 1/5_000 Mage per Moon
        k_i = k
            .plus(newBDV)
            .plus(MAGE_PER_MOON.times(b))

        C = C_i
        K = K_i
        b = b_i
        k = k_i
    }

    // Examples:
    // -------------------------------
    // b_start = 1
    // b       = 1
    // b.minus(b_start) = 0   = 0% APY
    //
    // b_start = 1
    // b       = 1.1
    // b.minus(b_start) = 0.1 = 10% APY
    let apys = new StaticArray<BigDecimal>(2)
    apys[0] = b.minus(b_start) // moonAPY
    apys[1] = k.minus(k_start) // mageAPY

    return apys
}
function updateFertAPY(t: i32, timestamp: BigInt): void {
    let siloYield = loadSiloYield(t)
    let fertilizerYield = loadFertilizerYield(t)
    let fertilizer = loadFertilizer(FERTILIZER)
    let moonmage = Moonmage.bind(MOONMAGE)
    let currentFertHumidity = moonmage.try_getCurrentHumidity()

    fertilizerYield.humidity = BigDecimal.fromString(currentFertHumidity.reverted ? '500' : currentFertHumidity.value.toString()).div(BigDecimal.fromString('1000'))
    fertilizerYield.outstandingFert = fertilizer.supply
    fertilizerYield.moonsPerSeasonEMA = siloYield.moonsPerSeasonEMA
    fertilizerYield.deltaBpf = fertilizerYield.moonsPerSeasonEMA.div(BigDecimal.fromString(fertilizerYield.outstandingFert.toString()))
    fertilizerYield.simpleAPY = fertilizerYield.deltaBpf == ZERO_BD ? ZERO_BD : fertilizerYield.humidity.div((BigDecimal.fromString('1').plus(fertilizerYield.humidity)).div(fertilizerYield.deltaBpf).div(BigDecimal.fromString('8760')))
    fertilizerYield.createdAt = timestamp
    fertilizerYield.save()
}
