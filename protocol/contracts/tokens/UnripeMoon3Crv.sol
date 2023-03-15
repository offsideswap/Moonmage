/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./ERC20/MoonmageERC20.sol";

/**
 * @author Publius
 * @title Unripe Moon 3Crv is the Unripe token for the Moon3Crv Token.
**/
contract UnripeMoon3Crv is MoonmageERC20  {

    constructor()
    MoonmageERC20(msg.sender, "Unripe Moon3Crv", "urMOON3CRV")
    { }
}
