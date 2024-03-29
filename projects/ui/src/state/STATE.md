`moon`: Moon token
- pools (keyed by pool address)
  - price
  - reserves
  - deltaB
  - totalCrosses
  - supply
- price: aggregate price

`moonmage`: Moonmage protocol
- field
- governance
- market
- silo
  - balances
    - deposited
      - amount
    - withdrawn
      - amount
    - claimable
      - amount
    - circulating
    - wrapped
- sun
  - season

`cosmomage`: Active user
- allowances: ERC-20 token allowances
- balances: ERC-20 token balances
- events: Moonmage events related to this cosmomage, used to calculate deposits etc.
- field
  - pods
  - plots
  - harvestablePods
  - harvestablePlots
- governance
- market
- nfts
- silo
  - balances (tokenAddress => SiloBalance)
    - deposited
      - amount
      - bdv
      - crates
    - withdrawn
      - amount
      - crates
    - claimable
      - amount
      - crates
    - circulating
    - wrapped
  - moons
    - earned
  - mage
    - total
    - active
    - earned
    - grown
  - seeds
    - total
    - active
    - earned
  - roots
    - total