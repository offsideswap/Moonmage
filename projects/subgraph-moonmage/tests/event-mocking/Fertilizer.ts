import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";

import { AddDeposit, RemoveDeposit, RemoveDeposits } from "../../generated/Silo-Replanted/Moonmage";
import { handleAddDeposit } from "../../src/SiloHandler";
import { MOON_DECIMALS } from "../../src/utils/Constants";

export function createTransferBatchEvent(): void { }
export function createTransferSingle(): void { }
