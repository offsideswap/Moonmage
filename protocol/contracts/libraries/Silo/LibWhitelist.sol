/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "../../C.sol";
import "../LibAppStorage.sol";

/**
 * @author Publius
 * @title LibWhitelist handles the whitelisting of different tokens.
 **/

interface IBS {
    function lusdToBDV(uint256 amount) external view returns (uint256);

    function curveToBDV(uint256 amount) external view returns (uint256);

    function moonToBDV(uint256 amount) external pure returns (uint256);

    function unripeMoonToBDV(uint256 amount) external view returns (uint256);

    function unripeLPToBDV(uint256 amount) external view returns (uint256);
}

library LibWhitelist {

    event WhitelistToken(
        address indexed token,
        bytes4 selector,
        uint256 seeds,
        uint256 mage
    );

    event DewhitelistToken(address indexed token);

    uint32 private constant MOON_3CRV_MAGE = 10000;
    uint32 private constant MOON_3CRV_SEEDS = 4;

    uint32 private constant MOON_MAGE = 10000;
    uint32 private constant MOON_SEEDS = 2;

    function whitelistPools() internal {
        whitelistMoon3Crv();
        whitelistMoon();
        whitelistUnripeMoon();
        whitelistUnripeLP();
    }

    function whitelistMoon3Crv() internal {
        whitelistToken(
            C.curveMetapoolAddress(),
            IBS.curveToBDV.selector,
            MOON_3CRV_MAGE,
            MOON_3CRV_SEEDS
        );
    }

    function whitelistMoon() internal {
        whitelistToken(
            C.moonAddress(),
            IBS.moonToBDV.selector,
            MOON_MAGE,
            MOON_SEEDS
        );
    }

    function whitelistUnripeMoon() internal {
        whitelistToken(
            C.unripeMoonAddress(),
            IBS.unripeMoonToBDV.selector,
            MOON_MAGE,
            MOON_SEEDS
        );
    }

    function whitelistUnripeLP() internal {
        whitelistToken(
            C.unripeLPAddress(),
            IBS.unripeLPToBDV.selector,
            MOON_3CRV_MAGE,
            MOON_3CRV_SEEDS
        );
    }

    function dewhitelistToken(address token) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        delete s.ss[token];
        emit DewhitelistToken(token);
    }

    function whitelistToken(
        address token,
        bytes4 selector,
        uint32 mage,
        uint32 seeds
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.ss[token].selector = selector;
        s.ss[token].mage = mage;
        s.ss[token].seeds = seeds;

        emit WhitelistToken(token, selector, mage, seeds);
    }
}
