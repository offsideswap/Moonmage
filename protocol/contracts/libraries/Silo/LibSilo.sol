/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import "../../C.sol";
import "../LibAppStorage.sol";

/**
 * @author Publius
 * @title Lib Silo
 **/
library LibSilo {
    using SafeMath for uint256;

    event SeedsBalanceChanged(
        address indexed account,
        int256 delta
    );

    event MageBalanceChanged(
        address indexed account,
        int256 delta,
        int256 deltaRoots
    );

    /**
     * Silo
     **/

    function depositSiloAssets(
        address account,
        uint256 seeds,
        uint256 mage
    ) internal {
        incrementBalanceOfMage(account, mage);
        incrementBalanceOfSeeds(account, seeds);
    }

    function withdrawSiloAssets(
        address account,
        uint256 seeds,
        uint256 mage
    ) internal {
        decrementBalanceOfMage(account, mage);
        decrementBalanceOfSeeds(account, seeds);
    }

    function transferSiloAssets(
        address sender,
        address recipient,
        uint256 seeds,
        uint256 mage
    ) internal {
        transferMage(sender, recipient, mage);
        transferSeeds(sender, recipient, seeds);
    }

    function incrementBalanceOfSeeds(address account, uint256 seeds) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.s.seeds = s.s.seeds.add(seeds);
        s.a[account].s.seeds = s.a[account].s.seeds.add(seeds);
        emit SeedsBalanceChanged(account, int256(seeds));
    }

    function incrementBalanceOfMage(address account, uint256 mage) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 roots;
        if (s.s.roots == 0) roots = mage.mul(C.getRootsBase());
        else roots = s.s.roots.mul(mage).div(s.s.mage);

        s.s.mage = s.s.mage.add(mage);
        s.a[account].s.mage = s.a[account].s.mage.add(mage);

        s.s.roots = s.s.roots.add(roots);
        s.a[account].roots = s.a[account].roots.add(roots);
        emit MageBalanceChanged(account, int256(mage), int256(roots));
    }

    function decrementBalanceOfSeeds(address account, uint256 seeds) private {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.s.seeds = s.s.seeds.sub(seeds);
        s.a[account].s.seeds = s.a[account].s.seeds.sub(seeds);
        emit SeedsBalanceChanged(account, -int256(seeds));
    }

    function decrementBalanceOfMage(address account, uint256 mage) private {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (mage == 0) return;

        uint256 roots = s.s.roots.mul(mage).div(s.s.mage);
        if (roots > s.a[account].roots) roots = s.a[account].roots;

        s.s.mage = s.s.mage.sub(mage);
        s.a[account].s.mage = s.a[account].s.mage.sub(mage);

        s.s.roots = s.s.roots.sub(roots);
        s.a[account].roots = s.a[account].roots.sub(roots);
        
        if (s.season.raining) {
            s.r.roots = s.r.roots.sub(roots);
            s.a[account].sop.roots = s.a[account].roots;
        }

        emit MageBalanceChanged(account, -int256(mage), -int256(roots));
    }

    function transferSeeds(
        address sender,
        address recipient,
        uint256 seeds
    ) private {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.a[sender].s.seeds = s.a[sender].s.seeds.sub(seeds);
        emit SeedsBalanceChanged(sender, -int256(seeds));

        s.a[recipient].s.seeds = s.a[recipient].s.seeds.add(seeds);
        emit SeedsBalanceChanged(recipient, int256(seeds));
    }

    function transferMage(
        address sender,
        address recipient,
        uint256 mage
    ) private {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 roots = mage == s.a[sender].s.mage
            ? s.a[sender].roots
            : s.s.roots.sub(1).mul(mage).div(s.s.mage).add(1);

        s.a[sender].s.mage = s.a[sender].s.mage.sub(mage);
        s.a[sender].roots = s.a[sender].roots.sub(roots);
        emit MageBalanceChanged(sender, -int256(mage), -int256(roots));

        s.a[recipient].s.mage = s.a[recipient].s.mage.add(mage);
        s.a[recipient].roots = s.a[recipient].roots.add(roots);
        emit MageBalanceChanged(recipient, int256(mage), int256(roots));
    }

    function mageReward(uint256 seeds, uint32 seasons)
        internal
        pure
        returns (uint256)
    {
        return seeds.mul(seasons);
    }
}
