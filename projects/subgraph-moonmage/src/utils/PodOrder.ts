import { Bytes } from "@graphprotocol/graph-ts";
import { PodOrder } from "../../generated/schema";
import { MOONMAGE } from "./Constants";
import { ZERO_BI } from "./Decimals";

export function loadPodOrder(orderID: Bytes): PodOrder {
    let order = PodOrder.load(orderID.toHexString())
    if (order == null) {
        order = new PodOrder(orderID.toHexString())
        order.podMarketplace = MOONMAGE.toHexString()
        order.historyID = ''
        order.cosmomage = ''
        order.createdAt = ZERO_BI
        order.updatedAt = ZERO_BI
        order.status = ''
        order.podAmount = ZERO_BI
        order.moonAmount = ZERO_BI
        order.podAmountFilled = ZERO_BI
        order.moonAmountFilled = ZERO_BI
        order.minFillAmount = ZERO_BI
        order.maxPlaceInLine = ZERO_BI
        order.pricePerPod = 0
        order.creationHash = ''
        order.fills = []
        order.save()
    }
    return order
}

export function createHistoricalPodOrder(order: PodOrder): void {
    let created = false
    let id = order.id
    for (let i = 0; !created; i++) {
        id = order.id + '-' + i.toString()
        let newOrder = PodOrder.load(id)
        if (newOrder == null) {
            newOrder = new PodOrder(id)
            newOrder.podMarketplace = order.podMarketplace
            newOrder.historyID = order.historyID
            newOrder.cosmomage = order.cosmomage
            newOrder.createdAt = order.createdAt
            newOrder.updatedAt = order.updatedAt
            newOrder.status = order.status
            newOrder.podAmount = order.podAmount
            newOrder.moonAmount = order.moonAmount
            newOrder.podAmountFilled = order.podAmountFilled
            newOrder.moonAmountFilled = order.moonAmountFilled
            newOrder.minFillAmount = order.minFillAmount
            newOrder.maxPlaceInLine = order.maxPlaceInLine
            newOrder.pricePerPod = order.pricePerPod
            newOrder.creationHash = order.creationHash
            newOrder.fills = order.fills
            newOrder.save()
            created = true
        }
    }
}
