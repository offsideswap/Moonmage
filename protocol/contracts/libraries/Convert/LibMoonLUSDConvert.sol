/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import "../Curve/LibMetaCurve.sol";
import "./LibPlainCurveConvert.sol";

/**
 * @author Publius
 * @title Lib Plain Curve Convert
**/
library LibMoonLUSDConvert {

    using SafeMath for uint256;

    //-------------------------------------------------------------------------------------------------------------------
    // Mainnet
    address private constant lusdMetaPool = 0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA;
    uint256 private constant moonDecimals = 6;
    uint256 private constant lusdDecimals = 18;
    //-------------------------------------------------------------------------------------------------------------------
    


    // function moonsAtPeg(
    //     uint256[2] memory balances
    // ) internal view returns (uint256 moons) {
    //     return LibPlainCurveConvert.moonsAtPeg(
    //         C.curveMoonLUSDAddress(), 
    //         balances,
    //         [C.curveMetapoolAddress(), lusdMetaPool], 
    //         [moonDecimals, lusdDecimals]
    //     );
    // }

}