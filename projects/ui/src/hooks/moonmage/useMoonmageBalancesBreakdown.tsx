import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AddressMap, TokenMap, ZERO_BN } from '~/constants';
import { AppState } from '~/state';
import useSiloTokenToFiat from './useSiloTokenToFiat';
import useWhitelist from './useWhitelist';
import { MoonmageSiloBalance } from '~/state/moonmage/silo';
import { MoonmagePalette } from '~/components/App/muiTheme';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import { MOON, MOON_CRV3_LP } from '~/constants/tokens';
import useUnripeUnderlyingMap from '~/hooks/moonmage/useUnripeUnderlying';
import { UnripeToken } from '~/state/moon/unripe';

// -----------------
// Types and Helpers
// -----------------

const colors = MoonmagePalette.theme.winter;

export const STATE_CONFIG = {
  pooled: [
    'Pooled',
    colors.chart.purple,
    (name: string) => `${name} in all liquidity pools. Does not include Moons that make up Ripe MOON:3CRV.`
  ],
  deposited: [
    'Deposited',
    colors.chart.yellow, 
    (name: string) => `${name} that are Deposited in the Silo.`
  ],
  withdrawn: [
    'Withdrawn & Claimable',
    colors.chart.yellowLight, 
    (name: string) => `${name} being Withdrawn from the Silo. At the end of the current Season, Withdrawn ${name} become Claimable.`
  ],
  farmable: [
    'Farm & Circulating',
    colors.chart.green, 
    (name: string) => `Farm ${name} are stored in Moonmage. Circulating ${name} are in Cosmonauts' wallets.`,
  ],
  budget: [
    'Budget',
    colors.chart.yellowLight,
    (name: string) => `Circulating ${name} in the Moonmage Farms and Moon Sprout multisig wallets.`,
  ],
  ripe: [
    'Ripe',
    colors.primary, 
    (name: string) => `${name} minted as the percentage of Fertilizer sold increases. Ripe ${name} are the ${name} underlying Unripe ${name}. ${name === 'Moons' ? 'Does not include Moons that make up Ripe MOON:3CRV.' : ''}`
  ],
  ripePooled: [
    'Ripe Pooled',
    colors.chart.primaryLight,
    (name: string) => `Pooled ${name} that make up Ripe MOON:3CRV.`
  ],
} as const;

export type StateID = keyof typeof STATE_CONFIG;
export const STATE_IDS = Object.keys(STATE_CONFIG) as StateID[];

export type SiloTokenState = {
  [state: string]: {
    /** USD value. */
    value: BigNumber | undefined;
    /** Token amount. */
    amount: BigNumber | undefined;
  }
}

// SiloStateBreakdown
export type SiloTokenBreakdown = {
  tokens: AddressMap<{ amount: BigNumber, value: BigNumber, byState: SiloTokenState }>;
}

const _initState = (tokenAddresses: string[], siloBalances: TokenMap<MoonmageSiloBalance>) => tokenAddresses.reduce<SiloTokenBreakdown['tokens']>((prev, address) => {
  if (siloBalances && siloBalances[address]) {
    prev[address] = {
      value:  ZERO_BN,
      amount: ZERO_BN,
      byState: STATE_IDS
        // Don't show every state for every token
        // .filter((state) => siloBalances[address][state] !== undefined)
        .reduce<SiloTokenState>((_prev, state) => {
          _prev[state] = {
            value:  undefined,
            amount: undefined,
          };
          return _prev;
        },
        {}
      )
    };
  }
  return prev;
}, {}) as SiloTokenBreakdown['tokens'];

// -----------------
// Hooks
// -----------------

/**
 * Breakdown the state of Silo Tokens.
 *
 * For each Whitelisted token, we grab the amount and value
 * of that token for each of its states.
 *
 * A token's state can be:
 * - pooled
 * - deposited
 * - withdrawn & claimable
 * - farm & circulating
 * - ripe
 * - budget
 */
