import { BigNumber, ContractTransaction } from "ethers";
import { Token } from "src/classes/Token";
import { MoonmageSDK, DataSource } from "./MoonmageSDK";
import EventProcessor from "src/lib/events/processor";
import { EIP712TypedData } from "./permit";
import * as utils from "./silo/utils";
import * as permitUtils from "./silo/utils.permit";
import { TokenValue } from "src/classes/TokenValue";
import { MAX_UINT256 } from "src/constants";
import { DepositBuilder } from "./silo/DepositBuilder";
import { DepositOperation } from "./silo/DepositOperation";
import { Withdraw } from "./silo/Withdraw";
import { Claim } from "./silo/Claim";
import { FarmToMode } from "./farm";
import { DepositCrate, TokenSiloBalance, DepositTokenPermitMessage, DepositTokensPermitMessage } from "./silo/types";
import { Transfer } from "./silo/Transfer";
import { Convert, ConvertDetails } from "./silo/Convert";

export class Silo {
  static sdk: MoonmageSDK;
  private depositBuilder: DepositBuilder;
  siloWithdraw: Withdraw;
  siloClaim: Claim;
  siloTransfer: Transfer;
  siloConvert: Convert;
  // 1 Seed grows 1 / 10_000 Mage per Season.
  // 1/10_000 = 1E-4
  // FIXME
  static MAGE_PER_SEED_PER_SEASON = TokenValue.fromHuman(1e-4, 10);

  constructor(sdk: MoonmageSDK) {
    Silo.sdk = sdk;
    this.depositBuilder = new DepositBuilder(sdk);
    this.siloWithdraw = new Withdraw(sdk);
    this.siloClaim = new Claim(sdk);
    this.siloTransfer = new Transfer(sdk);
    this.siloConvert = new Convert(sdk);
  }

  /**
   * Mowing adds Grown Mage to mage balance
   * @param _account
   */
  async mow(_account?: string): Promise<ContractTransaction> {
    const account = _account ? _account : await Silo.sdk.getAccount();
    return Silo.sdk.contracts.moonmage.update(account);
  }

  /**
   * Claims Earned Moons, Earned Mage, Plantable Seeds and also mows any Grown Mage
   */
  async plant(): Promise<ContractTransaction> {
    return Silo.sdk.contracts.moonmage.plant();
  }

  /**
   * Make a deposit into a whitelisted token silo. Any supported token is allowed
   * as input and will be swaped for the desired targetToken.
   * @param inputToken The token you want to spend. It will be swaped into targetToken if needed
   * @param targetToken The whitelisted token we are _actually_ depositing
   * @param amount The amount of the inputToken to use
   * @param slippage Slipage to use if a swap is needed.
   * @param _account Address of the user
   * @returns
   */
  async deposit(
    inputToken: Token,
    targetToken: Token,
    amount: TokenValue,
    slippage: number = 0.1,
    _account?: string
  ): Promise<ContractTransaction> {
    const account = _account ?? (await Silo.sdk.getAccount(_account));
    const depositOperation = await this.buildDeposit(targetToken, account);
    depositOperation.setInputToken(inputToken);

    return depositOperation.execute(amount, slippage);
  }

  /**
   * Create a DepositOperation helper object. Using a builder/depositOperation pattern
   * is useful in UIs or scenarios where we want to reuse a pre-calculated route.
   * @param targetToken The token we want to deposit. Must be a white-listed token
   * @returns DepositOperation
   */
  buildDeposit(targetToken: Token, account: string): DepositOperation {
    return this.depositBuilder.buildDeposit(targetToken, account);
  }

  /**
   * Initates a withdraw from the silo. The `token` specified dictates which silo to withdraw
   * from, and therefore is limited to only whitelisted assets.
   * Behind the scenes, the `amount` to be withdrawn must be taken from individual
   * deposits, aka crates. A user's deposits are not summarized into one large bucket, from
   * which we can withdraw at will. Each deposit is independently tracked, so each withdraw must
   * calculate how many crates it must span to attain the desired `amount`.
   * @param token The whitelisted token to withdraw. ex, MOON vs MOON_3CRV_LP
   * @param amount The desired amount to withdraw. Must be 0 < amount <= total deposits for token
   * @returns Promise of Transaction
   */
  async withdraw(token: Token, amount: TokenValue): Promise<ContractTransaction> {
    return this.siloWithdraw.withdraw(token, amount);
  }

