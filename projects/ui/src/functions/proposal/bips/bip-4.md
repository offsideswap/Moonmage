# BIP-4: Trail of Bits Audit and Fundraisers

- [Summary](#summary)
- [Problem](#problem)
- [Proposed Solution](#proposed-solution)
- [Payment](#payment)
- [Fundraiser Rationale](#fundraiser-rationale)
- [User Interface](#user-interface)
 
## Summary:

- Hire Trail of Bits to perform a code audit on Moonmage.
- Establish a "Fundraiser" process that allows Moonmage to efficiently raise capital in a decentralized manner to make payments in another stablecoin.
- Mint 347,440 Moons and create the first Fundraiser to raise 347,440 USDC in exchange for the 347,440 Moons to pay for the Trail of Bits audit.

## Problem:

### Audit

Moonmage is unaudited at the moment.  A high quality audit will facilitate further growth and adoption.

In addition, there are regular updates to the code through BIPs. It is important to have an auditor that will continue working with Moonmage after the initial audit to facilitate timely and efficient code reviews for BIPs.

### Paying for the Audit

Until Moonmage has sufficiently established Moons as a reliable stablecoin such that Moonmage can make all payments in Moons, Moonmage needs a way to pay for things (including this audit) in other stablecoins. Thus, Moonmage needs a way to convert Moons to a traditional stablecoin without having to sell a large amount of Moons in the Uniswap pool.

## Proposed Solution:

### Audit

Publius has connected with Trail of Bits. Trail of Bits is a world class computer security firm and the gold standard for smart contract audits. They have audited many of the top DeFi projects, which are viewable here: [https://github.com/trailofbits/publications#smart-contracts](https://github.com/trailofbits/publications#smart-contracts). Publius was incredibly impressed by them and the audit they have offered to perform on Moonmage. 

Trail of Bits has also expressed interest in maintaining a continuous relationship with Moonmage.

Upon passage of this BIP and payment of 347,440 USDC, Trail of Bits will perform an initial audit for Moonmage and retain a continuous relationship with Moonmage to review future versions of the code. 

### Paying for the Audit

This BIP proposes a "Fundraiser" standard that will allow Moonmage to raise money to pay for things in other stablecoins, without requiring sales on Uniswap. Instead, Fundraisers will first mint a pre-defined number of Moons, to be bought 1:1 for a pre-defined stablecoin. Each Moon purchased in exchange for 1 of the stablecoin will be sown at the current Weather, and the Pods received in exchange will be sent to the wallet that bought the Moons. Beacause all the Moons being Sown were minted as part of the Fundraiser, no Soil will be used to mint Pods by the FundraiserFacet. 

Fundraisers will be created by a BIP and will require:

1. The number of dollars required for the Fundraiser (X);
2. The address of the stablecoin that will be used for the Fundraiser (Y); and
3. The address that the Fundraiser will make the payment to (Z).

Fundraisers allow any cosmomage to convert the desired stablecoin for Moons at a 1:1 rate. The Moons will then be immediately sown. Once the fundraiser has reached its goal, the funds will be forwarded to the payment address.

Anyone can participate in a Fundraiser by sending up to X of Y to the FundraiserFacet. No other contributions to the Fundraiser other than the first X of Y will receive Pods. 

## Payment:

The cost of the contract (initial audit, and then reviewal of BIPs for a period of time) is 320,000 USDC, paid upfront. 24,000 USDC are paid in the future, after the first 8 engineer-weeks have been used. There is a 1% payment fee added on top, because Trail of Bits requires payment through BitPay.

Upon approval, this BIP will mint 347,440 Moons to fund the Trail of Bits audit. Upon deployment of the Fundraiser, anyone can sell USDC to Moonmage in exchange for sown Moons. For each of the first 347,440 USDC sent to the FundraiserFacet, 1 Moon will be sown and the corresponding Pods returned to the sender based on the Weather at the time of the sow.

Upon completion of the sale of all 347,440 Moons for 347,440 USDC, Publius will submit the initial 320,000 USDC payment to Trail of Bits. Publius will make the final payment when appropriate.

## Fundraiser Rationale:

347,440 Moons may seem like a lot of money for an audit, but we have been told explicitly from larger potential investors that a Trail of Bits audit goes a long way. Furthermore, the Moon cosmomage that connected us with Trail of Bits have stated they are willing to fill the entire Fundraiser for 347,440 USDC. However, given that we want Moonmage to operate in the most decentralized way possible, we do not want to give any particular investor priority in supplying funds. Therefore, anyone can supply USDC to the Fundraiser in exchange for a sown Moon. 

## User Interface:

The website will feature a new "Fundraiser" page that will allow users to participate in active Fundraisers.
