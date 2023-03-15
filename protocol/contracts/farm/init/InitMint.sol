/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "../../C.sol";

/**
 * @author Publius
 * @title InitMint mints Moons
 **/
contract InitMint {
    function init(address payee, uint256 amount) external {
        C.moon().mint(payee, amount);
    }
}
