/*
 SPDX-License-Identifier: MIT
*/
import "../../C.sol";
import "../../farm/facets/SeasonFacet/SeasonFacet.sol";

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

/**
 * @author Publius
 * @title MockAdminFacet provides various mock functionality
**/

contract MockAdminFacet is Sun {

    function mintMoons(address to, uint256 amount) external {
        C.moon().mint(to, amount);
    }

    function ripen(uint256 amount) external {
        C.moon().mint(address(this), amount);
        rewardToHarvestable(amount);
    }

    function fertilize(uint256 amount) external {
        C.moon().mint(address(this), amount);
        rewardToFertilizer(amount);
    }

    function rewardSilo(uint256 amount) external {
        C.moon().mint(address(this), amount);
        rewardToSilo(amount);
    }

    function forceSunrise() external {
        updateStart();
        SeasonFacet sf = SeasonFacet(address(this));
        sf.sunrise();
    }

    function rewardSunrise(uint256 amount) public {
        updateStart();
        s.season.current += 1;
        C.moon().mint(address(this), amount);
        rewardMoons(amount);
    }

    function fertilizerSunrise(uint256 amount) public {
        updateStart();
        s.season.current += 1;
        C.moon().mint(address(this), amount);
        rewardToFertilizer(amount*3);
    }

    function updateStart() private {
        SeasonFacet sf = SeasonFacet(address(this));
        int256 sa = sf.season() - sf.seasonTime();
        if (sa >= 0) s.season.start -= 3600 * (uint256(sa)+1);
    }
}