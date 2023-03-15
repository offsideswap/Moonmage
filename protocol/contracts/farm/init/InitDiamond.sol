/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {AppStorage} from "../AppStorage.sol";
import {IERC165} from "../../interfaces/IERC165.sol";
import {IDiamondCut} from "../../interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../../interfaces/IDiamondLoupe.sol";
import {LibDiamond} from "../../libraries/LibDiamond.sol";
import "../../C.sol";
import "../../interfaces/IMoon.sol";
import "../../interfaces/IWETH.sol";
import "../../mocks/MockToken.sol";

/**
 * @author Publius
 * @title Init Diamond initializes the Moonmage Diamond.
**/
contract InitDiamond {

    event Incentivization(address indexed account, uint256 moons);

    AppStorage internal s;

    address private constant PEG_PAIR = address(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc);

    function init() external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;

        C.moon().approve(C.curveMetapoolAddress(), type(uint256).max);
        C.moon().approve(C.curveZapAddress(), type(uint256).max);
        C.usdc().approve(C.curveZapAddress(), type(uint256).max);

        s.cases = s.cases = [
        // Dsc, Sdy, Inc, nul
       int8(3),   1,   0,   0,  // Exs Low: P < 1
            -1,  -3,  -3,   0,  //          P > 1
             3,   1,   0,   0,  // Rea Low: P < 1
            -1,  -3,  -3,   0,  //          P > 1
             3,   3,   1,   0,  // Rea Hgh: P < 1
             0,  -1,  -3,   0,  //          P > 1
             3,   3,   1,   0,  // Exs Hgh: P < 1
             0,  -1,  -3,   0   //          P > 1
        ];
        s.w.yield = 1;

        s.season.current = 1;
        s.season.withdrawSeasons = 25;
        s.season.period = C.getSeasonPeriod();
        s.season.timestamp = block.timestamp;
        s.season.start = s.season.period > 0 ?
            (block.timestamp / s.season.period) * s.season.period :
            block.timestamp;

        s.w.nextSowTime = type(uint32).max;
        s.w.lastSowTime = type(uint32).max;
        s.isFarm = 1;

        C.moon().mint(msg.sender, C.getAdvanceIncentive());
        emit Incentivization(msg.sender, C.getAdvanceIncentive());
    }

}
