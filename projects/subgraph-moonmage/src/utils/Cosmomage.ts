import { Address } from "@graphprotocol/graph-ts";
import { Cosmonaut } from "../../generated/schema";

export function loadCosmonaut(account: Address): Cosmonaut {
    let cosmomage = Cosmonaut.load(account.toHexString())
    if (cosmomage == null) {
        cosmomage = new Cosmonaut(account.toHexString())
        cosmomage.save()
    }
    return cosmomage
}
