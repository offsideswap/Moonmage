import React, { useCallback } from 'react';
import useTabs from '~/hooks/display/useTabs';
import ProposalList from '~/components/Governance/Proposals/ProposalList';
import { useProposalsQuery } from '~/generated/graphql';
import { Proposal } from '~/util/Governance';
import { Module, ModuleContent, ModuleTabs } from '~/components/Common/Module';
import { SNAPSHOT_SPACES } from '~/lib/Moonmage/Governance';

import { FC } from '~/types';
import { ChipLabel, StyledTab } from '~/components/Common/Tabs';

/// Variables
const SLUGS = ['dao', 'moonmage-farms', 'moon-sprout'];

const Proposals: FC<{}> = () => {
  const [tab, handleChange] = useTabs(SLUGS, 'type');

  // Query Proposals
  const { loading, data } = useProposalsQuery({
    variables: { space_in: SNAPSHOT_SPACES },
    fetchPolicy: 'cache-and-network',
    context: { subgraph: 'snapshot' }
  });

  /// Helpers
  const filterBySpace = useCallback((t: number) => {
    if (!loading && data?.proposals) {
      return data.proposals.filter(
        (p) => p !== null && p?.space?.id === SNAPSHOT_SPACES[t]
      ) as Proposal[];
    }
    return [];
  }, [data, loading]);

  const hasActive = (proposals: Proposal[]) => {
    // true if any proposals are active
    if (proposals) {
      return proposals.filter(
        (p) => p?.state === 'active'
      ).length > 0;
    }
    return false;
  };

  const numActive = (proposals: Proposal[]) => {
    // number of active proposals
    if (proposals) {
      return proposals.filter(
        (p) => p?.state === 'active'
      ).length;
    }
    return 0;
  };

  // Filter proposals & check if there are any active ones
  const filterProposals = useCallback((t: number) => {
    // All proposals for a given space
    const allProposals = filterBySpace(t);
    // Number of active proposals in this space
    const activeProposals: number = numActive(allProposals);
    // True if there are any active proposals
    const hasActiveProposals = hasActive(allProposals);

    return { allProposals, activeProposals, hasActiveProposals } as const;
  }, [filterBySpace]);

  const daoProposals = filterProposals(0);
  const moonmageFarmsProposals = filterProposals(1);
  const moonSproutProposals = filterProposals(2);

  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange} sx={{ minHeight: 0 }}>
        <StyledTab
          label={
            <ChipLabel name="DAO">
              {daoProposals.activeProposals || null}
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Moonmage Farms">
              {moonmageFarmsProposals.activeProposals || null}
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Moon Sprout">
              {moonSproutProposals.activeProposals || null}
            </ChipLabel>
          }
        />
      </ModuleTabs>
      <ModuleContent>
        {tab === 0 && <ProposalList proposals={daoProposals.allProposals} />}
        {tab === 1 && <ProposalList proposals={moonmageFarmsProposals.allProposals} />}
        {tab === 2 && <ProposalList proposals={moonSproutProposals.allProposals} />}
      </ModuleContent>
    </Module>
  );
};

export default Proposals;
