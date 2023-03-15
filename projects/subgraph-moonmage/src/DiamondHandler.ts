import { DiamondCut } from "../generated/Diamond/Moonmage";
import { Moonmage } from "../generated/schema";
import { loadMoonmage } from "./utils/Moonmage";
import { ZERO_BI } from "./utils/Decimals";

export function handleDiamondCut(event: DiamondCut): void {
    let moonmage = loadMoonmage(event.address)

    moonmage.lastUpgrade = event.block.timestamp
    moonmage.save()
}
