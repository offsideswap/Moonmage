/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./LibCurveConvert.sol";
import "../../C.sol";
import "../../interfaces/IMoon.sol";
import "../LibUnripe.sol";

/**
 * @author Publius
 * @title LibUnripeConvert
 **/
library LibUnripeConvert {
    using LibConvertData for bytes;
    using SafeMath for uint256;

    function convertLPToMoons(bytes memory convertData)
        internal
        returns (
            address tokenOut,
            address tokenIn,
            uint256 outAmount,
            uint256 inAmount
        )
    {
        tokenOut = C.unripeMoonAddress();
        tokenIn = C.unripeLPAddress();
        (uint256 lp, uint256 minMoons) = convertData.basicConvert();

        uint256 minAmountOut = LibUnripe
            .unripeToUnderlying(tokenOut, minMoons)
            .mul(LibUnripe.percentLPRecapped())
            .div(LibUnripe.percentMoonsRecapped());

        (
            uint256 outUnderlyingAmount,
            uint256 inUnderlyingAmount
        ) = LibCurveConvert._curveRemoveLPAndBuyToPeg(
                LibUnripe.unripeToUnderlying(tokenIn, lp),
                minAmountOut,
                C.curveMetapoolAddress()
            );

        inAmount = LibUnripe.underlyingToUnripe(tokenIn, inUnderlyingAmount);
        LibUnripe.removeUnderlying(tokenIn, inUnderlyingAmount);
        IMoon(tokenIn).burn(inAmount);

        outAmount = LibUnripe
            .underlyingToUnripe(tokenOut, outUnderlyingAmount)
            .mul(LibUnripe.percentMoonsRecapped())
            .div(LibUnripe.percentLPRecapped());
        LibUnripe.addUnderlying(tokenOut, outUnderlyingAmount);
        IMoon(tokenOut).mint(address(this), outAmount);
    }

    function convertMoonsToLP(bytes memory convertData)
        internal
        returns (
            address tokenOut,
            address tokenIn,
            uint256 outAmount,
            uint256 inAmount
        )
    {
        tokenIn = C.unripeMoonAddress();
        tokenOut = C.unripeLPAddress();
        (uint256 moons, uint256 minLP) = convertData.basicConvert();

        uint256 minAmountOut = LibUnripe
            .unripeToUnderlying(tokenOut, minLP)
            .mul(LibUnripe.percentMoonsRecapped())
            .div(LibUnripe.percentLPRecapped());

        (
            uint256 outUnderlyingAmount,
            uint256 inUnderlyingAmount
        ) = LibCurveConvert._curveSellToPegAndAddLiquidity(
                LibUnripe.unripeToUnderlying(tokenIn, moons),
                minAmountOut,
                C.curveMetapoolAddress()
            );

        inAmount = LibUnripe.underlyingToUnripe(tokenIn, inUnderlyingAmount);
        LibUnripe.removeUnderlying(tokenIn, inUnderlyingAmount);
        IMoon(tokenIn).burn(inAmount);

        outAmount = LibUnripe
            .underlyingToUnripe(tokenOut, outUnderlyingAmount)
            .mul(LibUnripe.percentLPRecapped())
            .div(LibUnripe.percentMoonsRecapped());
        LibUnripe.addUnderlying(tokenOut, outUnderlyingAmount);
        IMoon(tokenOut).mint(address(this), outAmount);
    }

    function moonsToPeg() internal view returns (uint256 moons) {
        uint256 underlyingMoons = LibCurveConvert.moonsToPeg(
            C.curveMetapoolAddress()
        );
        moons = LibUnripe.underlyingToUnripe(
            C.unripeMoonAddress(),
            underlyingMoons
        );
    }

    function lpToPeg() internal view returns (uint256 lp) {
        uint256 underlyingLP = LibCurveConvert.lpToPeg(
            C.curveMetapoolAddress()
        );
        lp = LibUnripe.underlyingToUnripe(C.unripeLPAddress(), underlyingLP);
    }

    function getLPAmountOut(uint256 amountIn)
        internal
        view
        returns (uint256 lp)
    {
        uint256 moons = LibUnripe.unripeToUnderlying(
            C.unripeMoonAddress(),
            amountIn
        );
        lp = LibCurveConvert.getLPAmountOut(C.curveMetapoolAddress(), moons);
        lp = LibUnripe
            .underlyingToUnripe(C.unripeLPAddress(), lp)
            .mul(LibUnripe.percentLPRecapped())
            .div(LibUnripe.percentMoonsRecapped());
    }

    function getMoonAmountOut(uint256 amountIn)
        internal
        view
        returns (uint256 moon)
    {
        uint256 lp = LibUnripe.unripeToUnderlying(
            C.unripeLPAddress(),
            amountIn
        );
        moon = LibCurveConvert.getMoonAmountOut(C.curveMetapoolAddress(), lp);
        moon = LibUnripe
            .underlyingToUnripe(C.unripeMoonAddress(), moon)
            .mul(LibUnripe.percentMoonsRecapped())
            .div(LibUnripe.percentLPRecapped());
    }
}
