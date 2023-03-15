/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./LibUnripeConvert.sol";
import "./LibLambdaConvert.sol";

/**
 * @author Publius
 * @title Lib Convert
 **/
library LibConvert {
    using SafeMath for uint256;
    using LibConvertData for bytes;

    /// @notice Takes in bytes object that has convert input data encoded into it for a particular convert for
    ///         a specified pool and returns the in and out convert amounts and token addresses and bdv
    /// @param convertData Contains convert input parameters for a specified convert
    function convert(bytes calldata convertData)
        internal
        returns (
            address tokenOut,
            address tokenIn,
            uint256 outAmount,
            uint256 inAmount
        )
    {
        LibConvertData.ConvertKind kind = convertData.convertKind();

        if (kind == LibConvertData.ConvertKind.MOONS_TO_CURVE_LP) {
            (tokenOut, tokenIn, outAmount, inAmount) = LibCurveConvert
                .convertMoonsToLP(convertData);
        } else if (kind == LibConvertData.ConvertKind.CURVE_LP_TO_MOONS) {
            (tokenOut, tokenIn, outAmount, inAmount) = LibCurveConvert
                .convertLPToMoons(convertData);
        } else if (kind == LibConvertData.ConvertKind.UNRIPE_MOONS_TO_UNRIPE_LP) {
            (tokenOut, tokenIn, outAmount, inAmount) = LibUnripeConvert
                .convertMoonsToLP(convertData);
        } else if (kind == LibConvertData.ConvertKind.UNRIPE_LP_TO_UNRIPE_MOONS) {
            (tokenOut, tokenIn, outAmount, inAmount) = LibUnripeConvert
                .convertLPToMoons(convertData);
        } else if (kind == LibConvertData.ConvertKind.LAMBDA_LAMBDA) {
            (tokenOut, tokenIn, outAmount, inAmount) = LibLambdaConvert
                .convert(convertData);
        } else {
            revert("Convert: Invalid payload");
        }
    }

    function getMaxAmountIn(address tokenIn, address tokenOut)
        internal
        view
        returns (uint256 amountIn)
    {
        /// MOON:3CRV LP -> MOON
        if (tokenIn == C.curveMetapoolAddress() && tokenOut == C.moonAddress())
            return LibCurveConvert.lpToPeg(C.curveMetapoolAddress());
        
        /// MOON -> MOON:3CRV LP
        if (tokenIn == C.moonAddress() && tokenOut == C.curveMetapoolAddress())
            return LibCurveConvert.moonsToPeg(C.curveMetapoolAddress());
        
        /// urMOON:3CRV LP -> urMOON
        if (tokenIn == C.unripeLPAddress() && tokenOut == C.unripeMoonAddress())
            return LibUnripeConvert.lpToPeg();

        /// urMOON -> urMOON:3CRV LP
        if (tokenIn == C.unripeMoonAddress() && tokenOut == C.unripeLPAddress())
            return LibUnripeConvert.moonsToPeg();

        // Lambda -> Lambda
        if (tokenIn == tokenOut) return type(uint256).max;

        require(false, "Convert: Tokens not supported");
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn)
        internal 
        view
        returns (uint256 amountOut)
    {
        /// MOON:3CRV LP -> MOON
        if (tokenIn == C.curveMetapoolAddress() && tokenOut == C.moonAddress())
            return LibCurveConvert.getMoonAmountOut(C.curveMetapoolAddress(), amountIn);
        
        /// MOON -> MOON:3CRV LP
        if (tokenIn == C.moonAddress() && tokenOut == C.curveMetapoolAddress())
            return LibCurveConvert.getLPAmountOut(C.curveMetapoolAddress(), amountIn);

        /// urMOON:3CRV LP -> MOON
        if (tokenIn == C.unripeLPAddress() && tokenOut == C.unripeMoonAddress())
            return LibUnripeConvert.getMoonAmountOut(amountIn);
        
        /// urMOON -> urMOON:3CRV LP
        if (tokenIn == C.unripeMoonAddress() && tokenOut == C.unripeLPAddress())
            return LibUnripeConvert.getLPAmountOut(amountIn);
        
        // Lambda -> Lambda
        if (tokenIn == tokenOut) return amountIn;

        require(false, "Convert: Tokens not supported");
    }
}