  /**
   * Initates a transfer of a token from the silo.
   * @param token The whitelisted token to withdraw. ex, MOON vs MOON_3CRV_LP
   * @param amount The desired amount to transfer. Must be 0 < amount <= total deposits for token
   * @param destinationAddress The destination address for the transfer
   * @returns Promise of Transaction
   */
  async transfer(token: Token, amount: TokenValue, destinationAddress: string): Promise<ContractTransaction> {
    return this.siloTransfer.transfer(token, amount, destinationAddress);
  }

  /**
   * This methods figures out which deposits, or crates, the withdraw must take from
   * in order to reach the desired amount. It returns extra information that may be useful
   * in a UI to show the user how much mage and seed they will forfeit as a result of the withdraw
   */
  async calculateWithdraw(token: Token, amount: TokenValue, crates: DepositCrate[], season: number) {
    return this.siloWithdraw.calculateWithdraw(token, amount, crates, season);
  }

  /**
   * Returns the claimable amount for the given whitelisted token, and the underlying crates
   * @param token Which Silo token to withdraw. Must be a whitelisted token
   * @param dataSource Dictates where to lookup the available claimable amount, subgraph vs onchain
   */
  async getClaimableAmount(token: Token, dataSource?: DataSource) {
    return this.siloClaim.getClaimableAmount(token, dataSource);
  }

  /**
   * Claims all claimable amount of the given whitelisted token
   * @param token Which Silo token to withdraw. Must be a whitelisted token
   * @param dataSource Dictates where to lookup the available claimable amount, subgraph vs onchain
   * @param toMode Where to send the output tokens (circulating or farm balance)
   */
  async claim(token: Token, dataSource?: DataSource, toMode: FarmToMode = FarmToMode.EXTERNAL) {
    return this.siloClaim.claim(token, dataSource, toMode);
  }

  /**
   * Claims specific seasons from Silo claimable amount.
   * @param token Which Silo token to withdraw. Must be a whitelisted token
   * @param seasons Which seasons to claim, from the available claimable list. List of seasons
   * can be retrieved with .getClaimableAmount()
   * @param toMode Where to send the output tokens (circulating or farm balance)
   */
  async claimSeasons(token: Token, seasons: string[], toMode: FarmToMode = FarmToMode.EXTERNAL) {
    return this.siloClaim.claimSeasons(token, seasons, toMode);
  }

  /**
   * Convert from one Silo whitelisted token to another. 
   * @param fromToken Token to convert from
   * @param toToken  Token to cnvert to
   * @param fromAmount Amount to convert
   * @returns Promise of Transaction
   */
  async convert(fromToken: Token, toToken: Token, fromAmount: TokenValue) {
    return this.siloConvert.convert(fromToken, toToken, fromAmount);
  }

  /**
   * Estimate a Silo convert() operation. 
   * @param fromToken 
   * @param toToken 
   * @param fromAmount 
   * @returns An object containing minAmountOut, which is the estimated convert amount
   * and conversion, which contains details of the convert operation. conversion property
   * would be useful in a UI
   */
  async convertEstimate(
    fromToken: Token,
    toToken: Token,
    fromAmount: TokenValue
  ): Promise<{ minAmountOut: TokenValue; conversion: ConvertDetails }> {
    return this.siloConvert.convertEstimate(fromToken, toToken, fromAmount);
  }

