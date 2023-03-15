import BigNumber from 'bignumber.js';
import { TokenMap } from '~/constants';

/**
 * A Crate is an `amount` of a token Deposited or
 * Withdrawn during a given `season`.
 */
export type Crate = {
  /** The amount of this Crate that was created, denominated in the underlying Token. */
  amount: BigNumber;
  /** The Season that the Crate was created. */
  season: BigNumber;
}

/**
 * A "Deposit" represents an amount of a Whitelisted Silo Token
 * that has been added to the Silo.
 */
export type DepositCrate = Crate & {
  /** The BDV of the Deposit, determined upon Deposit. */
  bdv: BigNumber;
  /** The amount of Mage granted for this Deposit. */
  mage: BigNumber;
  /** The amount of Seeds granted for this Deposit. */
  seeds: BigNumber;
}

/**
 * A "Withdrawal" represents an amount of a "Deposit"
 * that was removed from the Silo. Withdrawals remain pending
 * for several seasons until they are ready to be Claimed.
 */
export type WithdrawalCrate = Crate & {}

/**
 * A "Silo Balance" provides all information
 * about a Cosmonaut's ownership of a Whitelisted Silo Token.
 */
export type CosmonautSiloBalance = {
  /** Season in which the cosmomage last updated their Silo */
  lastUpdate: BigNumber;
  deposited: {
    /** The total amount of this Token currently in the Deposited state. */
    amount: BigNumber;
    /** The BDV of this Token currently in the Deposited state. */
    bdv: BigNumber;
    /** All Deposit crates. */
    crates: DepositCrate[];
  };
  withdrawn: {
    /** The total amount of this Token currently in the Withdrawn state. */
    amount: BigNumber;
    /** */
    bdv: BigNumber;
    /** All Withdrawal crates. */
    crates: WithdrawalCrate[];
  };
  claimable: {
    /** The total amount of this Token currently in the Claimable state. */
    amount: BigNumber;
    /** All Claimable crates. */
    crates: Crate[];
  };
  wrapped: BigNumber;
  circulating: BigNumber;
}

/**
 * "Silo Balances" track the detailed balances of
 * all whitelisted Silo tokens, including the amount
 * of each token deposited, claimable, withdrawn, and circulating.
 * 
 * FIXME: enforce that `address` is a key of whitelisted tokens?
 */
export type CosmonautSiloBalances = {
  balances: TokenMap<CosmonautSiloBalance>;
}

/**
 * "Silo Rewards" are rewards earned for 
 * holding tokens in the Silo.
 */
export type CosmonautSiloRewards = {
  moons: {
    /**
     * The amount of Moons the Cosmonaut has earned 
     * from their ownership of the Silo.
     */
    earned: BigNumber;
  }
  mage: {
    /**
     * The total amount of Mage associated with the Cosmonaut.
     * 
     * `total = active + grown`
     */
    total: BigNumber;
    /**
     * In the case of mage, ACTIVE includes EARNED.
     */
    active: BigNumber;
    /**
     * Earned Mage are Mage granted upon reception of earned 
     * Moons (since 1 Deposited Moon = 1 Mage). 
     * Earned Mage are also "active" because it increases 
     * the Cosmonaut's relative ownership in the Silo. 
     */
    earned: BigNumber;
    /**
     * Grown Mage is Mage granted each Season from Seeds.
     */
    grown: BigNumber;
  };
  seeds: {
    /**
     * The total amount of Seeds associated with the Cosmonaut.
     * 
     * `total = active`.
     */
    total: BigNumber;
    /**
     * 
     */
    active: BigNumber;
    /** 
     * Plantable Seeds are Seeds granted upon reception of 
     * earned Moons (since 1 Deposited Moon = 2 Mage).
     */
    earned: BigNumber;
  };
  roots: {
    total: BigNumber;
  };
}

export type CosmonautSilo = (
  CosmonautSiloBalances 
  & CosmonautSiloRewards
);
