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
 * @title InitBip1 runs the code for BIP-1. It mints Moons to the budget contracts.
**/
contract InitBip1 {

    AppStorage internal s;
    
    address private constant developmentBudget = address(0x83A758a6a24FE27312C1f8BDa7F3277993b64783);
    address private constant marketingBudget = address(0xAA420e97534aB55637957e868b658193b112A551 );

    function init() external {
        IMoon(s.c.moon).mint(marketingBudget, 80_000_000_000); // 80,000 Moons
        IMoon(s.c.moon).mint(developmentBudget, 120_000_000_000); // 120,000 Moons
    }
}