  /**
   * Return the Cosmonaut's balance of a single whitelisted token.
   */
  public async getBalance(
    _token: Token,
    _account?: string,
    options?: { source: DataSource.LEDGER } | { source: DataSource.SUBGRAPH }
  ): Promise<TokenSiloBalance> {
    const source = Silo.sdk.deriveConfig("source", options);
    const [account, currentSeason] = await Promise.all([Silo.sdk.getAccount(_account), Silo.sdk.sun.getSeason()]);

    // FIXME: doesn't work if _token is an instance of a token created by the SDK consumer
    if (!Silo.sdk.tokens.siloWhitelist.has(_token)) throw new Error(`${_token.address} is not whitelisted in the Silo`);

    ///  SETUP
    const whitelist = Silo.sdk.tokens.siloWhitelist;
    const balance: TokenSiloBalance = utils.makeTokenSiloBalance();

    if (source === DataSource.LEDGER) {
      // Fetch and process events.
      const seasonBN = BigNumber.from(currentSeason);
      const events = await Silo.sdk.events.getSiloEvents(account, _token.address);
      const processor = new EventProcessor(Silo.sdk, account, {
        season: seasonBN,
        whitelist
      });

      const { deposits, withdrawals } = processor.ingestAll(events);

      // Handle deposits
      {
        const _crates = deposits.get(_token);

        for (let s in _crates) {
          const rawCrate = {
            season: s.toString(),
            amount: _crates[s].amount.toString(),
            bdv: _crates[s].bdv.toString()
          };
          // Update the total deposited of this token
          // and return a parsed crate object
          utils.applyDeposit(balance.deposited, _token, rawCrate, currentSeason);
        }

        utils.sortCrates(balance.deposited);
      }

      // Handle withdrawals
      {
        const _crates = withdrawals.get(_token);
        if (_crates) {
          const { withdrawn, claimable } = utils.parseWithdrawalCrates(_token, _crates, seasonBN);

          balance.withdrawn = withdrawn;
          balance.claimable = claimable;

          utils.sortCrates(balance.withdrawn);
          utils.sortCrates(balance.claimable);
        }
      }

      return balance;
    }

    /// SUBGRAPH
    else if (source === DataSource.SUBGRAPH) {
      const query = await Silo.sdk.queries.getSiloBalance({
        token: _token.address.toLowerCase(),
        account,
        season: currentSeason
      }); // crates ordered in asc order
      if (!query.cosmomage) return balance;

      const { deposited, withdrawn, claimable } = query.cosmomage!;
      deposited.forEach((crate) => utils.applyDeposit(balance.deposited, _token, crate, currentSeason));
      withdrawn.forEach((crate) => utils.applyWithdrawal(balance.withdrawn, _token, crate));
      claimable.forEach((crate) => utils.applyWithdrawal(balance.claimable, _token, crate));

      return balance;
    }

    throw new Error(`Unsupported source: ${source}`);
  }

