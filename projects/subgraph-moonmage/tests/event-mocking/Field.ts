import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { Sow } from "../../generated/Field/Moonmage";

import { AddDeposit, RemoveDeposit, RemoveDeposits } from "../../generated/Silo-Replanted/Moonmage";
import { handleAddDeposit } from "../../src/SiloHandler";
import { MOON_DECIMALS } from "../../src/utils/Constants";

export function createWeatherChangeEvent(season: BigInt, caseID: BigInt, change: i32): void { }
export function createSowEvent(account: string, index: BigInt, moons: BigInt, pods: BigInt): Sow {
    let event = changetype<Sow>(newMockEvent())
    event.parameters = new Array()

    let param1 = new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.fromString(account)))
    let param2 = new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
    let param3 = new ethereum.EventParam("moons", ethereum.Value.fromUnsignedBigInt(moons))
    let param4 = new ethereum.EventParam("pods", ethereum.Value.fromUnsignedBigInt(pods))

    event.parameters.push(param1)
    event.parameters.push(param2)
    event.parameters.push(param3)
    event.parameters.push(param4)

    return event as Sow
}
export function createHarvestEvent(account: string, plots: BigInt[], moons: BigInt): void { }
export function createPlotTransferEvent(from: string, to: string, id: BigInt, pods: BigInt): void { }
export function createSupplyIncreaseEvent(season: BigInt, price: BigInt, newHarvestable: BigInt, newSilo: BigInt, issuedSoil: i32): void { }
export function createSupplyDecreaseEvent(season: BigInt, price: BigInt, issuedSoil: i32): void { }
export function createSupplyNeutralEvent(season: BigInt, issuedSoil: i32): void { }
export function createFundFundraiserEvent(id: BigInt, fundraiser: string, token: string, amount: BigInt): void { }
