/*
 * SPDX-License-Identifier: MIT
 */

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "../../C.sol";
import "../../libraries/Curve/LibMoonMetaCurve.sol";
import "../../libraries/LibUnripe.sol";

/*
 * @author Publius
 * @title BDVFacet holds the Curve MetaPool BDV function.
 */
contract BDVFacet {
    using SafeMath for uint256;

    function curveToBDV(uint256 amount) public view returns (uint256) {
        return LibMoonMetaCurve.bdv(amount);
    }

    function moonToBDV(uint256 amount) public pure returns (uint256) {
        return amount;
    }

    function unripeLPToBDV(uint256 amount) public view returns (uint256) {
        amount = LibUnripe.unripeToUnderlying(C.unripeLPAddress(), amount);
        amount = LibMoonMetaCurve.bdv(amount);
        return amount;
    }

    function unripeMoonToBDV(uint256 amount) public view returns (uint256) {
        return LibUnripe.unripeToUnderlying(C.unripeMoonAddress(), amount);
    }

    function bdv(address token, uint256 amount)
        external
        view
        returns (uint256)
    {
        if (token == C.moonAddress()) return moonToBDV(amount);
        else if (token == C.curveMetapoolAddress()) return curveToBDV(amount);
        else if (token == C.unripeMoonAddress()) return unripeMoonToBDV(amount);
        else if (token == C.unripeLPAddress()) return unripeLPToBDV(amount);
        revert("BDV: Token not whitelisted");
    }
}
