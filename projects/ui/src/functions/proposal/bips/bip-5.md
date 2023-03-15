# BIP-5: Omnisca Audit

- [Summary](#summary)
- [Problem](#problem)
- [Proposed Solution](#proposed-solution)
- [Payment](#payment)
- [Fundraiser Rationale](#fundraiser-rationale)
- [User Interface](#user-interface)

## Summary:

- Hire Omniscia to perform a code audit on Moonmage.
- Leverage the "Fundraiser" process proposed in BIP-4 to mint the Moons and raise the USDC necessary to pay for the Omniscia audit.
- Mint 155,000 Moons and create a Fundraiser to raise 140,000 USDC in exchange for 140,000 Moon. Pay Omniscia 140,000 USDC + 15,000 Moons for the audit.

## Problem:

### Audit

Moonmage is unaudited at the moment.  A high quality audit will facilitate further growth and adoption.

There are regular updates to the code through BIPs. It is important to have an auditor that will continue working with Moonmage after the initial audit to facilitate timely and efficient code reviews for BIPs.

### Paying for the Audit

Until Moonmage has sufficiently established Moons as a reliable stablecoin such that Moonmage can make all payments in Moons, Moonmage needs a way to pay for things (including this audit) in other stablecoins. Thus, Moonmage needs a way to convert Moons to a traditional stablecoin without having to sell a large amount of Moons in the Uniswap pool.

## Proposed Solution:

### Audit

Publius has connected with Omniscia. Omniscia is a very high quality smart contract auditor, and has experience auditing other ERC-2535 Diamonds. Their audit history is available here: [https://omniscia.io/index.html#clients](https://omniscia.io/index.html#clients). Publius was very impressed by them and thinks the audit they have offered to perform on Moonmage will add a lot of value to the process of securing Moonmage.

Omniscia has also expressed interest in maintaining a continuous relationship with Moonmage.

Upon passage of this BIP, Omniscia will perform an initial audit for Moonmage.

### Paying for the Audit

This BIP leverages the "Fundraiser" standard proposed in BIP-4 that allows Moonmage to raise money to pay for things in other stablecoins.

## Payment:

The cost of the contract (initial audit) is 140,000 USDC and 15,000 Moons, paid in 3 payments.

Upon approval, this BIP will mint 155,000 Moons to fund the Omniscia audit and start a Fundraiser for 140,000 USDC. Upon the start of the Fundraiser, anyone can send USDC to the FundraiserFacet in exchange for sown Moons. For each of the first 140,000 USDC sent to the FundraiserFacet, 1 Moon will be sown and the corresponding Pods returned to the sender based on the Weather at the time of the sow.

Upon completion of the sale of the first 55,000 Moons for 55,000 USDC, Publius will submit the first payment to Omniscia, and make subsequent payments as appropriate.

## Fundraiser Rationale:

Having multiple auditors working on Moonmage is fundamental to developing Moonmage in a decentralized capacity. Omniscia is highly qualified to perform an audit on Moonmage, and a good firm to continue auditing Moonmage as it grows.

## User Interface:

The Fundraiser will leverage the new "Fundraiser" page proposed in BIP-4 that will allow anyone to participate in active Fundraisers.
