import React, { useCallback, useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import {
  SmartSubmitButton,
  TokenAdornment,
  TokenInputField,
  TokenOutputField,
  TxnSeparator
} from '~/components/Common/Form';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import TxnAccordion from '~/components/Common/TxnAccordion';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TransactionToast from '~/components/Common/TxnToast';
import useCosmonautFertilizer from '~/hooks/cosmomage/useCosmonautFertilizer';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { useSigner } from '~/hooks/ledger/useSigner';
import useAccount from '~/hooks/ledger/useAccount';
import { FarmToMode } from '~/lib/Moonmage/Farm';
import { displayFullBN } from '~/util';
import { useFetchCosmonautShip } from '~/state/cosmomage/ship/updater';
import { ZERO_BN } from '~/constants';
import { MOON, SPROUTS } from '~/constants/tokens';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { ActionType } from '~/util/Actions';
import copy from '~/constants/copy';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';

// ---------------------------------------------------

type RinseFormValues = {
  destination: FarmToMode | undefined;
  amount: BigNumber;
};

// ---------------------------------------------------

const QuickRinseForm: FC<
  FormikProps<RinseFormValues>
> = ({
  values,
  isSubmitting
}) => {
  /// Extract
  const amountSprouts = values.amount;
  const isSubmittable = (
    amountSprouts?.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <Stack sx={{ px: 0.5 }} spacing={0.5}>
          <Row justifyContent="space-between">
            <Typography color="primary">
              Rinsable Sprouts
            </Typography>
            <Row gap={0.5}>
              <TokenIcon token={SPROUTS} />
              <Typography variant="h3">
                {displayFullBN(amountSprouts, 0)}
              </Typography>
            </Row>
          </Row>
          <FarmModeField name="destination" />
        </Stack>
        {/* Submit */}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable}
          type="submit"
          variant="contained"
          color="primary"
          size="medium"
          tokens={[]}
          mode="auto"
        >
          Rinse
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const RinseForm : FC<
  FormikProps<RinseFormValues>
> = ({
  values,
  isSubmitting,
}) => {
  /// Extract
  const amountSprouts = values.amount;
  const isSubmittable = (
    amountSprouts?.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        {/* Inputs */}
        <TokenInputField
          token={SPROUTS}
          balanceLabel="Rinsable Balance"
          balance={amountSprouts || ZERO_BN}
          name="amount"
          disabled
          // MUI
          fullWidth
          InputProps={{
            endAdornment: (
              <TokenAdornment
                token={SPROUTS}
              />
            )
          }}
        />
        <FarmModeField
          name="destination"
        />
        {/* Outputs */}
        {amountSprouts?.gt(0) ? (
          <>
            <TxnSeparator />
            <TokenOutputField
              token={MOON[1]}
              amount={amountSprouts}
            />
            <Box sx={{ width: '100%', mt: 0 }}>
              <TxnAccordion defaultExpanded={false}>
                <TxnPreview
                  actions={[
                    {
                      type: ActionType.RINSE,
                      amount: amountSprouts,
                    },
                    {
                      type: ActionType.RECEIVE_MOONS,
                      amount: amountSprouts,
                      destination: values.destination,
                    },
                  ]}
                />
              </TxnAccordion>
            </Box>
          </>
        ) : null}
        {/* Submit */}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Rinse
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Rinse : FC<{ quick?: boolean }> = ({ quick }) => {
  /// Wallet connection
  const account = useAccount();
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);
  
  /// Cosmonaut
  const cosmomageShip          = useCosmonautFertilizer();
  const [refetchCosmonautShip] = useFetchCosmonautShip();
  const [refetchBalances]   = useFetchCosmonautBalances();
  
  /// Form
  const middleware = useFormMiddleware();
  const initialValues : RinseFormValues = useMemo(() => ({
    destination: undefined,
    amount: cosmomageShip.fertilizedSprouts,
  }), [cosmomageShip.fertilizedSprouts]);

  /// Handlers
  const onSubmit = useCallback(async (values: RinseFormValues, formActions: FormikHelpers<RinseFormValues>) => {
    let txToast;
    try {
      middleware.before();

      if (!cosmomageShip.fertilizedSprouts) throw new Error('No Sprouts to Rinse.');
      if (!values.destination) throw new Error('No destination set.');
      if (!account) throw new Error('Connect a wallet first.');

      txToast = new TransactionToast({
        loading: `Rinsing ${displayFullBN(cosmomageShip.fertilizedSprouts, SPROUTS.displayDecimals)} Sprouts...`,
        success: `Rinse successful. Added ${displayFullBN(cosmomageShip.fertilizedSprouts, SPROUTS.displayDecimals)} Moons to your ${copy.MODES[values.destination]}.`,
      });

      const txn = await moonmage.claimFertilized(
        cosmomageShip.balances.map((bal) => bal.token.id.toString()),
        values.destination
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautShip(),
        refetchBalances()
      ]);
      txToast.success(receipt);
      formActions.resetForm({
        values: {
          destination: FarmToMode.INTERNAL,
          amount: ZERO_BN,
        }
      });
    } catch (err) {
      if (txToast) {
        txToast.error(err);
      } else {
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
    }
  }, [
    moonmage,
    account,
    cosmomageShip?.balances,
    cosmomageShip?.fertilizedSprouts,
    refetchCosmonautShip,
    refetchBalances,
    middleware,
  ]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} enableReinitialize>
      {(formikProps) => 
        (quick 
          ? <QuickRinseForm {...formikProps} /> 
          : <RinseForm {...formikProps} />
        )
      }
    </Formik>
  );
};

export default Rinse;
