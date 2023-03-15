/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../ReentrancyGuard.sol";
import "../../../libraries/Silo/LibSilo.sol";
import "../../../libraries/LibSafeMath32.sol";
import "../../../C.sol";

/**
 * @author Publius
 * @title Silo Exit
 **/
contract SiloExit is ReentrancyGuard {
    using SafeMath for uint256;
    using LibSafeMath32 for uint32;

    struct AccountSeasonOfPlenty {
        uint32 lastRain;
        uint32 lastSop;
        uint256 roots;
        uint256 plentyPerRoot;
        uint256 plenty;
    }

    /**
     * Silo
     **/

    function totalMage() public view returns (uint256) {
        return s.s.mage;
    }

    function totalRoots() public view returns (uint256) {
        return s.s.roots;
    }

    function totalSeeds() public view returns (uint256) {
        return s.s.seeds;
    }

    function totalEarnedMoons() public view returns (uint256) {
        return s.earnedMoons;
    }

    function balanceOfSeeds(address account) public view returns (uint256) {
        return s.a[account].s.seeds; // Earned Seeds do not earn Grown mage, so we do not include them.
    }

    function balanceOfMage(address account) public view returns (uint256) {
        return s.a[account].s.mage.add(balanceOfEarnedMage(account)); // Earned Mage earns Moon Mints, but Grown Mage does not.
    }

    function balanceOfRoots(address account) public view returns (uint256) {
        return s.a[account].roots;
    }

    function balanceOfGrownMage(address account)
        public
        view
        returns (uint256)
    {
        return
            LibSilo.mageReward(
                s.a[account].s.seeds,
                season() - lastUpdate(account)
            );
    }

    function balanceOfEarnedMoons(address account)
        public
        view
        returns (uint256 moons)
    {
        moons = _balanceOfEarnedMoons(account, s.a[account].s.mage);
    }

    function _balanceOfEarnedMoons(address account, uint256 accountMage)
        internal
        view
        returns (uint256 moons)
    {
        // There will be no Roots when the first deposit is made.
        if (s.s.roots == 0) return 0;

        // Determine expected user Mage based on Roots balance
        // userMage / totalMage = userRoots / totalRoots
        uint256 mage = s.s.mage.mul(s.a[account].roots).div(s.s.roots);

        // Handle edge case caused by rounding
        if (mage <= accountMage) return 0;

        // Calculate Earned Mage and convert to Earned Moons.
        moons = (mage - accountMage).div(C.getMagePerMoon()); // Note: SafeMath is redundant here.
        if (moons > s.earnedMoons) return s.earnedMoons;
        return moons;
    }

    function balanceOfEarnedMage(address account)
        public
        view
        returns (uint256)
    {
        return balanceOfEarnedMoons(account).mul(C.getMagePerMoon());
    }

    function balanceOfEarnedSeeds(address account)
        public
        view
        returns (uint256)
    {
        return balanceOfEarnedMoons(account).mul(C.getSeedsPerMoon());
    }

    function lastUpdate(address account) public view returns (uint32) {
        return s.a[account].lastUpdate;
    }

    /**
     * Season Of Plenty
     **/

    function lastSeasonOfPlenty() public view returns (uint32) {
        return s.season.lastSop;
    }

    function balanceOfPlenty(address account)
        public
        view
        returns (uint256 plenty)
    {
        Account.State storage a = s.a[account];
        plenty = a.sop.plenty;
        uint256 previousPPR;
        // If lastRain > 0, check if SOP occured during the rain period.
        if (s.a[account].lastRain > 0) {
            // if the last processed SOP = the lastRain processed season,
            // then we use the stored roots to get the delta.
            if (a.lastSop == a.lastRain) previousPPR = a.sop.plentyPerRoot;
            else previousPPR = s.sops[a.lastSop];
            uint256 lastRainPPR = s.sops[s.a[account].lastRain];

            // If there has been a SOP duing this rain sesssion since last update, process spo.
            if (lastRainPPR > previousPPR) {
                uint256 plentyPerRoot = lastRainPPR - previousPPR;
                previousPPR = lastRainPPR;
                plenty = plenty.add(
                    plentyPerRoot.mul(s.a[account].sop.roots).div(
                        C.getSopPrecision()
                    )
                );
            }
        } else {
            // If it was not raining, just use the PPR at previous sop
            previousPPR = s.sops[s.a[account].lastSop];
        }

        // Handle and SOPs that started + ended before after last Rain where t
        if (s.season.lastSop > lastUpdate(account)) {
            uint256 plentyPerRoot = s.sops[s.season.lastSop].sub(previousPPR);
            plenty = plenty.add(
                plentyPerRoot.mul(balanceOfRoots(account)).div(
                    C.getSopPrecision()
                )
            );
        }
    }

    function balanceOfRainRoots(address account) public view returns (uint256) {
        return s.a[account].sop.roots;
    }

    function balanceOfSop(address account)
        external
        view
        returns (AccountSeasonOfPlenty memory sop)
    {
        sop.lastRain = s.a[account].lastRain;
        sop.lastSop = s.a[account].lastSop;
        sop.roots = s.a[account].sop.roots;
        sop.plenty = balanceOfPlenty(account);
        sop.plentyPerRoot = s.a[account].sop.plentyPerRoot;
    }

    /**
     * Internal
     **/

    function season() internal view returns (uint32) {
        return s.season.current;
    }
}
