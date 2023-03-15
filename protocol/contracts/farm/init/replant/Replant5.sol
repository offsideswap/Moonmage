/*
 SPDX-License-Identifier: MIT
*/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../AppStorage.sol";
import "../../../C.sol";

/**
 * @author Publius
 * @title Replant5 Redeposits all existing Moon Deposits as Unripe Moon Deposits
 * ------------------------------------------------------------------------------------
 **/
contract Replant5 {
    AppStorage internal s;

    using SafeMath for uint256;

    event MoonRemove(
        address indexed account,
        uint32[] crates,
        uint256[] crateMoons,
        uint256 moons
    );

    event AddDeposit(
        address indexed account,
        address indexed token,
        uint32 season,
        uint256 amounts,
        uint256 bdv
    );

    struct V1Deposit {
        address account;
        uint32[] seasons;
        uint256[] amounts;
        uint256 amount;
    }

    function init(V1Deposit[] calldata moonDeposits) external {
        updateMoonDeposits(moonDeposits);
    }

    function updateMoonDeposits(V1Deposit[] calldata ds) private {
        for (uint256 i; i < ds.length; ++i) {
            V1Deposit calldata d = ds[i];
            emit MoonRemove(d.account, d.seasons, d.amounts, d.amount);

            for (uint256 j; j < d.seasons.length; ++j) {
                emit AddDeposit(
                    d.account,
                    C.unripeMoonAddress(),
                    d.seasons[j],
                    d.amounts[j],
                    d.amounts[j].mul(C.initialRecap()).div(C.precision())
                );
            }
        }
    }
}
