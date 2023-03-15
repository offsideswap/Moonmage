/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./ERC20/MoonmageERC20.sol";

/**
 * @author Publius
 * @title Unripe Moon is the unripe token for the Moon token.
**/
contract UnripeMoon is MoonmageERC20  {

    constructor()
    MoonmageERC20(msg.sender, "Unripe Moon", "urMOON")
    { }
}