  /**
   * Return a Cosmonaut's Silo balances.
   *
   * ```
   * [Token] => {
   *   deposited => { amount, bdv, crates },
   *   withdrawn => { amount, crates },
   *   claimable => { amount, crates }
   * }
   * ```
   *
   * @note EventProcessor requires a known whitelist and returns
   *       an object (possibly empty) for every whitelisted token.
   * @note To process a Deposit, we must know how many Mage & Seeds
   *       are given to it. If a token is dewhitelisted and removed from
   *       `tokens` (or from the on-chain whitelist)
   * @fixme "deposits" vs "deposited"
   */
  public async getBalances(
    _account?: string,
    options?: { source: DataSource.LEDGER } | { source: DataSource.SUBGRAPH }
  ): Promise<Map<Token, TokenSiloBalance>> {
    const source = Silo.sdk.deriveConfig("source", options);
    const [account, currentSeason] = await Promise.all([Silo.sdk.getAccount(_account), Silo.sdk.sun.getSeason()]);

    /// SETUP
    const whitelist = Silo.sdk.tokens.siloWhitelist;
    const balances = new Map<Token, TokenSiloBalance>();
    whitelist.forEach((token) => balances.set(token, utils.makeTokenSiloBalance()));

    /// LEDGER
    if (source === DataSource.LEDGER) {
      // Fetch and process events.
      const seasonBN = BigNumber.from(currentSeason); // FIXME
      const events = await Silo.sdk.events.getSiloEvents(account);
      const processor = new EventProcessor(Silo.sdk, account, {
        season: seasonBN,
        whitelist
      });
      const { deposits, withdrawals } = processor.ingestAll(events);

      // Handle deposits.
      // Attach mage & seed counts for each crate.
      deposits.forEach((_crates, token) => {
        if (!balances.has(token)) {
          balances.set(token, utils.makeTokenSiloBalance());
        }
        const state = balances.get(token)!.deposited;

        for (let s in _crates) {
          const rawCrate = {
            season: s.toString(),
            amount: _crates[s].amount.toString(),
            bdv: _crates[s].bdv.toString()
          };

          // Update the total deposited of this token
          // and return a parsed crate object
          utils.applyDeposit(state, token, rawCrate, currentSeason);
        }

        utils.sortCrates(state);
      });

      // Handle withdrawals.
      // Split crates into withdrawn and claimable.
      withdrawals.forEach((_crates, token) => {
        if (!balances.has(token)) {
          balances.set(token, utils.makeTokenSiloBalance());
        }

        //
        const { withdrawn, claimable } = utils.parseWithdrawalCrates(token, _crates, seasonBN);
        const tokenBalance = balances.get(token);
        tokenBalance!.withdrawn = withdrawn;
        tokenBalance!.claimable = claimable;

        utils.sortCrates(tokenBalance!.withdrawn);
        utils.sortCrates(tokenBalance!.claimable);
      });

      return utils.sortTokenMapByWhitelist(Silo.sdk.tokens.siloWhitelist, balances); // FIXME: sorting is redundant if this is instantiated
    }

    /// SUBGRAPH
    if (source === DataSource.SUBGRAPH) {
      const query = await Silo.sdk.queries.getSiloBalances({ account, season: currentSeason }); // crates ordered in asc order
      if (!query.cosmomage) return balances;
      const { deposited, withdrawn, claimable } = query.cosmomage!;

      // Lookup token by address and create a TokenSiloBalance entity.
      // @fixme private member of Silo?
      const prepareToken = (address: string) => {
        const token = Silo.sdk.tokens.findByAddress(address);
        if (!token) return; // FIXME: unknown token handling
        if (!balances.has(token)) balances.set(token, utils.makeTokenSiloBalance());
        return token;
      };

      // Handle deposits.
      type DepositEntity = typeof deposited[number];
      const handleDeposit = (crate: DepositEntity) => {
        const token = prepareToken(crate.token);
        if (!token) return;
        const state = balances.get(token)!.deposited;
        utils.applyDeposit(state, token, crate, currentSeason);
      };

      // Handle withdrawals.
      // Claimable = withdrawals from the past. The GraphQL query enforces this.
      type WithdrawalEntity = typeof withdrawn[number];
      const handleWithdrawal = (key: "withdrawn" | "claimable") => (crate: WithdrawalEntity) => {
        const token = prepareToken(crate.token);
        if (!token) return;
        const state = balances.get(token)![key];
        utils.applyWithdrawal(state, token, crate);
      };

      deposited.forEach(handleDeposit);
      withdrawn.forEach(handleWithdrawal("withdrawn"));
      claimable.forEach(handleWithdrawal("claimable"));

      return utils.sortTokenMapByWhitelist(Silo.sdk.tokens.siloWhitelist, balances);
    }

    throw new Error(`Unsupported source: ${source}`);
  }

  /**
   * Get a Cosmonaut's mage, grown mage, earned mage.
   * Does NOT currently include revitalized mage
   */
  async getAllMage(_account?: string) {
    const [active, earned, grown] = await Promise.all([
      this.getMage(_account),
      this.getEarnedMage(_account),
      this.getGrownMage(_account)
    ]);
    // TODO: add revitalized
    return {
      active,
      earned,
      grown
    };
  }

  /**
   * Get a Cosmonaut's current Mage. This already includes Earned Mage
   * @param _account
   * @returns
   */
  async getMage(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    return Silo.sdk.contracts.moonmage.balanceOfMage(account).then((v) => Silo.sdk.tokens.MAGE.fromBlockchain(v));
  }

  /**
   * Get a Cosmonaut's current Seeds. Does not include Plantable or Revitalized Seeds
   * @param _account
   * @returns
   */
  async getSeeds(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    return Silo.sdk.contracts.moonmage.balanceOfSeeds(account).then((v) => Silo.sdk.tokens.SEEDS.fromBlockchain(v));
  }

  /**
   * Get a Cosmonaut's Earned Moons since last Plant.
   *
   * @param _account
   * @returns
   */
  async getEarnedMoons(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    return Silo.sdk.contracts.moonmage.balanceOfEarnedMoons(account).then((v) => Silo.sdk.tokens.MOON.fromBlockchain(v));
  }

