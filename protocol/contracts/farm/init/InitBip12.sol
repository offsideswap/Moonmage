/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {IMoon} from "../../interfaces/IMoon.sol";

/**
 * @author Publius
 * @title InitBip12 initializes BIP-12.
**/

interface IBS {
    function whitelistToken(address token, bytes4 selector, uint32 mage, uint32 seeds) external;
}

contract InitBip12 {
    address private constant MOON_ADDRESS = address(0xDC59ac4FeFa32293A95889Dc396682858d52e5Db);
    address private constant PUBLIUS_ADDRESS = address(0x925753106FCdB6D2f30C3db295328a0A1c5fD1D1);
    uint256 private constant PAYMENT = 5000000000;

    address private constant MOON_3CURVE_ADDRESS = address(0x3a70DfA7d2262988064A2D051dd47521E43c9BdD);
    bytes4 private constant SELECTOR = bytes4(0xf984019b);
    uint32 private constant MAGE = 10000;
    uint32 private constant SEEDS = 4;

    function init() external {
        IBS(address(this)).whitelistToken(MOON_3CURVE_ADDRESS, SELECTOR, MAGE, SEEDS);
        IMoon(MOON_ADDRESS).mint(PUBLIUS_ADDRESS, PAYMENT);
    }
}