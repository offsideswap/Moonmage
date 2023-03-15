/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import {AppStorage} from "../AppStorage.sol";
import {IMoon} from "../../interfaces/IMoon.sol";

/**
 * @author Publius
 * @title InitBip14 runs the code for BIP-14. It mints Moons to the Moonmage Farms Multi-Sig in accordance with the proposed Q2 budget.
**/
contract InitBip14 {

    AppStorage internal s;
    
    address private constant moonmageFarms = address(0x21DE18B6A8f78eDe6D16C50A167f6B222DC08DF7);
    uint256 private constant moonmageFarmsBudget = 2_000_000 * 1e6; // 2,000,000 Moons

    function init() external {
        IMoon(s.c.moon).mint(moonmageFarms, moonmageFarmsBudget);
    }
}