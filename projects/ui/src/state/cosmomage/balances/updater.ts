import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import flatMap from 'lodash/flatMap';
import { ZERO_BN } from '~/constants';
import { ERC20_TOKENS, ETH } from '~/constants/tokens';
import useChainId from '~/hooks/chain/useChainId';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useTokenMap from '~/hooks/chain/useTokenMap';
import { tokenResult } from '~/util';
import useChainConstant from '~/hooks/chain/useChainConstant';
import useAccount from '~/hooks/ledger/useAccount';
import { clearBalances, updateBalances } from './actions';

export const useFetchCosmonautBalances = () => {
  /// State
  const dispatch = useDispatch();
  const account  = useAccount();
  
  /// Constants
  const Eth = useChainConstant(ETH);
  const erc20TokenMap = useTokenMap(ERC20_TOKENS);

  /// Contracts
  const moonmage = useMoonmageContract();

  /// Handlers
  /// FIXME: make this callback accept a tokens array to prevent reloading all balances on every call
  /// FIXME: multicall
  const fetch = useCallback(async () => {
    try {
      if (account && erc20TokenMap) {
        const erc20Addresses = Object.keys(erc20TokenMap);
        console.debug('Token Addresses', erc20Addresses);
        const promises = Promise.all([
          // ETH cannot have an internal balance and isn't returned
          // from the standard getAllBalances call.
          // multiCall.getEthBalance(account)
          Eth.getBalance(account)
            .then(tokenResult(Eth))
            .then((result) => ({
              token: Eth,
              balance: {
                internal: ZERO_BN,
                external: result,
                total:    result,
              },
            })),
          moonmage.getAllBalances(account, erc20Addresses)
            .then((result) => {
              console.debug('[cosmomage/balances/updater]: getAllBalances = ', result);
              return result;
            })
            .then((result) => result.map((struct, index) => {
              const _token = erc20TokenMap[erc20Addresses[index]];
              const _tokenResult = tokenResult(_token);
              return {
                token: _token,
                balance: {
                  internal: _tokenResult(struct.internalBalance),
                  external: _tokenResult(struct.externalBalance),
                  total:    _tokenResult(struct.totalBalance),
                }
              };
            })),
        ]).then((results) => flatMap(results));

        // const calls = [
        //   // ETH cannot have an internal balance and isn't returned
        //   // from the standard getAllBalances call.
        //   multiCall.getEthBalance(account),
        //   wrap(moonmageReplanted).getAllBalances(account, erc20Addresses)
        // ];

        console.debug(`[cosmomage/updater/useFetchBalances] FETCH: balances (account = ${account})`);
        const balances = await promises;
        console.debug('[cosmomage/updater/useFetchBalances] RESULT: ', balances);

        dispatch(updateBalances(balances));
        return promises;
      }
    } catch (e) {
      console.debug('[cosmomage/updater/useFetchBalances] FAILED', e);
      console.error(e);
    }
  }, [
    dispatch,
    moonmage,
    Eth,
    erc20TokenMap,
    account,
  ]);

  const clear = useCallback(() => {
    dispatch(clearBalances());
  }, [dispatch]);

  return [fetch, clear] as const;
};

const CosmonautBalancesUpdater = () => {
  const [fetch, clear] = useFetchCosmonautBalances();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    clear();
    if (account) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    chainId,
  ]);

  return null;
};

export default CosmonautBalancesUpdater;
