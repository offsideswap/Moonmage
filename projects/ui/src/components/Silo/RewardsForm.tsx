import { Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { useSigner } from '~/hooks/ledger/useSigner';
import { ClaimRewardsAction } from '~/lib/Moonmage/Farm';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { UNRIPE_TOKENS } from '~/constants/tokens';
import useTokenMap from '~/hooks/chain/useTokenMap';
import { selectCratesForEnroot } from '~/util/Crates';
import useAccount from '~/hooks/ledger/useAccount';
import useBDV from '~/hooks/moonmage/useBDV';
import { useFetchCosmonautSilo } from '~/state/cosmomage/silo/updater';
import { AppState } from '~/state';
import TransactionToast from '~/components/Common/TxnToast';
import useTimedRefresh from '~/hooks/app/useTimedRefresh';

export type SendFormValues = {
  to?: string;
};

type ClaimRewardsFormValues = {
  action: ClaimRewardsAction | undefined;
};

export type ClaimCalls = {
  [key in ClaimRewardsAction]: {
    estimateGas: () => Promise<ethers.BigNumber>;
    execute: () => Promise<ethers.ContractTransaction>;
    enabled: boolean;
  };
};
export type ClaimGasResults = {
  [key in ClaimRewardsAction]?: BigNumber;
};

export type ClaimRewardsFormParams = {
  gas: ClaimGasResults | null;
  calls: ClaimCalls | null;
} & FormikProps<ClaimRewardsFormValues>;

export type RewardsFormProps = {
  open?: boolean;
  children: (props: ClaimRewardsFormParams) => React.ReactNode;
};

const RewardsForm: React.FC<RewardsFormProps> = ({ open, children }) => {
  const account = useAccount();
  const { data: signer } = useSigner();

  /// Helpers
  const unripeTokens = useTokenMap(UNRIPE_TOKENS);

  /// Cosmonaut data
  const cosmomageSilo = useSelector<AppState, AppState['_cosmomage']['silo']>(
    (state) => state._cosmomage.silo
  );
  const siloBalances = cosmomageSilo.balances;
  const [fetchCosmonautSilo] = useFetchCosmonautSilo();

  // Moonmage data
  const getBDV = useBDV();

  /// Contracts
  const moonmage = useMoonmageContract(signer);

  /// Form
  const initialValues: ClaimRewardsFormValues = useMemo(
    () => ({
      action: undefined,
    }),
    []
  );

  /// Gas calculations
  const [gas, setGas] = useState<ClaimGasResults | null>(null);
  const [calls, setCalls] = useState<ClaimCalls | null>(null);
  const estimateGas = useCallback(async () => {
    if (!account) return;
    if (!signer) throw new Error('No signer');

    const selectedCratesByToken = selectCratesForEnroot(
      moonmage,
      unripeTokens,
      siloBalances,
      getBDV
    );
    const enrootData = Object.keys(selectedCratesByToken).map(
      (key) => selectedCratesByToken[key].encoded
    );

    console.debug(
      '[RewardsDialog] Selected crates: ',
      selectedCratesByToken,
      enrootData
    );

    const _calls: ClaimCalls = {
      [ClaimRewardsAction.MOW]: {
        estimateGas: () => moonmage.estimateGas.update(account),
        execute: () => moonmage.update(account),
        enabled: cosmomageSilo.mage.grown.gt(0),
      },
      [ClaimRewardsAction.PLANT_AND_MOW]: {
        estimateGas: () => moonmage.estimateGas.plant(),
        execute: () => moonmage.plant(),
        enabled: cosmomageSilo.seeds.earned.gt(0),
      },
      [ClaimRewardsAction.ENROOT_AND_MOW]: {
        estimateGas: () =>
          moonmage.estimateGas.farm([
            // PLANT_AND_MOW
            moonmage.interface.encodeFunctionData('plant', undefined),
            // ENROOT_AND_MOW
            ...enrootData,
          ]),
        execute: () =>
          moonmage.farm([
            // PLANT_AND_MOW
            moonmage.interface.encodeFunctionData('plant', undefined),
            // ENROOT_AND_MOW
            ...enrootData,
          ]),
        enabled:
          cosmomageSilo.mage.grown.gt(0) ||
          cosmomageSilo.seeds.earned.gt(0) ||
          enrootData.length > 0,
      },
      /* (
          enrootData.length > 1
            /// use `farm()` if multiple crates
            ? {
              estimateGas: () => moonmage.estimateGas.farm(enrootData),
              execute:     () => moonmage.farm(enrootData),
              enabled:     true,
            }
            /// send raw transaction if single crate
            /// we use this method because `selectCratesForEnroot`
            /// returns encoded function data
            : {
              estimateGas: () => provider.estimateGas(
                signer.checkTransaction({
                  to: moonmage.address,
                  data: enrootData[0],
                })
              ),
              execute: () => signer.sendTransaction({
                to: moonmage.address,
                data: enrootData[0],
              }),
              enabled: enrootData.length > 0,
            }
        ), */
      [ClaimRewardsAction.CLAIM_ALL]: {
        estimateGas: () =>
          moonmage.estimateGas.farm([
            // PLANT_AND_MOW
            moonmage.interface.encodeFunctionData('plant', undefined),
            // ENROOT_AND_MOW
            ...enrootData,
          ]),
        execute: () =>
          moonmage.farm([
            // PLANT_AND_MOW
            moonmage.interface.encodeFunctionData('plant', undefined),
            // ENROOT_AND_MOW
            ...enrootData,
          ]),
        enabled:
          cosmomageSilo.mage.grown.gt(0) ||
          cosmomageSilo.seeds.earned.gt(0) ||
          enrootData.length > 0,
      },
    };

    /// Push calls
    setCalls(_calls);

    /// For each reward type, run the estimateGas function in parallel
    /// and then match outputs to their corresponding keys.
    const keys = Object.keys(_calls);
    const _gas = await Promise.all(
      keys.map((key) => _calls[key as ClaimRewardsAction]!.estimateGas())
    ).then((results) =>
      results.reduce<Partial<ClaimGasResults>>((prev, curr, index) => {
        prev[keys[index] as ClaimRewardsAction] = new BigNumber(
          curr.toString()
        );
        return prev;
      }, {})
    );
    setGas(_gas);
  }, [
    account,
    moonmage,
    cosmomageSilo.seeds.earned,
    cosmomageSilo.mage.grown,
    getBDV,
    signer,
    siloBalances,
    unripeTokens,
  ]);

  useTimedRefresh(estimateGas, 20 * 1000, open);

  /// Handlers
  const onSubmit = useCallback(
    async (
      values: ClaimRewardsFormValues,
      formActions: FormikHelpers<ClaimRewardsFormValues>
    ) => {
      let txToast;
      try {
        if (!account) throw new Error('Connect a wallet first.');
        if (!values.action) throw new Error('No action selected.');
        if (!calls) throw new Error('Waiting for gas data.');

        const call = calls[values.action];

        // FIXME: set the name of the action to Mow, etc. depending on `values.action`
        txToast = new TransactionToast({
          loading: 'Claiming rewards.',
          success: 'Claim successful. You have claimed your rewards.',
        });

        if (!call) throw new Error('Unknown action.');

        const txn = await call.execute();
        txToast.confirming(txn);

        const receipt = await txn.wait();
        await fetchCosmonautSilo();
        txToast.success(receipt);
        formActions.resetForm();
      } catch (err) {
        if (txToast) {
          txToast.error(err);
        } else {
          const errorToast = new TransactionToast({});
          errorToast.error(err);
        }
      }
    },
    [account, calls, fetchCosmonautSilo]
  );

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps: FormikProps<ClaimRewardsFormValues>) => (
        <>{children({ gas, calls, ...formikProps })}</>
      )}
    </Formik>
  );
};

export default RewardsForm;

export type RewardsFormContentOption = {
  title: 'Mow' | 'Plant' | 'Enroot' | string;
  description: string;
  value: ClaimRewardsAction;
  hideIfNoUnripe?: boolean;
};
