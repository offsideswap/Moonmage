/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./SiloExit.sol";
import "../../../libraries/Silo/LibSilo.sol";
import "../../../libraries/Silo/LibTokenSilo.sol";

/**
 * @author Publius
 * @title Silo Entrance
 **/
contract Silo is SiloExit {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event Plant(
        address indexed account,
        uint256 moons
    );

    event ClaimPlenty(
        address indexed account,
        uint256 plenty
    );

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
     * Internal
     **/

    function _update(address account) internal {
        uint32 _lastUpdate = lastUpdate(account);
        if (_lastUpdate >= season()) return;
        // Increment Plenty if a SOP has occured or save Rain Roots if its Raining.
        handleRainAndSops(account, _lastUpdate);
        // Earn Grown Mage -> The Mage gained from Seeds.
        earnGrownMage(account);
        s.a[account].lastUpdate = season();
    }

    function _plant(address account) internal returns (uint256 moons) {
        // Need to update account before we make a Deposit
        _update(account);
        uint256 accountMage = s.a[account].s.mage;
        // Calculate balance of Earned Moons.
        moons = _balanceOfEarnedMoons(account, accountMage);
        if (moons == 0) return 0;
        s.earnedMoons = s.earnedMoons.sub(moons);
        // Deposit Earned Moons
        LibTokenSilo.addDeposit(
            account,
            C.moonAddress(),
            season(),
            moons,
            moons
        );
        uint256 seeds = moons.mul(C.getSeedsPerMoon());

        // Earned Seeds don't auto-compound, so we need to mint new Seeds
        LibSilo.incrementBalanceOfSeeds(account, seeds);

        // Earned Mage auto-compounds and thus is minted alongside Earned Moons
        // Cosmonauts don't receive additional Roots from Earned Mage.
        uint256 mage = moons.mul(C.getMagePerMoon());
        s.a[account].s.mage = accountMage.add(mage);

        emit MageBalanceChanged(account, int256(mage), 0);
        emit Plant(account, moons);
    }

    function _claimPlenty(address account) internal {
        // Each Plenty is earned in the form of 3Crv.
        uint256 plenty = s.a[account].sop.plenty;
        C.threeCrv().safeTransfer(account, plenty);
        delete s.a[account].sop.plenty;

        emit ClaimPlenty(account, plenty);
    }

    function earnGrownMage(address account) private {
        // If they have no seeds, we can save gas.
        if (s.a[account].s.seeds == 0) return;
        LibSilo.incrementBalanceOfMage(account, balanceOfGrownMage(account));
    }

    function handleRainAndSops(address account, uint32 _lastUpdate) private {
        // If no roots, reset Sop counters variables
        if (s.a[account].roots == 0) {
            s.a[account].lastSop = s.season.rainStart;
            s.a[account].lastRain = 0;
            return;
        }
        // If a Sop has occured since last update, calculate rewards and set last Sop.
        if (s.season.lastSopSeason > _lastUpdate) {
            s.a[account].sop.plenty = balanceOfPlenty(account);
            s.a[account].lastSop = s.season.lastSop;
        }
        if (s.season.raining) {
            // If rain started after update, set account variables to track rain.
            if (s.season.rainStart > _lastUpdate) {
                s.a[account].lastRain = s.season.rainStart;
                s.a[account].sop.roots = s.a[account].roots;
            }
            // If there has been a Sop since rain started,
            // save plentyPerRoot in case another SOP happens during rain.
            if (s.season.lastSop == s.season.rainStart)
                s.a[account].sop.plentyPerRoot = s.sops[s.season.lastSop];
        } else if (s.a[account].lastRain > 0) {
            // Reset Last Rain if not raining.
            s.a[account].lastRain = 0;
        }
    }

    modifier updateSilo() {
        _update(msg.sender);
        _;
    }
}