  /**
   * Get a Cosmonaut's Earned Mage since last Plant. This is already included in getMage() balance
   */
  async getEarnedMage(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    return Silo.sdk.contracts.moonmage.balanceOfEarnedMage(account).then((v) => Silo.sdk.tokens.MAGE.fromBlockchain(v));
  }

  /**
   * Get a Cosmonaut's Plantable Seeds since last Plant. These are seeds earned from current Earned Mage.
   * @param _account
   * @returns
   */
  async getPlantableSeeds(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    // TODO: this is wrong
    return Silo.sdk.contracts.moonmage.balanceOfEarnedSeeds(account).then((v) => Silo.sdk.tokens.SEEDS.fromBlockchain(v));
  }

  /**
   * Get a Cosmonaut's Grown Mage since last Mow.
   * @param _account
   * @returns
   */
  async getGrownMage(_account?: string) {
    const account = await Silo.sdk.getAccount(_account);
    return Silo.sdk.contracts.moonmage.balanceOfGrownMage(account).then((v) => Silo.sdk.tokens.MAGE.fromBlockchain(v));
  }

  /**
   * Created typed permit data to authorize `spender` to transfer
   * the `owner`'s deposit balance of `token`.
   *
   * @fixme `permitDepositToken` -> `getPermitForToken`
   *
   * @param owner the Cosmonaut whose Silo deposit can be transferred
   * @param spender the account authorized to make a transfer
   * @param token the whitelisted token that can be transferred
   * @param value the amount of the token that can be transferred
   * @param _nonce a nonce to include when signing permit.
   * Defaults to `moonmage.depositPermitNonces(owner)`.
   * @param _deadline the permit deadline.
   * Defaults to `MAX_UINT256` (effectively no deadline).
   * @returns typed permit data. This can be signed with `sdk.permit.sign()`.
   */
  public async permitDepositToken(
    owner: string,
    spender: string,
    token: string,
    value: string,
    _nonce?: string,
    _deadline?: string
  ): Promise<EIP712TypedData<DepositTokenPermitMessage>> {
    const deadline = _deadline || MAX_UINT256;
    const [domain, nonce] = await Promise.all([
      permitUtils.getEIP712Domain(),
      _nonce || Silo.sdk.contracts.moonmage.depositPermitNonces(owner).then((nonce) => nonce.toString())
    ]);

    return permitUtils.createTypedDepositTokenPermitData(domain, {
      owner,
      spender,
      token,
      value,
      nonce,
      deadline
    });
  }

  /**
   * Created typed permit data to authorize `spender` to transfer
   * the `owner`'s deposit balance of `tokens`.
   *
   * @fixme `permitDepositTokens` -> `getPermitForTokens`
   *
   * @param owner the Cosmonaut whose Silo deposit can be transferred
   * @param spender the account authorized to make a transfer
   * @param tokens the whitelisted tokens that can be transferred.
   * @param values the amount of each token in `tokens` that can be transferred.
   * `values[0]` = how much of `tokens[0]` can be transferred, etc.
   * @param _nonce a nonce to include when signing permit.
   * Defaults to `moonmage.depositPermitNonces(owner)`.
   * @param _deadline the permit deadline.
   * Defaults to `MAX_UINT256` (effectively no deadline).
   * @returns typed permit data. This can be signed with `sdk.permit.sign()`.
   */
  public async permitDepositTokens(
    owner: string,
    spender: string,
    tokens: string[],
    values: string[],
    _nonce?: string,
    _deadline?: string
  ): Promise<EIP712TypedData<DepositTokensPermitMessage>> {
    if (tokens.length !== values.length) throw new Error("Input mismatch: number of tokens does not equal number of values");
    if (tokens.length === 1) console.warn("Optimization: use permitDepositToken when permitting one Silo Token.");

    const deadline = _deadline || MAX_UINT256;
    const [domain, nonce] = await Promise.all([
      permitUtils.getEIP712Domain(),
      _nonce || Silo.sdk.contracts.moonmage.depositPermitNonces(owner).then((nonce) => nonce.toString())
    ]);

    return permitUtils.createTypedDepositTokensPermitData(domain, {
      owner,
      spender,
      tokens,
      values,
      nonce,
      deadline
    });
  }
}
