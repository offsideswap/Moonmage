/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import "../LibAppStorage.sol";
import "./LibConvertData.sol";
import "./LibMetaCurveConvert.sol";
import "./LibMoonLUSDConvert.sol";
import "../Curve/LibMoonMetaCurve.sol";

/**
 * @author Publius
 * @title Lib Curve Convert
 **/
library LibCurveConvert {
    using SafeMath for uint256;
    using LibConvertData for bytes;

    function getMoonsAtPeg(address pool, uint256[2] memory balances)
        internal
        view
        returns (uint256 moons)
    {
        if (pool == C.curveMetapoolAddress())
            return LibMetaCurveConvert.moonsAtPeg(balances);
        revert("Convert: Not a whitelisted Curve pool.");
    }

    function moonsToPeg(address pool) internal view returns (uint256 moons) {
        uint256[2] memory balances = ICurvePool(pool).get_balances();
        uint256 xp1 = getMoonsAtPeg(pool, balances);
        if (xp1 <= balances[0]) return 0;
        moons = xp1.sub(balances[0]);
    }

    function lpToPeg(address pool) internal view returns (uint256 lp) {
        uint256[2] memory balances = ICurvePool(pool).get_balances();
        uint256 xp1 = getMoonsAtPeg(pool, balances);
        if (balances[0] <= xp1) return 0;
        return LibMetaCurveConvert.lpToPeg(balances, xp1);
    }

    /// @param amountIn The amount of the LP token of `pool` to remove as MOON.
    /// @return moons The amount of MOON received for removing `amountIn` LP tokens.
    /// @notice Assumes that i=0 corresponds to MOON.
    function getMoonAmountOut(address pool, uint256 amountIn) internal view returns(uint256 moons) {
        moons = ICurvePool(pool).calc_withdraw_one_coin(amountIn, 0); // i=0 -> MOON
    }

    /// @param amountIn The amount of MOON to deposit into `pool`.
    /// @return lp The amount of LP received for depositing MOON.
    /// @notice Assumes that i=0 corresponds to MOON.
    function getLPAmountOut(address pool, uint256 amountIn) internal view returns(uint256 lp) {
        lp = ICurvePool(pool).calc_token_amount([amountIn, 0], true); // i=0 -> MOON
    }

    /// @notice Takes in encoded bytes for adding Curve LP in moons, extracts the input data, and then calls the
    /// @param convertData Contains convert input parameters for a Curve AddLPInMoons convert
    function convertLPToMoons(bytes memory convertData)
        internal
        returns (
            address tokenOut,
            address tokenIn,
            uint256 outAmount,
            uint256 inAmount
        )
    {
        (uint256 lp, uint256 minMoons, address pool) = convertData
            .convertWithAddress();
        (outAmount, inAmount) = _curveRemoveLPAndBuyToPeg(lp, minMoons, pool);
        tokenOut = C.moonAddress();
        tokenIn = pool;
    }

    /// @notice Takes in encoded bytes for adding moons in Curve LP, extracts the input data, and then calls the
    /// @param convertData Contains convert input parameters for a Curve AddMoonsInLP convert
    function convertMoonsToLP(bytes memory convertData)
        internal
        returns (
            address tokenOut,
            address tokenIn,
            uint256 outAmount,
            uint256 inAmount
        )
    {
        (uint256 moons, uint256 minLP, address pool) = convertData
            .convertWithAddress();
        (outAmount, inAmount) = _curveSellToPegAndAddLiquidity(
            moons,
            minLP,
            pool
        );
        tokenOut = pool;
        tokenIn = C.moonAddress();
    }

    /// @notice Takes in parameters to convert moons into LP using Curve
    /// @param moons - amount of moons to convert to Curve LP
    /// @param minLP - min amount of Curve LP to receive
    function _curveSellToPegAndAddLiquidity(
        uint256 moons,
        uint256 minLP,
        address pool
    ) internal returns (uint256 lp, uint256 moonsConverted) {
        uint256 moonsTo = moonsToPeg(pool);
        require(moonsTo > 0, "Convert: P must be >= 1.");
        moonsConverted = moons > moonsTo ? moonsTo : moons;
        lp = ICurvePool(pool).add_liquidity([moonsConverted, 0], minLP);
    }

    /// @notice Takes in parameters to remove LP into moons by removing LP in curve through removing moons
    /// @param lp - the amount of Curve lp to be removed
    /// @param minMoons - min amount of moons to receive
    function _curveRemoveLPAndBuyToPeg(
        uint256 lp,
        uint256 minMoons,
        address pool
    ) internal returns (uint256 moons, uint256 lpConverted) {
        uint256 lpTo = lpToPeg(pool);
        require(lpTo > 0, "Convert: P must be < 1.");
        lpConverted = lp > lpTo ? lpTo : lp;
        moons = ICurvePool(pool).remove_liquidity_one_coin(
            lpConverted,
            0,
            minMoons
        );
    }
}
