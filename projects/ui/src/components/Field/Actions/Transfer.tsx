import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionDetails, Box, Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import AddressInputField from '~/components/Common/Form/AddressInputField';
import FieldWrapper from '~/components/Common/Form/FieldWrapper';
import { PlotFragment, PlotSettingsFragment, SmartSubmitButton, TokenOutputField, TxnPreview, TxnSeparator } from '~/components/Common/Form';
import TransactionToast from '~/components/Common/TxnToast';
import PlotInputField from '~/components/Common/Form/PlotInputField';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useAccount from '~/hooks/ledger/useAccount';
import useCosmonautPlots from '~/hooks/cosmomage/useCosmonautPlots';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';
import { ZERO_BN } from '~/constants';
import { PODS } from '~/constants/tokens';
import { displayFullBN, toStringBaseUnitBN, trimAddress } from '~/util';
import { ActionType } from '~/util/Actions';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import { useFetchCosmonautField } from '~/state/cosmomage/field/updater';

import { FC } from '~/types';

export type TransferFormValues = {
  plot: PlotFragment;
  to: string | null;
  settings: PlotSettingsFragment & {
    slippage: number, // 0.1%
  }
}

export interface SendFormProps {}

const TransferForm: FC<
  SendFormProps &
  FormikProps<TransferFormValues>
> = ({
  values,
  isValid,
  isSubmitting,
}) => {
  /// Data
  const plots = useCosmonautPlots();
  const harvestableIndex = useHarvestableIndex();

  /// Derived
  const plot = values.plot;
  const isReady = (
    plot.index
    && values.to
    && plot.start
    && plot.amount?.gt(0)
    && isValid
  );

  return (
    <Form autoComplete="off">
      <Stack gap={1}>
        <PlotInputField
          plots={plots}
        />
        {plot.index && (
          <FieldWrapper label="Transfer to">
            <AddressInputField name="to" />
          </FieldWrapper>
        )}
        {(values.to && plot.amount && plot.start && plot.index) && (
          <>
            <TxnSeparator />
            <TokenOutputField
              amount={plot.amount.negated()}
              token={PODS}
            />
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type:    ActionType.TRANSFER_PODS,
                        amount:  plot.amount || ZERO_BN,
                        address: values.to !== null ? values.to : '',
                        placeInLine: new BigNumber(plot.index).minus(harvestableIndex).plus(plot.start)
                      },
                      {
                        type: ActionType.END_TOKEN,
                        token: PODS
                      }
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        )}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isReady || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Transfer
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Transfer: FC<{}> = () => {
  /// Ledger
  const account = useAccount();
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Cosmonaut
  const [refetchCosmonautField] = useFetchCosmonautField();

  /// Form setup
  const middleware = useFormMiddleware();
  const initialValues: TransferFormValues = useMemo(() => ({
    plot: {
      index: null,
      start: null,
      end: null,
      amount: null,
    },
    to: null,
    settings: {
      slippage: 0.1, // 0.1%
      showRangeSelect: false,
    },
  }), []);

  /// Handlers
  const onSubmit = useCallback(async (values: TransferFormValues, formActions: FormikHelpers<TransferFormValues>) => {
    let txToast;
    try {
      middleware.before();

      if (!account) throw new Error('Connect a wallet first.');
      const { to, plot: { index, start, end, amount } } = values;
      if (!to || !index || !start || !end || !amount) throw new Error('Missing data.');

      const call = moonmage.transferPlot(
        account,
        to.toString(),
        toStringBaseUnitBN(index, PODS.decimals),
        toStringBaseUnitBN(start, PODS.decimals),
        toStringBaseUnitBN(end,   PODS.decimals),
      );

      txToast = new TransactionToast({
        loading: `Transferring ${displayFullBN(amount.abs(), PODS.decimals)} Pods to ${trimAddress(to, true)}...`,
        success: 'Plot Transfer successful.',
      });

      const txn = await call;
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautField(),
      ]);

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
  }, [
    account,
    moonmage,
    refetchCosmonautField,
    middleware,
  ]);

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}>
      {(formikProps: FormikProps<TransferFormValues>) => (
        <TransferForm
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default Transfer;
