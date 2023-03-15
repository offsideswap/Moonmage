import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MOON, UNRIPE_MOON } from '../../../constants/tokens';

import { USDC_ADDRESSES } from '~/constants/addresses';

import { useMoonmageContract, useMoonmageFertilizerContract, useERC20Contract } from '~/hooks/ledger/useContract';
import { tokenResult, bigNumberResult } from '~/util';
import useChainId from '~/hooks/chain/useChainId';
import { resetShip, updateShip } from './actions';
import { ZERO_BN } from '~/constants';

// const fetchGlobal = fetch;
// const fetchFertilizerTotalSupply = async (): Promise<BigNumber> =>  
//   fetchGlobal('https://api.thegraph.com/subgraphs/name/publiuss/fertilizer', {
//     method: 'POST',
//     body: JSON.stringify({
//       query: `
//         query {
//           fertilizers {
//             totalSupply
//           }
//         }
//       `
//     })
//   }).then((r) => r.json()).then((r) => new BigNumber(r.data.fertilizers?.[0]?.totalSupply || 0));

export const useFetchMoonmageShip = () => {
  const dispatch        = useDispatch();
  const moonmage       = useMoonmageContract();
  const [fertContract]  = useMoonmageFertilizerContract();
  const [usdcContract]  = useERC20Contract(USDC_ADDRESSES);

  // Handlers
  const fetch = useCallback(async () => {
    if (fertContract && usdcContract) {
      console.debug('[moonmage/fertilizer/updater] FETCH');
      const [
        remainingRecapitalization,
        humidity,
        currentBpf,
        endBpf,
        unfertilized,
        fertilized,
        recapFundedPct
      ] = await Promise.all([
        moonmage.remainingRecapitalization().then(tokenResult(MOON)),
        moonmage.getCurrentHumidity().then(bigNumberResult),
        moonmage.moonsPerFertilizer().then(bigNumberResult),
        moonmage.getEndBpf().then(bigNumberResult),
        moonmage.totalUnfertilizedMoons().then(tokenResult(MOON)),
        moonmage.totalFertilizedMoons().then(tokenResult(MOON)),
        moonmage.getRecapFundedPercent(UNRIPE_MOON[1].address).then(tokenResult(UNRIPE_MOON)),
      ] as const);
      console.debug(`[moonmage/fertilizer/updater] RESULT: remaining = ${remainingRecapitalization.toFixed(2)}`);
      dispatch(updateShip({
        remaining: remainingRecapitalization, // FIXME rename
        totalRaised: ZERO_BN,
        humidity,     //
        currentBpf,   //
        endBpf,       //
        unfertilized,  //
        fertilized,
        recapFundedPct,
      }));
    }
  }, [
    dispatch,
    moonmage,
    fertContract,
    usdcContract
  ]); 
  const clear = useCallback(() => {
    dispatch(resetShip());
  }, [dispatch]);

  return [fetch, clear] as const;
};

const ShipUpdater = () => {
  const [fetch, clear] = useFetchMoonmageShip();
  const chainId = useChainId();
  
  useEffect(() => {
    clear();
    fetch();
    // NOTE: 
    // The below requires that useChainId() is called last in the stack of hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  return null;
};

export default ShipUpdater;
