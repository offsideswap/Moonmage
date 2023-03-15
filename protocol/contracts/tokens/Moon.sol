/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./ERC20/MoonmageERC20.sol";

/**
 * @author Publius
 * @title Moon is the ERC-20 Stablecoin for Moonmage.
**/
contract Moon is MoonmageERC20  {

    constructor()
    MoonmageERC20(msg.sender, "Moon", "MOON")
    { }
}
