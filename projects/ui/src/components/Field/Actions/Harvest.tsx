import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionDetails, Box, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import { useAccount as useWagmiAccount, useProvider } from 'wagmi';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import {
  SmartSubmitButton, TokenInputField, TokenOutputField,
  TxnPreview,
  TxnSeparator
} from '~/components/Common/Form';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { ActionType } from '~/util/Actions';
import Farm, { FarmToMode } from '~/lib/Moonmage/Farm';
import { displayFullBN, toStringBaseUnitBN } from '~/util';
import useCosmonautField from '~/hooks/cosmomage/useCosmonautField';
import { useFetchCosmonautField } from '~/state/cosmomage/field/updater';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { MOON, PODS } from '~/constants/tokens';
import copy from '~/constants/copy';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TransactionToast from '~/components/Common/TxnToast';
import { ZERO_BN } from '~/constants';
import TokenAdornment from '~/components/Common/Form/TokenAdornment';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';

// -----------------------------------------------------------------------

type HarvestFormValues = {
  amount: BigNumber;
  destination: FarmToMode | undefined;
}

type Props = FormikProps<HarvestFormValues> & {
  harvestablePods: BigNumber;
  farm: Farm;
}

const QuickHarvestForm: FC<Props> = ({
  // Custom
  harvestablePods,
  // Formike
  values,
  isSubmitting
}) => {
    /// Derived
    const amount = harvestablePods;
    const isSubmittable = (
      amount
      && amount.gt(0)
      && values.destination !== undefined
    );

    return (
      <Form autoComplete="off" noValidate>
        <Stack gap={1}>
          <Stack px={0.5} spacing={0.5}>
            <Row justifyContent="space-between">
              <Typography color="primary">
                Harvestable Pods
              </Typography>
              <Row gap={0.5}>
                <TokenIcon token={PODS} />
                <Typography variant="h3">
                  {displayFullBN(amount, 0)}
                </Typography>
              </Row>
            </Row>
            <FarmModeField name="destination" />
          </Stack>
          <SmartSubmitButton
            loading={isSubmitting}
            disabled={!isSubmittable || isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            tokens={[]}
            mode="auto"
        >
            Harvest
          </SmartSubmitButton>
        </Stack>
      </Form>
    );
};

// -----------------------------------------------------------------------

const HarvestForm: FC<Props> = ({
  // Custom
  harvestablePods,
  // Formik
  values,
  isSubmitting,
}) => {
  /// Derived
  const amount = harvestablePods;
  const isSubmittable = (
    amount
    && amount.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        {/* Claimable Token */}
        <TokenInputField
          name="amount"
          balance={amount}
          balanceLabel="Harvestable Balance"
          disabled
          InputProps={{
            endAdornment: (
              <TokenAdornment
                token={PODS}
              />
            )
          }}
        />
        {/* Transaction Details */}
        {values.amount?.gt(0) ? (
          <>
            {/* Setting: Destination */}
            <FarmModeField
              name="destination"
            />
            <TxnSeparator mt={-1} />
            <TokenOutputField
              token={MOON[1]}
              amount={values.amount || ZERO_BN}
            />
            {/* <Box>
              <Alert
                color="warning"
                icon={
                  <IconWrapper boxSize={IconSize.medium}><WarningAmberIcon
                    sx={{ fontSize: IconSize.small }} />
                  </IconWrapper>
                }
              >
                You can Harvest your Pods and Deposit Moons into the Silo in one transaction on the&nbsp;
                <Link href={`/#/silo/${moon.address}`}>Moon</Link> or <Link href={`/#/silo/${lp.address}`}>LP</Link> Deposit
                page.
              </Alert>
            </Box> */}
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.HARVEST,
                        amount: amount
                      },
                      {
                        type: ActionType.RECEIVE_MOONS,
                        amount: amount,
                        destination: values.destination,
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Harvest
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Harvest: FC<{ quick?: boolean }> = ({ quick }) => {
  ///
  const account = useWagmiAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Farm
  const farm = useMemo(() => new Farm(provider), [provider]);

  /// Cosmonaut
  const cosmomageField = useCosmonautField();
  const [refetchCosmonautField] = useFetchCosmonautField();
  const [refetchCosmonautBalances] = useFetchCosmonautBalances();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: HarvestFormValues = useMemo(() => ({
    amount: cosmomageField.harvestablePods || null,
    destination: undefined,
  }), [cosmomageField.harvestablePods]);

  /// Handlers
  const onSubmit = useCallback(
    async (
      values: HarvestFormValues,
      formActions: FormikHelpers<HarvestFormValues>
    ) => {
      let txToast;
      try {
        middleware.before();
        if (!cosmomageField.harvestablePods.gt(0)) throw new Error('No Harvestable Pods.');
        if (!cosmomageField.harvestablePlots) throw new Error('No Harvestable Plots.');
        if (!account?.address) throw new Error('Connect a wallet first.');
        if (!values.destination) throw new Error('No destination set.');

        txToast = new TransactionToast({
          loading: `Harvesting ${displayFullBN(cosmomageField.harvestablePods, PODS.displayDecimals)} Pods.`,
          success: `Harvest successful. Added ${displayFullBN(cosmomageField.harvestablePods, PODS.displayDecimals)} Moons to your ${copy.MODES[values.destination]}.`,
        });

        const txn = await moonmage.harvest(
          Object.keys(cosmomageField.harvestablePlots).map((harvestIndex) =>
            toStringBaseUnitBN(harvestIndex, 6)
          ),
          values.destination
        );
        txToast.confirming(txn);

        const receipt = await txn.wait();
        await Promise.all([
          refetchCosmonautField(),
          refetchCosmonautBalances()
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
        formActions.setSubmitting(false);
      }
    },
    [
      account?.address,
      moonmage,
      cosmomageField.harvestablePlots,
      cosmomageField.harvestablePods,
      refetchCosmonautBalances,
      refetchCosmonautField,
      middleware,
    ]
  );

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <Stack spacing={1}>
          {quick ? (
            <QuickHarvestForm 
              harvestablePods={cosmomageField.harvestablePods}
              farm={farm}
              {...formikProps}
            />
          ) : (
            <HarvestForm
              harvestablePods={cosmomageField.harvestablePods}
              farm={farm}
              {...formikProps}
          />
          )}
        </Stack>
      )}
    </Formik>
  );
};

export default Harvest;
