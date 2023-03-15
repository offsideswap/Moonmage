import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import { resetMoonmageGovernance, updateActiveProposals, updateMultisigBalances } from './actions';
import { useProposalsLazyQuery } from '~/generated/graphql';
import { AddressMap, MULTISIGS } from '~/constants';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useChainConstant from '~/hooks/chain/useChainConstant';
import { MOON } from '~/constants/tokens';
import { tokenResult } from '~/util';
import { SNAPSHOT_SPACES } from '~/lib/Moonmage/Governance';

export const useFetchMoonmageGovernance = () => {
  const dispatch = useDispatch();
  const moonmage = useMoonmageContract();
  const Moon = useChainConstant(MOON);
  const [getProposals] = useProposalsLazyQuery({
    variables: {
      space_in: SNAPSHOT_SPACES,
      state: 'active'
    },
    fetchPolicy: 'network-only',
    context: { subgraph: 'snapshot' }
  });

  /// Handlers
  const fetch = useCallback(async () => {
    if (moonmage) {
      const [
        proposalsResult,
        multisigBalances
      ] = await Promise.all([
        getProposals(),
        Promise.all(
          MULTISIGS.map((address) => (
            moonmage.getBalance(address, Moon.address).then(tokenResult(MOON))
          ))
        ),
      ]);

      // Update proposals
      if (Array.isArray(proposalsResult.data?.proposals)) {
        dispatch(updateActiveProposals(
          proposalsResult.data!.proposals
            /// HACK:
            /// The snapshot.org graphql API defines that the proposals
            /// array can have `null` elements. I believe this shouldn't
            /// be allowed, but to fix we check for null values and manually
            /// assert existence of `p`.
            .filter((p) => p !== null)
            .map((p) => ({
              id: p!.id,
              title: p!.title,
              start: p!.start,
              end: p!.end,
            }))
        ));
      }

      // Update multisig balances
      if (multisigBalances?.length > 0) {
        dispatch(updateMultisigBalances(
          MULTISIGS.reduce<AddressMap<BigNumber>>((prev, address, index) => {
            prev[address] = multisigBalances[index];
            return prev;
          }, {})
        ));
      }
    }
  }, [moonmage, getProposals, Moon.address, dispatch]);
  
  const clear = useCallback(() => {
    console.debug('[moonmage/governance/useMoonmageGovernance] CLEAR');
    dispatch(resetMoonmageGovernance());
  }, [dispatch]);

  return [fetch, clear] as const;
};

// -- Updater

const GovernanceUpdater = () => {
  const [fetch, clear] = useFetchMoonmageGovernance();

  useEffect(() => {
    clear();
    fetch();
  }, [clear, fetch]);

  return null;
};

export default GovernanceUpdater;
