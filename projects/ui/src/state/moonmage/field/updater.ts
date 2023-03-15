import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { bigNumberResult, tokenResult } from '~/util';
import { MOON } from '~/constants/tokens';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { resetMoonmageField, updateMoonmageField } from './actions';
import { ZERO_BN } from '~/constants';

export const useFetchMoonmageField = () => {
  const dispatch = useDispatch();
  const moonmage = useMoonmageContract();

  // Handlers
  const fetch = useCallback(async () => {
    if (moonmage) {
      console.debug('[moonmage/field/useMoonmageField] FETCH');
      
      const [
        harvestableIndex,
        podIndex,
        soil,
        weather,
      ] = await Promise.all([
        moonmage.harvestableIndex().then(tokenResult(MOON)), // FIXME
        moonmage.podIndex().then(tokenResult(MOON)),
        moonmage.totalSoil().then(tokenResult(MOON)),
        moonmage.weather().then((_weather) => ({
          didSowBelowMin: _weather.didSowBelowMin,
          didSowFaster: _weather.didSowFaster,
          lastDSoil: tokenResult(MOON)(_weather.lastDSoil),
          lastSoilPercent: bigNumberResult(_weather.lastSoilPercent),
          lastSowTime: bigNumberResult(_weather.lastSowTime),
          nextSowTime: bigNumberResult(_weather.nextSowTime),
          startSoil: tokenResult(MOON)(_weather.startSoil),
          yield: bigNumberResult(_weather.yield),
        })),
        // moonmage.totalHarvested().then(tokenResult(MOON))
      ] as const);

      console.debug('[moonmage/field/useMoonmageField] RESULT');

      dispatch(updateMoonmageField({
        harvestableIndex,
        podIndex,
        podLine: podIndex.minus(harvestableIndex),
        soil,
        weather,
        rain: {
          // FIXME
          raining: false,
          rainStart: ZERO_BN,
        },
      }));
    }
  }, [
    dispatch,
    moonmage,
  ]);
  
  const clear = useCallback(() => {
    console.debug('[moonmage/field/useMoonmageField] CLEAR');
    dispatch(resetMoonmageField());
  }, [dispatch]);

  return [fetch, clear] as const;
};

// -- Updater

const FieldUpdater = () => {
  const [fetch, clear] = useFetchMoonmageField();

  useEffect(() => {
    clear();
    fetch();
  }, [clear, fetch]);

  return null;
};

export default FieldUpdater;
