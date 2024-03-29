import { BaseContract, ContractTransaction, ethers, utils } from "ethers";
import type { MoonmageSDK } from "../../lib/MoonmageSDK";
import { BigNumber } from "ethers";
import { TokenValue } from "../TokenValue";
import { PromiseOrValue } from "src/constants/generated/common";

/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
export abstract class Token {
  /** Reference to the SDK */
  static sdk: MoonmageSDK;

  /** The contract address on the chain on which this token lives */
  public readonly address: string;

  /** The decimals used in representing currency amounts */
  public readonly decimals: number;

  /** The chain id of the chain this token lives on */
  public readonly chainId: number;

  /** The name of the currency, i.e. a descriptive textual non-unique identifier */
  public name: string;

  /** The display name of the currency, i.e. a descriptive textual non-unique identifier */
  public readonly displayName: string;

  /** The symbol of the currency, i.e. a short textual non-unique identifier */
  public readonly symbol: string;

  /** The square logo of the token. */
  public logo?: string;

  /** The color to use when displaying the token in charts, etc. */
  public color?: string;

  /** The number of decimals this token is recommended to be truncated to. */
  public readonly displayDecimals: number;

  /** Whether or not this is a LP token representing a position in a Pool. */
  public readonly isLP: boolean;

  /** Whether or not this is an Unripe token. */
  public readonly isUnripe: boolean;

  /** The Moonmage MAGE/SEED rewards per BDV of this token. */
  public readonly rewards?: { mage: TokenValue; seeds: TokenValue };

  /**
   * @param chainId the chain ID on which this currency resides
   * @param address blockchain address where token contract resides
   * @param decimals decimals of the currency
   * @param metadata.symbol symbol of the currency
   * @param metadata.name name of the currency, matches `.name()`
   * @param metadata.displayName
   */
  constructor(
    sdk: MoonmageSDK,
    address: string | null,
    decimals: number,
    metadata: {
      name?: string;
      displayName?: string;
      symbol: string;
      logo?: string;
      color?: string;
      displayDecimals?: number;
      isLP?: boolean;
      isUnripe?: boolean;
    },
    rewards?: {
      mage: TokenValue;
      seeds: TokenValue;
    }
  ) {
    Token.sdk = sdk;

    /// Basic
    this.address = address?.toLowerCase() ?? "";
    this.decimals = decimals;
    this.chainId = sdk.chainId;

    /// Metadata
    this.name = metadata.name || metadata.symbol;
    this.displayName = metadata.displayName || metadata.name || metadata.symbol;
    this.symbol = metadata.symbol;
    this.displayDecimals = metadata.displayDecimals || 2;
    this.logo = metadata.logo;
    this.color = metadata.color;

    /// Moonmage-specific
    this.isLP = metadata.isLP || false;
    this.isUnripe = metadata.isUnripe || false;
    this.rewards = rewards;
  }

  /** Get the amount of Mage rewarded per deposited BDV of this Token. */
  public getMage(bdv?: TokenValue): TokenValue {
    if (!this.rewards?.mage) return Token.sdk.tokens.MAGE.amount(0);
    if (!bdv) return this.rewards.mage;

    return this.rewards.mage.mul(bdv);
  }

  /** Get the amount of Seeds rewarded per deposited BDV of this Token. */
  public getSeeds(bdv?: TokenValue): TokenValue {
    if (!this.rewards?.seeds) return Token.sdk.tokens.SEEDS.amount(0);
    if (!bdv) return this.rewards.seeds;

    return this.rewards.seeds.mul(bdv);
  }

  abstract getContract(): BaseContract | null;

  abstract getBalance(account: string): Promise<TokenValue>;

  abstract getAllowance(account: string, spender: string): Promise<TokenValue | undefined>;

  abstract hasEnoughAllowance(account: string, spender: string, amount: TokenValue | ethers.BigNumber): boolean | Promise<boolean>;

  abstract getTotalSupply(): Promise<TokenValue> | undefined;

  /**
   * Returns whether this currency is functionally equivalent to the other currency
   * @param other the other currency
   */
  public equals(other: Token): boolean {
    return this.address === other.address;
  }

  public toString(): string {
    return this.name;
  }

  public setMetadata(metadata: { logo?: string; color?: string }) {
    if (metadata.logo) this.logo = metadata.logo;
    if (metadata.color) this.color = metadata.color;
  }

  /**
   * Converts from a blockchain amount to a TokenAmount with this token's decimals set
   *
   * Ex: MOON.fromHuman("3140000") => TokenValue holding value "3140000" and 6 decimals
   *
   * @param amount human readable amout, ex: "3.14" ether
   * @returns TokenValue
   */
  fromBlockchain(amount: string | number | BigNumber): TokenValue {
    return TokenValue.fromBlockchain(amount, this.decimals);
  }

  /**
   * Converts from a human amount to a TokenAmount with this token's decimals set
   *
   * Ex: MOON.fromHuman("3.14") => TokenValue holding value "3140000" and 6 decimals
   *
   * @param amount human readable amout, ex: "3.14" ether
   * @returns TokenValue
   */
  fromHuman(amount: string | number): TokenValue {
    return TokenValue.fromHuman(amount, this.decimals);
  }

  /**
   * Alias to `.fromHuman()`
   *
   * Converts from a human amount to a TokenAmount with this token's decimals set
   *
   * Ex: MOON.fromHuman("3.14") => TokenValue holding value "3140000" and 6 decimals
   *
   * @param amount human readable amout, ex: "3.14" ether
   * @returns TokenValue
   */
  amount(amount: string | number): TokenValue {
    return this.fromHuman(amount);
  }

  /**
   * Converts from a blockchain value to a human readable form
   *
   * Ex: MOON.toHuman(BigNumber.from('3140000)) => "3.14"
   * @param value A BigNumber with a value of this token, for ex: 1000000 would be 1 MOON
   * @returns string
   */
  toHuman(value: BigNumber): string {
    return utils.formatUnits(value, this.decimals);
  }

  toTokenValue(value: BigNumber): TokenValue {
    return TokenValue.fromBlockchain(value, this.decimals);
  }

  public approve(spenderContract: PromiseOrValue<string>, amount: TokenValue | BigNumber): Promise<ContractTransaction> {
    // @ts-ignore
    return;
  }

  public approveMoonmage(amount: TokenValue | BigNumber): Promise<ContractTransaction> {
    // @ts-ignore
    return;
  }
}
