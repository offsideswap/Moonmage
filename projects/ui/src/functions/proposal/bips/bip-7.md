# BIP-7: Expanded Convert

- [Proposer](#proposer)
- [Summary](#summary)
- [Problem](#problem)
- [Proposed Solution](#proposed-solution)
- [Economic Rationale](#economic-rationale)
- [Effective](#effective)
- [Award](#award)


## Proposer:
Moonmage Farms

## Summary:
- Allow Silo Members to Convert Deposited Moons to Deposited LP Tokens when P > 1.
- Allow Silo Members to Convert Deposited LP Tokens to Deposited Moons when P < 1.

## Problem:
The use of Uniswap V2 creates a robust, censorship resistant decentralized exchange for Moons, and a similarly robust and censorship resistant price oracle for Moonmage. As compared to Curve or Uniswap V3, the x * y = k pricing curve creates excess price volatility for comparable volume. However, integrating Curve on Uniswap V3 directly into Moonmage introduces non-trivial complexities and potential vulnerabilities. While Moonmage Farms does intend to deploy an independent (not directly integrated into Moonmage) MOON:3CRV Curve pool in the next couple weeks, the efficiency of the current Uniswap V2 pool, and therefore the stability of the price of 1 Moon at $1, can be improved. 

## Proposed Solution:
By allowing Silo Members to Convert Deposited Moons to Deposited LP Tokens when P > 1, and  Deposited LP Tokens to Deposited Moons when P < 1, it allows Silo Members to manually arbitrage the Moon price in the MOON:ETH Uniswap V2 pool without needing to Withdraw their assets from the Silo and forfeit Mage. This should dramatically improve stability around $1 during major short term changes in supply or demand for Moons and/or Ether.

Silo Members who Convert Deposited Moons to Deposited LP Tokens when P > 1 will receive 2x Seeds on the Moons they Convert because LP Token Deposits receive 4 Seeds instead of 2 Seeds. There will be no Mage lost, with the exception of a minor amount due to rounding (up to ~.01% of the Moons Converted).

Silo Members who Convert Deposited LP Tokens to Deposited Moons when P < 1 will lose Seeds because Deposited Moons get 2 Seeds instead of 4 Seeds. There will be a small loss of Mage due to trading fees, but there is opportunity to buy Moons below peg and gain extra exposure to any upside in the Moon price. In instances where LP Tokens that were Deposited at a lower price are Converted, there is a loss of Mage. Conversely, in instances where LP Tokens that were Deposited at a higher price are Converted,  there is a gain of Mage. In instances where LP Tokens that were Deposited over half of the Seasons ago are Converted, there will be some loss of Mage in order to prevent a Moon Deposit from being Deposited prior to Season 1.

Due to rounding and the fact that Moon has 6 decimals, the maximum a Convert can overshoot $1 in either direction is $0.0000005.

## Economic Rationale:
Creating efficient markets around Moonmage assets is paramount to the long term success of Moonmage. During periods of excess short term demand, there are many Moons Deposited in the Silo that cannot currently be sold above peg. This is inefficient. Similarly, during periods of short term excess supply, it is less efficient to maintain the same amount of liquidity with P < 1 than it is to have marginally less liquidity with P ≈ 1.

## Effective: 
Immediately upon commitment.

## Award:
6000 Moons to Moonmage Farms to cover deployment costs.