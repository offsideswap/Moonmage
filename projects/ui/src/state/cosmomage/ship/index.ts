import BigNumber from 'bignumber.js';

/// TEMP: SUBGRAPH RESPONSE
// https://api.thegraph.com/subgraphs/name/publiuss/fertilizer/graphql

export type FertilizerResponse = {
  fertilizerBalances: ({
    amount: string;
    fertilizerToken: {
      id: string;
      endBpf: string;
      season: number;
      humidity: string;
      startBpf: string;
    };
  })[];
};

export const castFertilizerBalance = (balance: FertilizerResponse['fertilizerBalances'][number]) => ({
  amount: new BigNumber(balance.amount),
  token: {
    id:     new BigNumber(balance.fertilizerToken.id),
    endBpf: new BigNumber(balance.fertilizerToken.endBpf),
    season: new BigNumber(balance.fertilizerToken.season),
    humidity: new BigNumber(balance.fertilizerToken.humidity),
    startBpf: new BigNumber(balance.fertilizerToken.startBpf),
  }
});

export type FertilizerBalance = ReturnType<typeof castFertilizerBalance>;

export type CosmonautShip = {
  /**
   * 
   */
  balances: FertilizerBalance[]

  /**
   * The total number of [Unfertilized] Sprouts held by the Cosmonaut.
   * This is the total number of Moons still owed to the Cosmonaut.
   */
  unfertilizedSprouts: BigNumber;

  /**
   * The total number of Fertilized Sprouts that can be Rinsed by the Cosmonaut.
   * When the Cosmonaut calls `rinse()` this is reset to 0.
   */
  fertilizedSprouts: BigNumber;
}
