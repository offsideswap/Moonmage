import { Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import PlotInputField from '~/components/Common/Form/PlotInputField';
import TransactionToast from '~/components/Common/TxnToast';
import {
  PlotFragment,
  PlotSettingsFragment, SmartSubmitButton,
  TokenOutputField,
  TxnSeparator
} from '~/components/Common/Form';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import useCosmonautPlots from '~/hooks/cosmomage/useCosmonautPlots';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useChainConstant from '~/hooks/chain/useChainConstant';
import { useSigner } from '~/hooks/ledger/useSigner';
import { PlotMap } from '~/util';
import { FarmToMode } from '~/lib/Moonmage/Farm';
import { MOON, PODS } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { useFetchCosmonautField } from '~/state/cosmomage/field/updater';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { PodOrder } from '~/state/cosmomage/market';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

export type FillOrderFormValues = {
  plot: PlotFragment;
  destination: FarmToMode | undefined;
  settings: PlotSettingsFragment & {};
}

const FillOrderV2Form: FC<
  FormikProps<FillOrderFormValues>
  & {
    podOrder: PodOrder;
    plots: PlotMap<BigNumber>;
    harvestableIndex: BigNumber;
  }
> = ({
  values,
  isSubmitting,
  podOrder,
  plots: allPlots,  // rename to prevent collision
  harvestableIndex,
}) => {
  /// Derived
  const plot = values.plot;
  const [eligiblePlots, numEligiblePlots] = useMemo(() =>
    Object.keys(allPlots).reduce<[PlotMap<BigNumber>, number]>(
      (prev, curr) => {
        const indexBN = new BigNumber(curr);
        if (indexBN.minus(harvestableIndex).lt(podOrder.maxPlaceInLine)) {
          prev[0][curr] = allPlots[curr];
          prev[1] += 1;
        }
        return prev;
      },
      [{}, 0]
    ),
    [allPlots, harvestableIndex, podOrder.maxPlaceInLine]
  );

  // const placeInLine   = plot.index ? new BigNumber(plot.index).minus(harvestableIndex) : undefined;
  const moonsReceived = plot.amount?.times(podOrder.pricePerPod) || ZERO_BN;
  const isReady = (
    numEligiblePlots > 0
    && plot.index
    && plot.amount?.gt(0)
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <PlotInputField
          plots={eligiblePlots}
          max={podOrder.podAmountRemaining}
          disabledAdvanced
          size="small"
        />
        <FarmModeField name="destination" />
        {isReady && (
          <>
            <TxnSeparator mt={0} />
            <TokenOutputField
              token={MOON[1]}
              amount={moonsReceived}
              isLoading={false}
              size="small"
            />
            {/* <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.SELL_PODS,
                        podAmount: plot.amount ? plot.amount : ZERO_BN,
                        placeInLine: placeInLine !== undefined ? placeInLine : ZERO_BN
                      },
                      {
                        type: ActionType.RECEIVE_MOONS,
                        amount: moonsReceived,
                        destination: values.destination,
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box> */}
          </>
        )}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!(isReady && values.destination)}
          type="submit"
          variant="contained"
          color="primary"
          tokens={[]}
          mode="auto"
        >
          {numEligiblePlots === 0 ? 'No eligible Plots' : 'Fill'}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const FillOrderForm: FC<{ podOrder: PodOrder }> = ({ podOrder }) => {
  /// Tokens
  const Moon = useChainConstant(MOON);

  /// Ledger
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Moonmage
  const harvestableIndex = useHarvestableIndex();

  /// Cosmonaut
  const allPlots = useCosmonautPlots();
  const [refetchCosmonautField]    = useFetchCosmonautField();
  const [refetchCosmonautBalances] = useFetchCosmonautBalances();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: FillOrderFormValues = useMemo(() => ({
    plot: {
      index:  null,
      start:  ZERO_BN,
      end:    null,
      amount: null,
    },
    destination: undefined,
    settings: {
      showRangeSelect: false,
    }
  }), []);

  /// Navigation
  const navigate = useNavigate();

  /// Handlers
  const onSubmit = useCallback(async (values: FillOrderFormValues, formActions: FormikHelpers<FillOrderFormValues>) => {
    let txToast;
    try {
      middleware.before();
      const { index, start, amount } = values.plot;
      if (!index) throw new Error('No plot selected');
      const numPods = allPlots[index];
      if (!numPods) throw new Error('Plot not recognized.');
      if (!start || !amount) throw new Error('Malformatted plot data.');
      if (!values.destination) throw new Error('No destination selected.');
      if (amount.lt(new BigNumber(1))) throw new Error('Amount not greater than minFillAmount.');

      console.debug('[FillOrder]', {
        numPods: numPods.toString(),
        index: index.toString(),
        start: start.toString(),
        amount: amount.toString(),
        sum: start.plus(amount).toString(),
        params: [
          {
            account:        podOrder.account,
            maxPlaceInLine: Moon.stringify(podOrder.maxPlaceInLine),
            pricePerPod:    Moon.stringify(podOrder.pricePerPod),
            minFillAmount:  PODS.stringify(podOrder.minFillAmount || 0), // minFillAmount for Orders is measured in Pods
          },
          Moon.stringify(index),
          Moon.stringify(start),
          Moon.stringify(amount),
          values.destination,
        ]
      });

      txToast = new TransactionToast({
        loading: 'Filling Order...',
        // loading: `Selling ${displayTokenAmount(amount, PODS)} for ${displayTokenAmount(amount.multipliedBy(podOrder.pricePerPod), Moon)}.`,
        success: 'Fill successful.'
      });

      const txn = await moonmage.fillPodOrder(
        {
          account:        podOrder.account,
          maxPlaceInLine: Moon.stringify(podOrder.maxPlaceInLine),
          pricePerPod:    Moon.stringify(podOrder.pricePerPod),
          minFillAmount:  PODS.stringify(podOrder.minFillAmount || 0), // minFillAmount for Orders is measured in Pods
        },
        Moon.stringify(index),    // index of plot to sell
        Moon.stringify(start),    // start index within plot
        Moon.stringify(amount),   // amount of pods to sell
        values.destination,
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautField(),     // refresh plots; decrement pods
        refetchCosmonautBalances(),  // increment balance of MOON received
        // FIXME: refresh orders
      ]);
      txToast.success(receipt);
      formActions.resetForm();

      // Return to market index, open Your Orders
      navigate('/market/sell');
    } catch (err) {
      if (txToast) {
        txToast.error(err);
      } else {
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
    } finally {
      formActions.setSubmitting(false);
    }
  }, [middleware, allPlots, podOrder.account, podOrder.maxPlaceInLine, podOrder.pricePerPod, podOrder.minFillAmount, Moon, moonmage, refetchCosmonautField, refetchCosmonautBalances, navigate]);

  return (
    <Formik<FillOrderFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<FillOrderFormValues>) => (
        <FillOrderV2Form
          podOrder={podOrder}
          plots={allPlots}
          harvestableIndex={harvestableIndex}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default FillOrderForm;
