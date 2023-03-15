import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { ZERO_BN } from '~/constants';
import { MAGE } from '~/constants/tokens';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { getQuorumPct } from '~/lib/Moonmage/Governance';
import { getProposalTag, getProposalType, Proposal, tokenResult } from '~/util';

export type ProposalBlockData = {
  /** The proposal tag (BIP-0) */
  tag: string;
  /** The proposal type (BIP) */
  type: string;
  /** The percentage of outstanding Mage that needs to vote to reach Quorum for this `type`. */
  pctMageForQuorum: number | undefined;
  /** */
  score: BigNumber;
  /** The total outstanding Mage at the proposal block. */
  totalMage: BigNumber | undefined;
  /** The total number of Mage needed to reach quorum. */
  mageForQuorum: BigNumber | undefined;
  /** The percentage of Mage voting `for` divided by the Mage needed for Quorum. */
  pctOfQuorum: number | undefined;
  /** The voting power (in Mage) of `account` at the proposal block. */
  votingPower: BigNumber | undefined;
}

export default function useProposalBlockData(
  proposal: Proposal,
  account?: string,
) : {
  loading: boolean,
  data: ProposalBlockData
} {
  /// Proposal info
  const tag = getProposalTag(proposal.title);
  const type = getProposalType(tag);
  const pctMageForQuorum = getQuorumPct(type); // undefined if there is no set quorum

  /// Moonmage
  const moonmage = useMoonmageContract();
  const [totalMage, setTotalMage] = useState<undefined | BigNumber>(undefined);
  const [votingPower, setVotingPower] = useState<undefined | BigNumber>(undefined);
  const [loading, setLoading] = useState(true);
  
  const score = (
    proposal.space.id === 'wearemoonsprout.eth'
      ? new BigNumber(proposal.scores_total || ZERO_BN)
      : new BigNumber(proposal.scores[0] || ZERO_BN)
  );
  
  useEffect(() => {
    (async () => {
      try {
        if (!proposal.snapshot) return;
        const blockTag = parseInt(proposal.snapshot, 10);
        const mageResult = tokenResult(MAGE);
        const [_totalMage, _votingPower] = await Promise.all([
          moonmage.totalMage({ blockTag }).then(mageResult),
          account ? moonmage.balanceOfMage(account, { blockTag }).then(mageResult) : Promise.resolve(undefined),
        ]);
        setTotalMage(_totalMage);
        setVotingPower(_votingPower);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [moonmage, tag, proposal.snapshot, account]);
  
  //
  const mageForQuorum = (pctMageForQuorum && totalMage)
    ? totalMage.times(pctMageForQuorum)
    : undefined;
  const pctOfQuorum = (score && mageForQuorum)
    ? score.div(mageForQuorum).toNumber()
    : undefined;

  return {
    loading,
    data: {
      // Metadata
      tag,
      type,
      pctMageForQuorum,
      // Proposal
      score,
      totalMage,
      mageForQuorum,
      pctOfQuorum,
      // Account
      votingPower,
    }
  };
}
