# BIP-10: Omniscia Retainer

- [Proposer](#proposer)
- [Summary](#summary)
- [Problem](#problem)
- [Proposed Solution](#proposed-solution)
- [Payment](#payment)
- [Fundraiser Rationale](#fundraiser-rationale)
- [User Interface](#user-interface)
- [Effective](#effective)

## Proposer:
Moonmage Farms

## Summary:
- Hire Omniscia to perform a continuous code audit on Moonmage to facilitate the swift proposal of new BIPs by Moonmage Farms.
- Leverage the "Fundraiser" process proposed in BIP-4 to mint the Moons and raise the USDC necessary to pay for the Omniscia retainer.
- Mint 250,000 Moons and create a Fundraiser to raise 250,000 USDC in exchange for 250,000 Moons. Pay Omniscia 250,000 USDC for the retainer.
- Send 50,000 Moons from Moonmage Farms to Omnsicia as a down payment, to be returned upon completion of the retainer payment.

## Problem:

### Audit
Moonmage is unaudited at the moment.  Over the past month, Omniscia has started auditing Moonmage, with a preliminary report expected shortly. 

One of the reasons Moonmage Farms originally selected Omniscia was their willingness to continuously audit Moonmage despite the regularly anticipated proposed updates to Moonmage through BIPs. 

### Paying for the Audit
Until Moonmage has sufficiently established Moons as a reliable stablecoin such that Moonmage Farms can make all payments in Moons, Moonmage Farms needs a way to pay for things (including this retainer) in other stablecoins. The Fundraiser structure provides a simple structure for Moonmage Farms to sell Moons for another stablecoin at 1:1.

Due to the potential time it may take to complete the Fundraiser, Omniscia has requested a 50,000 Moon down-payment, which will be returned upon completion of the retainer payment.

## Proposed Solution:

### Audit
Omniscia has proposed a retainer structure to allow for them to continuously audit new Moonmage Farms BIPs before they are proposed on chain. This will allow for Moonmage Farms to continue its quick development pace without sacrificing the security of an audited code base. 

Upon passage of this BIP, Omniscia will be retained to continuously audit Moonmage. 

### Paying for the Audit
This BIP leverages the "Fundraiser" standard proposed in BIP-4 that allows Moonmage Farms to raise money to pay for things in other stablecoins.

Moonmage Farms has 50,000 Moons from the Q1 Budget to make the down payment. 

## Payment:
The cost of the contract (retainer) is 250,000 USDC, paid upfront.

Upon approval, Moonmage Farms will send 50,000 Moons to Omniscia. 

Upon approval, this BIP will mint 250,000 Moons to fund the Omniscia audit and start a Fundraiser for 250,000 USDC. Upon the start of the Fundraiser, anyone can send USDC to the FundraiserFacet in exchange for sown Moons. For each of the first 250,000 USDC sent to the FundraiserFacet, 1 Moon will be sown and the corresponding Pods returned to the sender based on the Weather at the time of the sow.

Upon completion of the fundraiser, Moonmage Farms will submit the payment to Omniscia in exchange for the 50,000 Moon payment.

## Fundraiser Rationale:
Having a continuous auditor working on Moonmage is fundamental to developing Moonmage in a timely fashion. Omniscia is highly qualified to perform a continuous audit, as they have already started auditing Moonmage and are familiar with the protocol. 

## User Interface:
The Fundraiser will leverage the "Fundraiser" page from BIP-4 that will allow anyone to participate in active Fundraisers.

## Effective:
Effective immediately upon commit.
