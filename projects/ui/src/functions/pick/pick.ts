import { Handler } from '@netlify/functions';
import middy from 'middy';
import { cors, rateLimit } from '~/functions/middleware';

const unripeMoon     = require('./unripe-moons-merkle.json');
const unripeMoon3CRV = require('./unripe-moon3crv-merkle.json');

export type MerkleLeaf = {
  amount: string;
  leaf: string;
  proof: string[];
}

export type PickMerkleResponse = {
  moon: MerkleLeaf | null;
  moon3crv: MerkleLeaf | null;
}

/**
 * Lookup Merkle leaves for a given `account`.
 */
const _handler : Handler = async (event) => {
  const account = event.queryStringParameters?.account?.toLowerCase();
  if (!account) {
    return {
      statusCode: 400,
      body: 'Account parameter required',
    };
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      moon:     unripeMoon[account]     || null,
      moon3crv: unripeMoon3CRV[account] || null,
    }),
  };
};

export const handler = middy(_handler)
  .use(cors({ origin: '*.moon.money' }))
  .use(rateLimit());
