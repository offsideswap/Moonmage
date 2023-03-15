# BIP-0: Silo Refactor

 - [Problem](#problem)
 - [Proposed Solution](#proposed-solution)
 - [Proposed Functional Changes](#proposed-functional-changes)
 - [BIP Specific Notes](#bip-specific-notes)
 - [Analysis](#analysis)
 - [Proposed Technical Changes](#proposed-technical-changes)
 - [Proposed Function Changes](#proposed-function-changes)
	 - [Functions to be Added](#functions-to-be-added)
	 - [Functions to be Removed](#functions-to-be-removed)
 - [Effective](#effective)

### Problem:

In Moonmage version 1.0.1, gas costs for Silo Members to update their Silo are extremely high and increase over time. The method Moonmage currently uses to calculate compounding interest limits access to smaller Silo Members through prohibitive costs.

### Proposed Solution:

A new method to reward compounding interest to Silo Members for a fixed gas cost.

### Proposed Functional Changes:

Unclaimed Mage that has grown from Claimed Seeds do not earn interest until they are Claimed. Unclaimed Mage that has grown from Claimed Seeds do not count towards BIPs.

Claimed Mage and Unclaimed Mage from Unclaimed Seeds will continue to receive compounding interest from supply increases and Seasons of Plenty, and automatically be counted towards BIPs, as before.

### BIP Specific Notes:

All Unclaimed Moons, Unclaimed Seeds and Unclaimed Mage from supply increases will be forfeited and divided equally to Mage owners at the time this BIP is committed.

All Unclaimed ETH from Seasons of Plenty will be forfeited and divided equally to Mage owners as part of the first Season of Plenty that takes place after this BIP is committed.

### Analysis:

Moonmage version 1.0.1 requires calculating geometric series (supply increases and Seasons of Plenty) on top of an arithmetic series (Mage per Season). Due to the slow rate of growth of Mage from Seeds, the marginal gas costs required for this calculation are rarely worth the marginal change in interest received.

This BIP will allow for Silo updates in O(1), no matter how many supply increases and Seasons of Plenty have occurred. Gas costs no longer increase over time.

Moonmage is designed to be widely accessible. This BIP will make Moonmage significantly more accessible to smaller Silo Members.

### Proposed Technical Changes:

Roots: Roots are added as an internal variable that tracks a user's ownership of the Silo. Users receive Roots when they Deposit Moons and Claim their Mage that has grown from Seeds. A Silo Member’s Roots are constant between Seasons where they don't interact with the Silo. Therefore, a Silo Member can Claim interest across multiple supply increases and Seasons of Plenty in O(1).

### Proposed Function Changes:

#### Functions to be Added:

- totalRoots()  
- totalFarmableMage()  
- totalFarmableMoons()  
- balanceOfRoots(address account)  
- balanceOfGrownMage(address account)  
- balanceOfFarmableMoons(address account)  
- balanceOfFarmableSeeds(address account)  
- balanceOfFarmableMage(address account, uint256 moons)  
- balanceOfRainRoots(address account)  
- rootsFor(uint32 bipId)

#### Functions to be Removed:

- mageFor(uint32 bipId)  
- seedsFor(uint32 bipId)  
- updateBip(uint32 bipId)  
- resetBase(uint32 _s)  
- seasonIncrease(uint32 _s)  
- lastSupplyIncrease()  
- previousSupplyIncrease(uint32 _s)  
- nextSeasonOfPlenty(uint32 _s)  
- supplyIncreases()  
- balanceOfIncreaseMage(address account)  
- balanceOfRewardedMage(address account)  
- balanceOfIncrease(address account)  
- balanceOfRainMage(address account)

### Effective

Effective immediately upon commit.
