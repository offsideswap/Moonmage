import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { FundFundraiser, Harvest, PlotTransfer, Sow, SupplyDecrease, SupplyIncrease, SupplyNeutral, WeatherChange } from '../generated/Field/Moonmage'
import { CurvePrice } from '../generated/Field/CurvePrice'
import { Harvest as HarvestEntity } from '../generated/schema'
import { MOONMAGE, MOONMAGE_FARMS, CURVE_PRICE } from './utils/Constants'
import { ONE_BD, toDecimal, ZERO_BD, ZERO_BI } from './utils/Decimals'
import { loadCosmonaut } from './utils/Cosmonaut'
import { loadField, loadFieldDaily, loadFieldHourly } from './utils/Field'
import { loadPlot } from './utils/Plot'
import { savePodTransfer } from './utils/PodTransfer'
import { loadSeason } from './utils/Season'
import { loadMoonmage } from './utils/Moonmage'

export function handleWeatherChange(event: WeatherChange): void {
    let field = loadField(event.address)
    let fieldHourly = loadFieldHourly(event.address, event.params.season.toI32(), event.block.timestamp)
    let fieldDaily = loadFieldDaily(event.address, event.block.timestamp)

    field.temperature += event.params.change
    fieldHourly.temperature += event.params.change
    fieldDaily.temperature += event.params.change

    // Real Rate of Return

    let season = loadSeason(event.address, event.params.season)
    let curvePrice = CurvePrice.bind(CURVE_PRICE)
    let currentPrice = season.price == ZERO_BD ? toDecimal(curvePrice.getCurve().price, 6) : season.price

    field.realRateOfReturn = (ONE_BD.plus(BigDecimal.fromString((field.temperature / 100).toString()))).div(currentPrice)
    fieldHourly.realRateOfReturn = field.realRateOfReturn
    fieldHourly.realRateOfReturn = field.realRateOfReturn

    field.save()
    fieldHourly.save()
    fieldDaily.save()
}

