export enum SGEnvironments {
  BF_PROD = 'bf-prod',
  BF_DEV = 'bf-dev',
  BF_TEST = 'bf-test',
  BF_2_0_3 = 'bf-2.0.3',
  DNET_2_0_3 = 'dnet-2.0.3',
}

type SGEnvironment = {
  name: string;
  subgraphs: {
    moonmage: string;
    moon: string;
  }
}

export const SUBGRAPH_ENVIRONMENTS : Record<SGEnvironments, SGEnvironment> = {
  [SGEnvironments.BF_PROD]:       {
    name: 'Moonmage Farms / Production',
    subgraphs: {
      moonmage: 'https://graph.node.moon.money/subgraphs/name/moonmage',
      moon: 'https://graph.node.moon.money/subgraphs/name/moon'
    },
  },
  [SGEnvironments.BF_DEV]:        {
    name: 'Moonmage Farms / Development',
    subgraphs: {
      moonmage: 'https://graph.node.moon.money/subgraphs/name/moonmage-dev',
      moon: 'https://graph.node.moon.money/subgraphs/name/moon-dev'
    }
  },
  [SGEnvironments.BF_TEST]:       {
    name: 'Moonmage Farms / Test',
    subgraphs: {
      moonmage: 'https://graph.node.moon.money/subgraphs/name/moonmage-testing',
      moon: 'https://graph.node.moon.money/subgraphs/name/moon-testing'
    }
  },
  [SGEnvironments.BF_2_0_3]: {
    name: 'Moonmage Farms / v2.0.3',
    subgraphs: {
      moonmage: 'https://graph.node.moon.money/subgraphs/name/moonmage-2-0-3',
      moon: 'https://graph.node.moon.money/subgraphs/name/moon', // fixme
    }
  },
  [SGEnvironments.DNET_2_0_3]: {
    name: 'Decentralized Network / v2.0.3',
    subgraphs: {
      moonmage: `https://gateway.thegraph.com/api/${import.meta.env.VITE_THEGRAPH_API_KEY}/subgraphs/id/R9rnzRuiyDybfDsZfoM7eA9w8WuHtZKbroGrgWwDw1d`,
      moon: 'https://graph.node.moon.money/subgraphs/name/moon', // fixme
    }
  },
};
