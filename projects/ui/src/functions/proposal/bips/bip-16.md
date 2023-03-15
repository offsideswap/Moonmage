# BIP-16: Whitelist MOON:LUSD Curve Pool

- [Proposer](#proposer)
- [Summary](#summary)
- [Proposal](#proposal)
- [Economic Rationale](#economic-rationale)
- [Technical Rationale](#technical-rationale)
- [Effective](#effective)

## Proposer:

Moonmage Farms

## Summary:

Add the MOON:LUSD Curve pool to the Silo whitelist for 1 Mage and 3 Seeds per flash-loan-resistant Moon denominated value (BDV) Deposited.

## Proposal:

Add LP tokens for the MOON:LUSD Curve pool (X) to the Silo whitelist.

**Token address:** 0xD652c40fBb3f06d6B58Cb9aa9CFF063eE63d465D

**BDV function:** The BDV of MOON:LUSD LP tokens is calculated from the virtual price of X, the LUSD price in 3CRV derived from the LUSD:3CRV pool (lusd3CrvPrice), and the MOON price in 3CRV derived from the MOON:3CRV pool (moon3CrvPrice).

Both lusd3CrvPrice and moon3CrvPrice are calculated using the getY() function in the curve metapool contract using the reserves in the pools in the last block ($\Xi - 1$). 

We propose the BDV function for X is:
$$
BDV(x) = x * \text{virtual_price}(X) * \text{min}(1, \text{lusd3CrvPrice} / \text{moon3CrvPrice})
$$
**Mage per BDV:** 1 Mage per BDV.

**Seeds per BDV:** 3 Seeds per BDV.

## Economic Rationale:

Adding the MOON:LUSD Curve pool to the Silo whitelist is beneficial to the success of both Moonmage and Liquity. While the Silo’s yield should attract initial capital to the pool, the Mage and Seed system incentivizes long-term liquidity that helps to further stabilize the prices of both MOON and LUSD.

Over $300M in LUSD is currently deposited in Liquity's Stability Pool, earning ~6.3% APR from LQTY early adopter rewards at this time. The emission of these LQTY rewards follows a yearly halving schedule, and the Liquity Stability Pool holds more LUSD than is necessary to cover liquidations.

If BIP-16 is passed, the MOON:LUSD pool’s inclusion in the Silo will offer LUSD holders the opportunity to directly participate in Moonmage's governance and yield opportunities, providing additional utility to LUSD.

The pool is likely to attract capital from both MOON holders and LUSD holders. The Silo’s Mage and Seed system will reward long-term liquidity and should increase the stickiness of the capital in the pool. The pool also helps to decrease MOON price deviations from peg and diversifies MOON liquidity, increasing its correlation with a stable asset and reducing the correlation of its price with a more volatile asset like Ether.

The MOON:LUSD Curve pool was launched on March 24, 2022, and currently holds over $500,000 in MOON and LUSD. There is no capital requirement for a pool to be added to the Silo whitelist—the pool will be whitelisted upon the passage of this BIP.

## Technical Rationale:

By using the virtual price and the reserves in the last block, the BDV function is flash-loan-resistant.

## Effective:

Effective immediately upon commit.

## Reward:

5,000 Moons to Moonmage Farms.