export function handleSow(event: Sow): void {
    let moonmage = loadMoonmage(event.address)

    let sownMoons = event.params.moons

    if (event.params.account == MOONMAGE_FARMS) {
        let startingField = loadField(event.address)
        sownMoons = startingField.soil
    }

    // Update Moonmage Totals
    updateFieldTotals(event.address, moonmage.lastSeason, ZERO_BI, sownMoons, event.params.pods, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

    // Update Cosmonaut Totals
    updateFieldTotals(event.params.account, moonmage.lastSeason, ZERO_BI, sownMoons, event.params.pods, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)


    let field = loadField(event.address)
    let cosmomage = loadCosmonaut(event.params.account)
    let plot = loadPlot(event.address, event.params.index)

    let newIndexes = field.plotIndexes
    newIndexes.push(plot.index)
    field.plotIndexes = newIndexes
    field.save()

    plot.cosmomage = event.params.account.toHexString()
    plot.source = 'SOW'
    plot.season = field.season
    plot.creationHash = event.transaction.hash.toHexString()
    plot.createdAt = event.block.timestamp
    plot.updatedAt = event.block.timestamp
    plot.moons = event.params.moons
    plot.pods = event.params.pods
    plot.sownPods = event.params.pods
    plot.temperature = field.temperature
    plot.save()

    // Increment protocol amounts
    incrementSows(event.address, field.season, event.block.timestamp)

    // Increment cosmomage amounts
    incrementSows(event.params.account, field.season, event.block.timestamp)
}

export function handleHarvest(event: Harvest): void {

    let moonmage = loadMoonmage(event.address)
    let season = loadSeason(event.address, BigInt.fromI32(moonmage.lastSeason))

    // Harvest function is only called with a list of plots

    // Update plots and field totals

    let remainingIndex = ZERO_BI

    for (let i = 0; i < event.params.plots.length; i++) {

        // Plot should exist
        let plot = loadPlot(event.address, event.params.plots[i])

        let harvestablePods = season.harvestableIndex.minus(plot.index)

        if (harvestablePods >= plot.pods) {
            // Plot fully harvests
            updateFieldTotals(event.address, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, plot.pods, event.block.timestamp, event.block.number)
            updateFieldTotals(event.params.account, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, plot.pods, event.block.timestamp, event.block.number)

            plot.harvestedPods = plot.pods
            plot.fullyHarvested = true
            plot.save()
        } else {
            // Plot partially harvests

            updateFieldTotals(event.address, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, harvestablePods, event.block.timestamp, event.block.number)
            updateFieldTotals(event.params.account, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, harvestablePods, event.block.timestamp, event.block.number)

            remainingIndex = plot.index.plus(harvestablePods)
            let remainingPods = plot.pods.minus(harvestablePods)

            let remainingPlot = loadPlot(event.address, remainingIndex)
            remainingPlot.cosmomage = plot.cosmomage
            remainingPlot.source = 'HARVEST'
            remainingPlot.season = moonmage.lastSeason
            remainingPlot.creationHash = event.transaction.hash.toHexString()
            remainingPlot.createdAt = event.block.timestamp
            remainingPlot.updatedAt = event.block.timestamp
            remainingPlot.index = remainingIndex
            remainingPlot.moons = ZERO_BI
            remainingPlot.pods = remainingPods
            remainingPlot.temperature = plot.temperature
            remainingPlot.save()

            plot.harvestedPods = harvestablePods
            plot.pods = harvestablePods
            plot.fullyHarvested = true
            plot.save()
        }
    }

    // Remove the harvested plot IDs from the field list
    let field = loadField(event.address)
    let newIndexes = field.plotIndexes
    for (let i = 0; i < event.params.plots.length; i++) {
        let plotIndex = newIndexes.indexOf(event.params.plots[i])
        newIndexes.splice(plotIndex, 1)
        newIndexes.sort()
    }
    if (remainingIndex !== ZERO_BI) { newIndexes.push(remainingIndex) }
    field.plotIndexes = newIndexes
    field.save()

    // Save the low level details for the event.
    let harvest = new HarvestEntity('harvest-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString())
    harvest.hash = event.transaction.hash.toHexString()
    harvest.logIndex = event.transactionLogIndex.toI32()
    harvest.protocol = event.address.toHexString()
    harvest.cosmomage = event.params.account.toHexString()
    harvest.plots = event.params.plots
    harvest.moons = event.params.moons
    harvest.blockNumber = event.block.number
    harvest.createdAt = event.block.timestamp
    harvest.save()
}

export function handlePlotTransfer(event: PlotTransfer): void {
    let moonmage = loadMoonmage(MOONMAGE)
    let season = loadSeason(event.address, BigInt.fromI32(moonmage.lastSeason))

    // Ensure both cosmomage entites exist
    let fromCosmonaut = loadCosmonaut(event.params.from)
    let toCosmonaut = loadCosmonaut(event.params.to)

    // Update cosmomage field data
    updateFieldTotals(event.params.from, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI.minus(event.params.pods), ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)
    updateFieldTotals(event.params.to, moonmage.lastSeason, ZERO_BI, ZERO_BI, ZERO_BI, event.params.pods, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

    let field = loadField(MOONMAGE)
    let sortedPlots = field.plotIndexes.sort()

    let sourceIndex = ZERO_BI

    for (let i = 0; i < sortedPlots.length; i++) {
        // Handle only single comparison for first value of array
        if (i == 0) {
            if (sortedPlots[i] == event.params.id) {
                sourceIndex = sortedPlots[i]
                break
            } else { continue }
        }
        // Transferred plot matches existing. Start value of zero.
        if (sortedPlots[i] == event.params.id) {
            sourceIndex = sortedPlots[i]
            break
        }
        // Transferred plot is in the middle of existing plot. Non-zero start value.
        if (sortedPlots[i - 1] < event.params.id && event.params.id < sortedPlots[i]) {
            sourceIndex = sortedPlots[i - 1]
        }
    }

    let sourcePlot = loadPlot(event.address, sourceIndex)
    let sourceEndIndex = sourceIndex.plus(sourcePlot.pods)
    let transferEndIndex = event.params.id.plus(event.params.pods)

    log.debug("\nPodTransfer: ===================\n", [])
    log.debug("\nPodTransfer: Transfer Season - {}\n", [field.season.toString()])
    log.debug("\nPodTransfer: Transfer Index - {}\n", [event.params.id.toString()])
    log.debug("\nPodTransfer: Transfer Pods - {}\n", [event.params.pods.toString()])
    log.debug("\nPodTransfer: Transfer Ending Index - {}\n", [event.params.id.plus(event.params.pods).toString()])
    log.debug("\nPodTransfer: Source Index - {}\n", [sourceIndex.toString()])
    log.debug("\nPodTransfer: Source Ending Index - {}\n", [sourceIndex.plus(sourcePlot.pods).toString()])
    log.debug("\nPodTransfer: Starting Source Pods - {}\n", [sourcePlot.pods.toString()])

    // Actually transfer the plots
    if (sourcePlot.pods == event.params.pods) {
        // Sending full plot
        sourcePlot.cosmomage = event.params.to.toHexString()
        sourcePlot.updatedAt = event.block.timestamp
        sourcePlot.save()
        log.debug("\nPodTransfer: Sending full plot\n", [])
    } else if (sourceIndex == event.params.id) {
        // We are only needing to split this plot once to send
        // Start value of zero
        let remainderIndex = sourceIndex.plus(event.params.pods)
        let remainderPlot = loadPlot(event.address, remainderIndex)
        sortedPlots.push(remainderIndex)

        sourcePlot.cosmomage = event.params.to.toHexString()
        sourcePlot.updatedAt = event.block.timestamp
        sourcePlot.pods = event.params.pods
        sourcePlot.save()

        remainderPlot.cosmomage = event.params.from.toHexString()
        remainderPlot.source = 'TRANSFER'
        remainderPlot.season = field.season
        remainderPlot.creationHash = event.transaction.hash.toHexString()
        remainderPlot.createdAt = event.block.timestamp
        remainderPlot.updatedAt = event.block.timestamp
        remainderPlot.index = remainderIndex
        remainderPlot.pods = sourceEndIndex.minus(transferEndIndex)
        remainderPlot.temperature = sourcePlot.temperature
        remainderPlot.save()

        log.debug("\nPodTransfer: sourceIndex == transferIndex\n", [])
        log.debug("\nPodTransfer: Remainder Index - {}\n", [remainderIndex.toString()])
        log.debug("\nPodTransfer: Source Pods - {}\n", [sourcePlot.pods.toString()])
        log.debug("\nPodTransfer: Remainder Pods - {}\n", [remainderPlot.pods.toString()])
    } else if (sourceEndIndex == transferEndIndex) {
        // We are only needing to split this plot once to send
        // Non-zero start value. Sending to end of plot
        let toPlot = loadPlot(event.address, event.params.id)
        sortedPlots.push(event.params.id)

        sourcePlot.updatedAt = event.block.timestamp
        sourcePlot.pods = sourcePlot.pods.minus(event.params.pods)
        sourcePlot.save()

        toPlot.cosmomage = event.params.to.toHexString()
        toPlot.source = 'TRANSFER'
        toPlot.season = field.season
        toPlot.creationHash = event.transaction.hash.toHexString()
        toPlot.createdAt = event.block.timestamp
        toPlot.updatedAt = event.block.timestamp
        toPlot.index = event.params.id
        toPlot.pods = event.params.pods
        toPlot.temperature = sourcePlot.temperature
        toPlot.save()

        log.debug("\nPodTransfer: sourceEndIndex == transferEndIndex\n", [])
        log.debug("\nPodTransfer: Updated Source Pods - {}\n", [sourcePlot.pods.toString()])

    } else {
        // We have to split this plot twice to send
        let remainderIndex = event.params.id.plus(event.params.pods)
        let toPlot = loadPlot(event.address, event.params.id)
        let remainderPlot = loadPlot(event.address, remainderIndex)

        sortedPlots.push(event.params.id)
        sortedPlots.push(remainderIndex)

        sourcePlot.updatedAt = event.block.timestamp
        sourcePlot.pods = event.params.id.minus(sourcePlot.index)
        sourcePlot.save()

        toPlot.cosmomage = event.params.to.toHexString()
        toPlot.source = 'TRANSFER'
        toPlot.season = field.season
        toPlot.creationHash = event.transaction.hash.toHexString()
        toPlot.createdAt = event.block.timestamp
        toPlot.updatedAt = event.block.timestamp
        toPlot.index = event.params.id
        toPlot.pods = event.params.pods
        toPlot.temperature = sourcePlot.temperature
        toPlot.save()

        remainderPlot.cosmomage = event.params.from.toHexString()
        remainderPlot.source = 'TRANSFER'
        remainderPlot.season = field.season
        remainderPlot.creationHash = event.transaction.hash.toHexString()
        remainderPlot.createdAt = event.block.timestamp
        remainderPlot.updatedAt = event.block.timestamp
        remainderPlot.index = remainderIndex
        remainderPlot.pods = sourceEndIndex.minus(transferEndIndex)
        remainderPlot.temperature = sourcePlot.temperature
        remainderPlot.save()

        log.debug("\nPodTransfer: split source twice\n", [])
        log.debug("\nPodTransfer: Updated Source Pods - {}\n", [sourcePlot.pods.toString()])
        log.debug("\nPodTransfer: Transferred Pods - {}\n", [toPlot.pods.toString()])
        log.debug("\nPodTransfer: Remainder Pods - {}\n", [remainderPlot.pods.toString()])

    }
    sortedPlots.sort()
    field.plotIndexes = sortedPlots
    field.save()

    // Update any harvestable pod amounts
    updateHarvestablePlots(season.harvestableIndex, event.block.timestamp, event.block.number)

    // Save the raw event data
    savePodTransfer(event)
}

export function handleSupplyIncrease(event: SupplyIncrease): void {

    updateFieldTotals(event.address, event.params.season.toI32(), event.params.newSoil, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

}

export function handleSupplyDecrease(event: SupplyDecrease): void {

    updateFieldTotals(event.address, event.params.season.toI32(), event.params.newSoil, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

}

export function handleSupplyNeutral(event: SupplyNeutral): void {

    updateFieldTotals(event.address, event.params.season.toI32(), event.params.newSoil, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

}

export function handleFundFundraiser(event: FundFundraiser): void {
    // Account for the fact thta fundraiser sow using no soil.
    let moonmage = loadMoonmage(event.address)
    updateFieldTotals(event.address, moonmage.lastSeason, ZERO_BI, ZERO_BI.minus(event.params.amount), ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp, event.block.number)

}

function updateFieldTotals(
    account: Address,
    season: i32,
    soil: BigInt,
    sownMoons: BigInt,
    sownPods: BigInt,
    transferredPods: BigInt,
    harvestablePods: BigInt,
    harvestedPods: BigInt,
    timestamp: BigInt,
    blockNumber: BigInt
): void {
    let field = loadField(account)
    let fieldHourly = loadFieldHourly(account, season, timestamp)
    let fieldDaily = loadFieldDaily(account, timestamp)

    field.season = season
    field.soil = field.soil.plus(soil).minus(sownMoons)
    field.sownMoons = field.sownMoons.plus(sownMoons)
    field.unharvestablePods = field.unharvestablePods.plus(sownPods).minus(harvestablePods).plus(transferredPods)
    field.harvestablePods = field.harvestablePods.plus(harvestablePods).minus(harvestedPods)
    field.harvestedPods = field.harvestedPods.plus(harvestedPods)
    field.podIndex = field.podIndex.plus(sownPods)
    field.save()

    fieldHourly.soil = field.soil
    fieldHourly.sownMoons = field.sownMoons
    fieldHourly.unharvestablePods = field.unharvestablePods
    fieldHourly.harvestablePods = field.harvestablePods
    fieldHourly.harvestedPods = field.harvestedPods
    fieldHourly.podIndex = field.podIndex
    fieldHourly.issuedSoil = fieldHourly.issuedSoil.plus(soil)
    fieldHourly.deltaSownMoons = fieldHourly.deltaSownMoons.plus(sownMoons)
    fieldHourly.deltaUnharvestablePods = fieldHourly.deltaUnharvestablePods.plus(sownPods).minus(harvestablePods).plus(transferredPods)
    fieldHourly.deltaHarvestablePods = fieldHourly.deltaHarvestablePods.plus(harvestablePods).minus(harvestedPods)
    fieldHourly.deltaHarvestedPods = fieldHourly.deltaHarvestedPods.plus(harvestedPods)
    fieldHourly.blockNumber = fieldHourly.blockNumber == ZERO_BI ? blockNumber : fieldHourly.blockNumber
    fieldHourly.updatedAt = timestamp
    if (field.soil == ZERO_BI) {
        fieldHourly.blocksToSoldOutSoil = blockNumber.minus(fieldHourly.blockNumber)
        fieldHourly.soilSoldOut = true
    }
    fieldHourly.save()

    fieldDaily.soil = field.soil
    fieldDaily.sownMoons = field.sownMoons
    fieldDaily.unharvestablePods = field.unharvestablePods
    fieldDaily.harvestablePods = field.harvestablePods
    fieldDaily.harvestedPods = field.harvestedPods
    fieldDaily.podIndex = field.podIndex
    fieldDaily.issuedSoil = fieldDaily.issuedSoil.plus(soil)
    fieldDaily.deltaSownMoons = fieldDaily.deltaSownMoons.plus(sownMoons)
    fieldDaily.deltaUnharvestablePods = fieldDaily.deltaUnharvestablePods.plus(sownPods).minus(harvestablePods).plus(transferredPods)
    fieldDaily.deltaHarvestablePods = fieldDaily.deltaHarvestablePods.plus(harvestablePods).minus(harvestedPods)
    fieldDaily.deltaHarvestedPods = fieldDaily.deltaHarvestedPods.plus(harvestedPods)
    fieldDaily.updatedAt = timestamp
    fieldDaily.save()
}

export function updateHarvestablePlots(harvestableIndex: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let field = loadField(MOONMAGE)
    let sortedIndexes = field.plotIndexes.sort()

    for (let i = 0; i < sortedIndexes.length; i++) {
        if (sortedIndexes[i] > harvestableIndex) { break }
        let plot = loadPlot(MOONMAGE, sortedIndexes[i])

        // Plot is fully harvestable, but hasn't been harvested yet
        if (plot.harvestablePods == plot.pods) { continue }

        let harvestablePods = harvestableIndex.minus(plot.index)
        let oldHarvestablePods = plot.harvestablePods
        plot.harvestablePods = harvestablePods >= plot.pods ? plot.pods : harvestablePods
        plot.save()

        let deltaHarvestablePods = oldHarvestablePods == ZERO_BI ? plot.harvestablePods : plot.harvestablePods.minus(oldHarvestablePods)

        updateFieldTotals(MOONMAGE, field.season, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, deltaHarvestablePods, ZERO_BI, timestamp, blockNumber)
        updateFieldTotals(Address.fromString(plot.cosmomage), field.season, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, deltaHarvestablePods, ZERO_BI, timestamp, blockNumber)
    }
}

function incrementSowers(
    account: Address,
    season: i32,
    timestamp: BigInt
): void {
    // Increment total number of sowers by one
    let field = loadField(account)
    let fieldHourly = loadFieldHourly(account, season, timestamp)
    let fieldDaily = loadFieldDaily(account, timestamp)

    field.numberOfSowers += 1
    field.save()

    fieldHourly.numberOfSowers = field.numberOfSowers
    fieldHourly.deltaNumberOfSowers += 1
    fieldHourly.save()

    fieldDaily.numberOfSowers = field.numberOfSowers
    fieldDaily.deltaNumberOfSowers += 1
    fieldDaily.save()
}

function incrementSows(
    account: Address,
    season: i32,
    timestamp: BigInt
): void {
    // Increment total sows by one
    let field = loadField(account)
    let fieldHourly = loadFieldHourly(account, season, timestamp)
    let fieldDaily = loadFieldDaily(account, timestamp)

    // Add to protocol numberOfSowers if needed
    if (
        account != MOONMAGE
        && field.numberOfSows == 0
    ) incrementSowers(MOONMAGE, season, timestamp)

    // Update sower counts
    field.numberOfSows += 1
    field.save()

    fieldHourly.numberOfSows = field.numberOfSows
    fieldHourly.deltaNumberOfSows += 1
    fieldHourly.save()

    fieldDaily.numberOfSows = field.numberOfSows
    fieldDaily.deltaNumberOfSows += 1
    fieldDaily.save()
}
