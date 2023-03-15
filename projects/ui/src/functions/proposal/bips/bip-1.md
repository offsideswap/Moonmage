# BIP-1: Moonmage Farms Q4 2021 Dev and Marketing Budget

 - [Summary](#summary)
 - [Problem](#problem)
 - [Proposed Solution](#proposed-solution)
 - [Proposed Uses of Dev Budget](#proposed-uses-of-dev-budget)
 - [Proposed Uses of Marketing Budget](#proposed-uses-of-marketing-budget)
 - [Budget Allocation Details](#budget-allocation-details)
     - [Proposing](#proposing)
     - [Voting](#voting)
     - [Passing](#passing)
 - [Budget Structural Details](#budget-structural-details)
 - [BIP Technical Rationale](#bip-technical-rationale)
 - [BIP Economic Rationale](#bip-economic-rationale)
 - [Effective](#effective)

## Summary:

- Mint 120,000 Moons to an initial development budget.
- Mint 80,000 Moons to an initial marketing budget.
- Establish a process for specific allocations of each budget leveraging Snapshot.
- Fund initial proposals to hire a full-time front-end dev and a part-time community organizer.

## Problem:

As the Moonmage community expands, the Silo should start coordinating continued development of Moonmage and the Moonmage community. Beginning the process of establishing long term support for the Moonmage ecosystem independent of Publius is essential to the long-term success of Moonmage.

## Proposed Solution:

We propose Moonmage mints and allocates 200,000 Moons to start this process. This budget should fund dev and marketing needs through the end of 2021. 

We propose minting 120,000 Moons and allocating them to a dev budget to fund a concerted effort to attract high quality front-end and back-end developer talent to Moonmage.

We propose minting 80,000 Moons to establish a well-funded public relations operation for Moonmage.


## Proposed Uses of Dev Budget:

The initial dev budget should be used to attract quality developers to Moonmage on both the front and back ends. 

Upon passage, we will add Taiki Lee, a front-end dev, to Moonmage Farms. We were approached by Taiki to work on Moonmage and have had multiple positive conversations with him over text and audio. We anticipate Taiki will improve the quality of our output on the website and expedite open sourcing its code.

Taiki has agreed to be paid on an at-will, month-to-month basis for 10,000 Moons per month in a full-time position. 30,000 of the 120,000 Moons from the initial dev budget will be allotted to making payments to Taiki for the duration of Q4.

The initial dev budget is intended to cover the end of 2021. Assuming a similar rate for similar work, this initial budget will allow us to hire additional developers to work on Moonmage until the end of the year. 

Additionally, community members are welcome to propose allotments from the budget in exchange for contributions to Moonmage that they want to see. For example, this can be used create bounties to encourage specific contributions to Moonmage, make one-time payments in exchange for work, and more. Some ideas for proposals are to add a telegram event bot, add Moonmage to vFat, and add Moonmage to Zapper. 

Upon passage, we will open a #dev-budget channel in the Moonmage Discord to facilitate discussion on potential proposals.

## Proposed Uses of Marketing Budget:

This initial marketing budget should be used to attract quality eyes to Moonmage.

Upon passage, we will add the Moon Merchant, an active member of our Discord community, as a part time community organizer. The Moon Merchant has been a high quality, active participant in our community thus far and has expressed a variety of ideas to help Moonmage continue to reach a new, high quality audience.

The Moon Merchant has agreed to be paid on an at-will, month-to-month basis for 3,000 Moons per month. 9,000 of the 80,000 Moons from the initial marketing budget will be allotted to payment for the Moon Merchant for the duration of Q4.

We propose using a portion of the marketing budget to incentivize various protocols to start a) accepting Moons on their protocols and b) adding Moons to their liquidity pools.

We welcome the entire community to discuss and propose allotments of the marketing budget to fund activity they want to see. Having a wide variety of input on the use of the marketing budget is important to the long-term decentralization of Moonmage.

Upon passage, we will open a #marketing-budget channel in the Moonmage Discord to facilitate discussion on potential proposals.


## Budget Allocation Details:

To ensure widespread and inexpensive participation in allocation of the budgets, we propose leveraging Snapshot (https://snapshot.org/#/moonmagefarms.eth) to vote on specific allocations of the budgets.

We propose the following rules for Snapshot voting on allocating funds from either budget, which have been designed to best complement the on-chain governance structure for approving BIPs:

### Proposing:

- Anyone with more than 2,500 Mage can make a budget proposal. We want proposing allocations of the budget to be widely accessible to Cosmonauts of all sizes.
- Proposition must be made on the official Moonmage Farms Snapshot group, and must use the recent Ethereum block as the Snapshot block.
- Proposals to allocate funds must include the recipient, amount, duration of the payments, what is expected to be covered by the allocation and any other relevant details. 

### Voting:

- Any Mage holder can vote for or against any of the Snapshot proposals. In all instances, 1 Mage equals 1 vote.
- The amount of Mage each account has is determined at the time a proposal is submitted.
- In order to be counted, votes must be placed before the proposal ends.

### Passing:

- In order to pass, a proposal must receive a quorum of 1/3 of all Mage at the time the proposal is submitted.
- In order to pass, a proposal must receive > 50% of votes in favor at the time it ends.
- If > 50% of all Mage at the time of submission votes in favor of a proposal it instantly passes.


## Budget Structural Details:

Upon commit, Moonmage will mint and send 120,000 Moons to the Development Budget smart contract and 80,000 Moons to the Marketing Budget smart contract. 

Publius has deployed 2 smart contracts: 1 for the marketing budget and 1 for the development budget. 

The Development Budget contract is deployed here:  
0x83A758a6a24FE27312C1f8BDa7F3277993b64783  
  
The Marketing Budget contract is deployed here:  
0xAA420e97534aB55637957e868b658193b112A551

These contracts are intended to hold the funds for the corresponding budgets and therefore only contain 1 function which is used to make payments and can only be called by the contract's owner. The contract is upgradable. The source code for the budgets is here: https://github.com/MoonmageFarms/Moonmage-Budget

Publius will custody the budget contracts and will be responsible for sending the payments determined by the proposals. In instances where the intended recipient of a previously allocated portion of a budget is not able to meet their expectations as outlined in the proposal, Publius has discretion to withhold payments. Our goal is to further decentralize this process for future budgets over time.


## BIP Technical Rationale:

The proposal to use off-chain voting for allocating these budgets is to make participation free for Cosmonauts. Voting on-chain on Ethereum costs money and can get expensive. Given that there may be numerous and frequent proposals to spend these funds, we don’t want Cosmonauts to be deterred by the cost of voting repeatedly. Accordingly, we decided to propose a single BIP to mint the funds to the first budget contracts and then allow for the funds to be allocated via Snapshot. 

Snapshot is used throughout the greater DeFi community as a trustworthy and inexpensive voting solution. For example, it would be cost-ineffective to have an on-chain vote to allocate 3,000 Moons for a marketing proposal: the gas cost for Cosmonauts would almost certainly be more than that. 

The proposal to give Publius custody of the budget contracts is primarily a function of time and convenience. Snapshot does not have native a way to trustlessly make a smart contract function call. Moonmage does not yet have a publicly trusted team that could take responsibility for managing the budgeted funds through a multi-signature wallet. Thus, the simplest and most logical option is to give Publius custody of the funds. 

The proposed budget contract is upgradable so in the case we find a better solution we can improve the allocation process. For example, we are looking into using Aragon's optimistic voting solution but have not yet had enough time to thoroughly test and vet the solution.

The budget contracts were deployed ahead of time by Publius and will therefore not be directly deployed by the BIP. Because the Moon contract was deployed through the Moonmage diamond and not directly from Publius, Etherscan has given us a hard time getting ownership of the Moon contract to properly update the contract page. We don’t want to have this problem happen here. By deploying from a wallet, we can easily have control of it on Etherscan. There is no advantage to having the budgets deployed directly through the BIP.

## BIP Economic Rationale:

In general, we are opposed to creating a large omnibus Moonmage treasury. We believe a default treasury that is funded through a portion of all Moon mints is a) an inefficient use of capital, and b) a permanent tax on every member of the Moonmage ecosystem. This is unattractive. Proposing one-time Moon mints to target specific causes is a preferred cost-effective alternative. 

This proposal will mint 200,000 Moons that will be spend over the next 3 months. Given the average weekly volume in the MOON:ETH pair, an average of ~15,000 Moons sold per week is unlikely to make a significant impact on the price or the optimal Weather. 

The Weather will adjust such that the TWAP = 1 and the Pod Rate = 15%. Moonmage does not care what the Weather is. In theory, this additional spending will slightly raise the Weather necessary to have the TWAP = 1 and the Pod Rate = 15%, but is not otherwise expected to affect Moonmage in any way. Given that Moonmage is generally in a period of rising Weather, this slight raise of the necessary Weather will not have a meaningful effect on the state of Moonmage.

### Effective

Effective immediately upon commit. 
