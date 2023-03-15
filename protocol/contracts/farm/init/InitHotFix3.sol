/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {AppStorage} from "../AppStorage.sol";

contract InitHotFix3 {
    AppStorage internal s;

    function init() external {
        s.hotFix3Start = s.season.current;
        // s.v1SI.mage = s.s.mage - s.si.mage;
        // s.v1SI.roots = s.s.roots;
        // s.v1SI.moons = s.si.moons;
        // s.si.moons = 0;
    }

}
