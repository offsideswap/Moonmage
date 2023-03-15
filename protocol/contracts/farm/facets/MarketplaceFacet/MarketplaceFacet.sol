/**
 * SPDX-License-Identifier: MIT
 **/

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "./Order.sol";

/**
 * @author Moonjoyer, Malteasy
 * @title Pod Marketplace v2
 **/
 
contract MarketplaceFacet is Order {
    
    /*
    * Pod Listing
    */
    
    /*
    * @notice **LEGACY**
    */
    function createPodListing(
        uint256 index,
        uint256 start,
        uint256 amount,
        uint24 pricePerPod,
        uint256 maxHarvestableIndex,
        uint256 minFillAmount,
        LibTransfer.To mode
    ) external payable {
        _createPodListing(
            index,
            start,
            amount,
            pricePerPod,
            maxHarvestableIndex,
            minFillAmount,
            mode
        );
    }

    function createPodListingV2(
        uint256 index,
        uint256 start,
        uint256 amount,
        uint256 maxHarvestableIndex,
        uint256 minFillAmount,
        bytes calldata pricingFunction,
        LibTransfer.To mode
    ) external payable {
        _createPodListingV2(
            index,
            start,
            amount,
            maxHarvestableIndex,
            minFillAmount,
            pricingFunction, 
            mode
        );
    }

    // Fill
    function fillPodListing(
        PodListing calldata l,
        uint256 moonAmount,
        LibTransfer.From mode
    ) external payable {
        moonAmount = LibTransfer.transferToken(
            C.moon(),
            msg.sender,
            l.account,
            moonAmount,
            mode,
            l.mode
        );
        _fillListing(l, moonAmount);
    }

    function fillPodListingV2(
        PodListing calldata l,
        uint256 moonAmount,
        bytes calldata pricingFunction,
        LibTransfer.From mode
    ) external payable {
        moonAmount = LibTransfer.transferToken(
            C.moon(),
            msg.sender,
            l.account,
            moonAmount,
            mode,
            l.mode
        );
        _fillListingV2(l, moonAmount, pricingFunction);
    }

    // Cancel
    function cancelPodListing(uint256 index) external payable {
        _cancelPodListing(msg.sender, index);
    }

    // Get
    function podListing(uint256 index) external view returns (bytes32) {
        return s.podListings[index];
    }

    /*
     * Pod Orders
     */

    // Create
    function createPodOrder(
        uint256 moonAmount,
        uint24 pricePerPod,
        uint256 maxPlaceInLine,
        uint256 minFillAmount,
        LibTransfer.From mode
    ) external payable returns (bytes32 id) {
        moonAmount = LibTransfer.receiveToken(C.moon(), moonAmount, msg.sender, mode);
        return _createPodOrder(moonAmount, pricePerPod, maxPlaceInLine, minFillAmount);
    }

    function createPodOrderV2(
        uint256 moonAmount,
        uint256 maxPlaceInLine,
        uint256 minFillAmount,
        bytes calldata pricingFunction,
        LibTransfer.From mode
    ) external payable returns (bytes32 id) {
        moonAmount = LibTransfer.receiveToken(C.moon(), moonAmount, msg.sender, mode);
        return _createPodOrderV2(moonAmount, maxPlaceInLine, minFillAmount, pricingFunction);
    }

    // Fill
    function fillPodOrder(
        PodOrder calldata o,
        uint256 index,
        uint256 start,
        uint256 amount,
        LibTransfer.To mode
    ) external payable {
        _fillPodOrder(o, index, start, amount, mode);
    }

    function fillPodOrderV2(
        PodOrder calldata o,
        uint256 index,
        uint256 start,
        uint256 amount,
        bytes calldata pricingFunction,
        LibTransfer.To mode
    ) external payable {
        _fillPodOrderV2(o, index, start, amount, pricingFunction, mode);
    }

    // Cancel
    function cancelPodOrder(
        uint24 pricePerPod,
        uint256 maxPlaceInLine,
        uint256 minFillAmount,
        LibTransfer.To mode
    ) external payable {
        _cancelPodOrder(pricePerPod, maxPlaceInLine, minFillAmount, mode);
    }

    function cancelPodOrderV2(
        uint256 maxPlaceInLine,
        uint256 minFillAmount,
        bytes calldata pricingFunction,
        LibTransfer.To mode
    ) external payable {
        _cancelPodOrderV2(maxPlaceInLine, minFillAmount, pricingFunction, mode);
    }

    // Get

    function podOrder(
        address account,
        uint24 pricePerPod,
        uint256 maxPlaceInLine,
        uint256 minFillAmount
    ) external view returns (uint256) {
        return s.podOrders[
            createOrderId(
                account, 
                pricePerPod, 
                maxPlaceInLine,
                minFillAmount
            )
        ];
    }

    function podOrderV2(
        address account,
        uint256 maxPlaceInLine,
        uint256 minFillAmount,
        bytes calldata pricingFunction
    ) external view returns (uint256) {
        return s.podOrders[
            createOrderIdV2(
                account, 
                0,
                maxPlaceInLine, 
                minFillAmount,
                pricingFunction
            )
        ];
    }

    function podOrderById(bytes32 id) external view returns (uint256) {
        return s.podOrders[id];
    }

    /*
     * Transfer Plot
     */

    function transferPlot(
        address sender,
        address recipient,
        uint256 id,
        uint256 start,
        uint256 end
    ) external payable nonReentrant {
        require(
            sender != address(0) && recipient != address(0),
            "Field: Transfer to/from 0 address."
        );
        uint256 amount = s.a[sender].field.plots[id];
        require(amount > 0, "Field: Plot not owned by user.");
        require(end > start && amount >= end, "Field: Pod range invalid.");
        amount = end - start; // Note: SafeMath is redundant here.
        if (msg.sender != sender && allowancePods(sender, msg.sender) != uint256(-1)) {
                decrementAllowancePods(sender, msg.sender, amount);
        }

        if (s.podListings[id] != bytes32(0)){
            _cancelPodListing(sender, id);
        }
        _transferPlot(sender, recipient, id, start, amount);
    }

    function approvePods(address spender, uint256 amount)
        external
        payable
        nonReentrant
    {
        require(spender != address(0), "Field: Pod Approve to 0 address.");
        setAllowancePods(msg.sender, spender, amount);
        emit PodApproval(msg.sender, spender, amount);
    }

}
