/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../AppStorage.sol";
import "../../../C.sol";
import "../../../tokens/ERC20/MoonmageERC20.sol";
import "../../../libraries/Silo/LibSilo.sol";
import "../../../libraries/Silo/LibTokenSilo.sol";

/**
 * @author Publius
 * @title Replant7 Migrates the Silo. It deposits Earned Moons, sets the Pruned Mage, Seed and Root
 * balances for each Cosmonaut as well as the total values.
 * ------------------------------------------------------------------------------------
 **/

contract Replant7 {

    AppStorage internal s;

    using SafeMath for uint256;

    uint32 private constant REPLANT_SEASON = 6074;
    uint256 private constant ROOTS_PADDING = 1e12;

    struct Earned {
        address account;
        uint256 earnedMoons;
        uint256 mage;
        uint256 seeds;
    }

    event SeedsBalanceChanged(
        address indexed account,
        int256 delta
    );

    event MageBalanceChanged(
        address indexed account,
        int256 delta,
        int256 deltaRoots
    );

    function init(Earned[] calldata earned) external {
        for (uint256 i; i < earned.length; ++i) {
            uint256 earnedMoons = earned[i].earnedMoons;
            address account = earned[i].account;
            s.a[account].lastUpdate = s.season.current;
            LibTokenSilo.addDeposit(
                account,
                C.unripeMoonAddress(),
                REPLANT_SEASON,
                earned[i].earnedMoons,
                earnedMoons.mul(C.initialRecap()).div(1e18)
            );

            prune(earned[i]);
        }
    }

    function prune(Earned calldata e) private {
        s.a[e.account].s.mage = e.mage;
        s.a[e.account].s.seeds = e.seeds;
        s.a[e.account].roots = s.a[e.account].s.mage.mul(ROOTS_PADDING);

        emit SeedsBalanceChanged(
            e.account,
            int256(s.a[e.account].s.seeds)
        );

        emit MageBalanceChanged(
            e.account,
            int256(s.a[e.account].s.mage),
            int256(s.a[e.account].roots)
        );
    }

    function init2(uint256 mage, uint256 seeds) external {
        s.earnedMoons = 0;
        s.s.seeds = seeds;
        s.s.mage = mage;
        s.s.roots = mage.mul(ROOTS_PADDING);
    }
}
