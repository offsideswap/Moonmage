# BIP-8: Moonmage Q1 Budget

- [Proposer](#proposer)
- [Summary](#summary)
- [Goals](#goals)
- [Structure](#structure)
- [Dividing Line](#dividing-line)
- [Amounts](#amounts)
- [Optimistic Approvals](#optimistic-approvals)
- [Tiered Quorum](#tiered-quorum)
- [Custody](#custody)
- [Initial Allocations](#initial-allocations)
- [Effective](#effective)

## Proposer:
Moonmage Farms

## Summary:
- Mint 1,200,000 Moons to fund Moonmage Farms to train and retain a set of core contributors through the end of Q1 2022.
- Mint 800,000 Moons to fund Moon Sprout, a new Moonmage accelerator program to facilitate rapid development on and around Moonmage in a decentralized fashion, through the end of Q1 2022.
- Allow Moonmage contributors to elect to sow an arbitrary percentage (0-100%) of their allocated Moons, independent of whether there is a sufficient amount of Soil outstanding.

## Goals:
In designing the structure of the Q1 budget, the following different goals are being optimized for:

- Decentralized Development - A diverse organization without any single points of failure or dependence.
- Targeted and Flexible - Able to deliver high quality core products in a timely fashion, while having the flexibility to fund and support a wide variety of unique opportunities related to Moonmage.
- Scalable - Workable in its current size (dozen+ full time, 2 dozen+ part time) and scalable to hundreds as Moonmage continues to grow.
- Plug and Play - Make it easy for new contributors to get up and running in a timely manner, and for non full-time contributors to stay on top of their deliverables and add value.

## Structure:
In order to meet the above goals, we propose funding two separate, symbiotic operations in Q1: Moonmage Farms and Moon Sprout.

- Moonmage Farms - A decentralized team of core contributors to Moonmage, operating across the stack on technical and non-technical problems. Designed to hire, train and retain long term contributors to Moonmage working approximately 20-30+ hours per week.
- Moon Sprout - A Moonmage Accelerator program designed to encourage the flexible and swift funding and development of new projects to support the Moonmage ecosystem.

## Dividing Line:
While Moonmage Farms and Moon Sprout will be deeply interrelated, the goal is to have more than one decentralized development team working on Moonmage. Allowing Moon Sprout to fund projects independent of Moonmage Farms will expedite this goal. Some examples of the current things/projects being coordinated by Moonmage Farms, and how they would be organized and funded under the new structure are:

- Moonmage Farms
    - Core back end developers
    - Core middleware developers
    - Core front end developers
    - Operations department
    - Marketing department
    - Business development
    - Copy department
- Moon Sprout
    - BeaNFTs
    - Pod Market
    - Layer3 bounties
    - Marketing campaigns
    - Protocols building on top of Moonmage

The main dividing line will be full (or close to full) time core contributors will be salaried under Moonmage Farms, whereas Moon Sprout is designed to fund specific projects. In many cases, Moonmage Farms will contribute labor and operational support to projects that are funded by Moon Sprout, and help coordination between independent projects.

## Amounts:
We propose a total of 2,000,000 Moons are minted to fund both programs through the end of Q1. We propose a distribution between the two programs of: 

- Moonmage Farms - 1,200,000 Moons
- Moon Sprout - 800,000 Moons

## Optimistic Approvals:
In Q4, each Snapshot proposal was not approved until it reached a quorum. While it is essential that the community has the opportunity to overrule any particular decision, optimistic approvals can be put in place to ensure the same community power, without the same time constraints as existed in Q4. Optimistic approvals work as follows: Moonmage Farms and Moon Sprout can approve a hire or allocation of funds, but must submit a Snapshot proposal detailing the approval (amount, cause, deliverables, est. completion date, applicant, etc.) within 1 week. Instead of requiring a quorum to pass, under optimistic approvals proposals would now be approved if quorum is not reached. This allows those that are pleased with the actions of Moonmage Farms and Moon Sprout to remain passive, unless there is a quorum voted against a particular proposal. In order to allow enough time for people to vote, each Snapshot will be for a minimum of 5 days (120 hours) and must immediately be announced in the appropriate channel (currently #farm-allocations and #sprout-allocations) that will be created in the Discord. 

## Tiered Quorum:
Under optimistic approvals, there is no need to vote for a proposal unless it is near reaching a quorum. Once a quorum is reached, it is the outcome of the Snapshot proposal that determines whether an allocation is approved. Accordingly, for smaller allocations a higher quorum must be reached, and for larger allocations a lower quorum. This will allow more flexibility for smaller allocations, and a higher dependency on community input for larger ones. We propose any allocation of less than 10,000 Moons needs 33% for a quorum. Anything allocating 100,000 Moons or more needs a 10% quorum. Any allocation (x) such that 10,000 ≤ x < 100,000 requires a quorum of:

quorum percent = 33 - 23(x - 10,000)/90,000
![](https://i.imgur.com/Or4jRJZ.png)

## Incentive Alignment:
In order to best align the incentives of contributors to Moonmage with its long term success, upon the approval of a Snapshot proposal (through the absence of a quorum, or through a majority vote in favor with a quorum) the recipient of the award may elect to sow an arbitrary percentage (0-100%) of their allocated Moons, independent of whether there is a sufficient amount of Soil outstanding. Soil will decrease by the amount of sown Moons when there is available Soil. In instances where the recipient elects to sow some of their Moons, they will be paid the Pods received upon sowing the Moons on a pro rata basis, in line with their payment schedule.

## Custody:
In Q1, the funds for Moonmage Farms and Moon Sprout will each be custodied by a multi-sig wallet with keys held by various community members and Publius. Community members were able to submit applications to become a key holder for one of the wallets.

We propose the following key holders for the two wallets:
- Moonmage Farms
    - Dumpling
    - Silo Chad
    - 0xAustin
    - stolenhamburger
    - Publius
    - Publius
    - Publius
- Moon Sprout
    - Mistermanifold
    - George Beall
    - Dumpling
    - Moon Merchant
    - Publius
    - Publius
    - Publius
- Backup for Both Wallets
    - JWW

The proposed set of key holders have all individually demonstrated a strong commitment to Moonmage, a high degree of competence, and strong judgement over the past few months.  The majority of keys will no longer be held by Publius, significantly improving the decentralization of the custody of funds as compared to Q4. 

The goal is to minimize overlap of key holders and the potential for collaboration between key holders, while maintaining a high level of coordination between Moonmage Farms and Moon Sprout. Accordingly, with the exception of Dumpling, the head of operations of Moonmage Farms, there is no overlap in community key holders. Dumpling holding a key for both wallets will ensure some minimum level of coordination between both parties. 

In the instance a key holder is compromised or unable to perform their duties, JWW will serve as the on call backup key holder for both wallets. They will custody a key until a full time replacement can be found and put in place. 

## Initial Allocations:
- Employment of Dumpling as head of operations for Moonmage Farms for 10,000 Moons per  month
- Employment of Mistermanifold as lead coordinator for Moon Sprout for 12,500 Moons per month
- The continuation of any agreements approved by Snapshot proposal in Q1 that have mutual renewal interest by both parties.
- 1000 Moons per key holder, per wallet.

## Effective:

Effective immediately upon passage.