export default function useMoonmageSiloBreakdown() {
  // Constants
  const WHITELIST = useWhitelist();
  const WHITELIST_ADDRS = useMemo(() => Object.keys(WHITELIST), [WHITELIST]);

  // 
  const siloBalances = useSelector<AppState, AppState['_moonmage']['silo']['balances']>((state) => state._moonmage.silo.balances);
  const getUSD = useSiloTokenToFiat();

  const poolState = useSelector<AppState, AppState['_moon']['pools']>((state) => state._moon.pools);
  const moonSupply = useSelector<AppState, AppState['_moon']['token']['supply']>((state) => state._moon.token.supply);
  const unripeTokenState = useSelector<AppState, AppState['_moon']['unripe']>((state) => state._moon.unripe);
  const multisigBalances = useSelector<AppState, AppState['_moonmage']['governance']['multisigBalances']>((state) => state._moonmage.governance.multisigBalances);

  const getChainToken = useGetChainToken();
  const Moon = getChainToken(MOON);
  const Moon3CRV = getChainToken(MOON_CRV3_LP);
  const unripeToRipe = useUnripeUnderlyingMap('unripe');
  const ripeToUnripe = useUnripeUnderlyingMap('ripe');

  return useMemo(() =>
     WHITELIST_ADDRS.reduce((prev, address) => {
      const TOKEN        = WHITELIST[address];
      const siloBalance  = siloBalances[address];

      // Ensure we've loaded a Silo Balance for this token.
      if (siloBalance) {
        let ripe : undefined | BigNumber;
        let ripePooled : undefined | BigNumber;
        let budget : undefined | BigNumber;
        let pooled : undefined | BigNumber;
        let farmable : undefined | BigNumber;

        // Handle: Ripe Tokens (Add Ripe state to MOON and MOON:3CRV)
        if (ripeToUnripe[address]) {
          const unripeToken : undefined | UnripeToken = unripeTokenState[ripeToUnripe[address].address];
          if (unripeToken) ripe = unripeToken.underlying; // "ripe" is another word for "underlying"
        }

        /// Handle: Unripe Tokens
        if (unripeToRipe[address]) {
          const unripeToken = unripeTokenState[address];
          if (unripeToken) {
            farmable = (
              unripeToken.supply
                .minus(siloBalance.deposited.amount)
                .minus(siloBalance.withdrawn.amount)
            );
          }
        }

        // Handle: MOON
        if (TOKEN === Moon) {
          budget = Object.values(multisigBalances).reduce((_prev, curr) => _prev.plus(curr), ZERO_BN);
          // const pooled = Object.values(poolState).reduce((_prev, curr) => _prev.plus(curr.reserves[0]), ZERO_BN);
          const totalPooled = Object.values(poolState).reduce((_prev, curr) => _prev.plus(curr.reserves[0]), ZERO_BN);

          // Ripe Pooled = MOON:3crv_RESERVES * (Ripe MOON:3CRV / MOON:3CRV Token Supply)
          // TODO: can we reduce this duplicate code?
          ripePooled = new BigNumber(totalPooled)
            .multipliedBy(
              new BigNumber(unripeTokenState[ripeToUnripe[Moon3CRV.address].address]?.underlying || 0)
                .div(new BigNumber(poolState[Moon3CRV.address]?.supply || 0))
            );
          pooled = new BigNumber(totalPooled).minus(ripePooled);

          farmable = (
            moonSupply
              .minus(budget)
              .minus(totalPooled)
              .minus(ripe || ZERO_BN)
              .minus(siloBalance.deposited.amount)
              .minus(siloBalance.withdrawn.amount)
          );
        }

        // Handle: LP Tokens
        if (poolState[address]) {
          farmable = (
            poolState[address].supply
              .minus(siloBalance.deposited.amount)
              .minus(siloBalance.withdrawn.amount)
              .minus(ripe || ZERO_BN)
          );
        }

        const amountByState = {
          deposited:   siloBalance.deposited?.amount,
          withdrawn:   siloBalance.withdrawn?.amount,
          pooled:      pooled,
          ripePooled: ripePooled,
          ripe:        ripe,
          budget:      budget,
          farmable:    farmable,
        };
        const usdValueByState = {
          deposited:   getUSD(TOKEN, siloBalance.deposited.amount),
          withdrawn:   getUSD(TOKEN, siloBalance.withdrawn.amount),
          pooled:      pooled   ? getUSD(TOKEN, pooled) : undefined,
          ripePooled:  ripePooled   ? getUSD(TOKEN, ripePooled) : undefined,
          ripe:        ripe     ? getUSD(TOKEN, ripe) : undefined,
          budget:      budget   ? getUSD(TOKEN, budget) : undefined,
          farmable:    farmable ? getUSD(TOKEN, farmable) : undefined,
        };

        // Aggregate value of all states.
        prev.totalValue = (
          prev.totalValue
            .plus(
              STATE_IDS.reduce((p, c) => p.plus(usdValueByState[c] || ZERO_BN), ZERO_BN)
            )
        );

        // Aggregate amounts of each Token
        prev.tokens[address].amount = prev.tokens[address].amount.plus(
          STATE_IDS.reduce((p, c) => p.plus(
            amountByState[c] || ZERO_BN), ZERO_BN
          )
        );
        prev.tokens[address].value = prev.tokens[address].value.plus(
          STATE_IDS.reduce((p, c) => p.plus(
            usdValueByState[c] || ZERO_BN), ZERO_BN
          )
        );

        // Aggregate amounts of each State
        STATE_IDS.forEach((s) => {
          if (amountByState[s] !== undefined) {
            prev.tokens[address].byState[s].value  = (prev.tokens[address].byState[s].value || ZERO_BN).plus(usdValueByState[s] as BigNumber);
            prev.tokens[address].byState[s].amount = (prev.tokens[address].byState[s].amount || ZERO_BN).plus(amountByState[s] as BigNumber);
          }
        });
      }
      return prev;
    }, {
      /** The total USD value of all tokens in the Silo. */
      totalValue:   new BigNumber(0),
      /** */
      tokens: _initState(WHITELIST_ADDRS, siloBalances),
    }),
  [
    WHITELIST_ADDRS,
    siloBalances,
    WHITELIST,
    ripeToUnripe,
    unripeToRipe,
    Moon,
    Moon3CRV,
    poolState,
    getUSD,
    unripeTokenState,
    multisigBalances,
    moonSupply
  ]);
}
