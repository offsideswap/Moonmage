import { Accordion, AccordionDetails, Alert, Box, Divider, Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FieldWrapper from '~/components/Common/Form/FieldWrapper';
import AddressInputField from '~/components/Common/Form/AddressInputField';
import {
  FormState,
  SmartSubmitButton,
  TokenAdornment,
  TokenInputField,
  TokenOutputField,
  TxnPreview
} from '~/components/Common/Form';
import { ZERO_BN } from '~/constants';
import { Token } from '~/classes';
import { CosmonautSilo } from '~/state/cosmomage/silo';
import { ERC20Token } from '~/classes/Token';
import useCosmonautSiloBalances from '~/hooks/cosmomage/useCosmonautSiloBalances';
import { useFetchCosmonautSilo } from '~/state/cosmomage/silo/updater';
import { useFetchMoonmageSilo } from '~/state/moonmage/silo/updater';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import MoonmageSDK from '~/lib/Moonmage';
import useSeason from '~/hooks/moonmage/useSeason';
import TxnSeparator from '~/components/Common/Form/TxnSeparator';
import { SEEDS, MAGE } from '~/constants/tokens';
import { displayFullBN, displayTokenAmount, toStringBaseUnitBN, trimAddress } from '~/util';
import IconWrapper from '~/components/Common/IconWrapper';
import { FontSize, IconSize } from '~/components/App/muiTheme';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { ActionType } from '~/util/Actions';
import TransactionToast from '~/components/Common/TxnToast';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

export type TransferFormValues = FormState & {
  to: string;
}

const TransferForm: FC<FormikProps<TransferFormValues> & {
  token: Token;
  siloBalances: CosmonautSilo['balances'];
  depositedBalance: BigNumber;
  season: BigNumber;
}> = ({
  // Formik
  values,
  isSubmitting,
  submitForm,
  // Custom
  token: whitelistedToken,
  siloBalances,
  depositedBalance,
  season,
}) => {
  // Input props
  const InputProps = useMemo(() => ({
    endAdornment: (
      <TokenAdornment token={whitelistedToken} />
    )
  }), [whitelistedToken]);

  // Results
  const withdrawResult = MoonmageSDK.Silo.Withdraw.withdraw(
    whitelistedToken,
    values.tokens,
    siloBalances[whitelistedToken.address]?.deposited.crates || [], // fallback
    season,
  );

  const isReady = (withdrawResult && withdrawResult.amount.lt(0));

  const tokenOutputs = isReady ? (
    <>
      <TokenOutputField
        token={whitelistedToken}
        amount={withdrawResult.amount}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="center">
        <Box sx={{ flex: 1 }}>
          <TokenOutputField
            token={MAGE}
            amount={withdrawResult.mage}
            amountTooltip={(
              <>
                <div>Withdrawing
                  from {withdrawResult.deltaCrates.length} Deposit{withdrawResult.deltaCrates.length === 1 ? '' : 's'}:
                </div>
                <Divider sx={{ opacity: 0.2, my: 1 }} />
                {withdrawResult.deltaCrates.map((_crate, i) => (
                  <div key={i}>
                    Season {_crate.season.toString()}: {displayFullBN(_crate.bdv, whitelistedToken.displayDecimals)} BDV, {displayFullBN(_crate.mage, MAGE.displayDecimals)} MAGE, {displayFullBN(_crate.seeds, SEEDS.displayDecimals)} SEEDS
                  </div>
                  ))}
              </>
              )}
            />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TokenOutputField
            token={SEEDS}
            amount={withdrawResult.seeds}
            />
        </Box>
      </Stack>
    </>
    ) :
    null;

  return (
    <Form autoComplete="off">
      {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
      <Stack gap={1}>
        <TokenInputField
          name="tokens.0.amount"
          token={whitelistedToken}
          disabled={!depositedBalance || depositedBalance.eq(0)}
          balance={depositedBalance || ZERO_BN}
          balanceLabel="Deposited Balance"
          InputProps={InputProps}
        />
        {depositedBalance?.gt(0) && (
          <>
            <FieldWrapper label="Transfer to">
              <AddressInputField name="to" />
            </FieldWrapper>
            {values.to !== '' && withdrawResult?.amount.abs().gt(0) && (
              <>
                <TxnSeparator />
                {tokenOutputs}
                <Alert
                  color="warning"
                  icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon sx={{ fontSize: IconSize.small }} /></IconWrapper>}
                >
                  More recent Deposits are Transferred first.
                </Alert>
                <Box>
                  <Accordion defaultExpanded variant="outlined">
                    <StyledAccordionSummary title="Transaction Details" />
                    <AccordionDetails>
                      <TxnPreview
                        actions={[
                          {
                            type: ActionType.TRANSFER,
                            amount: withdrawResult ? withdrawResult.amount.abs() : ZERO_BN,
                            token: whitelistedToken,
                            mage: withdrawResult ? withdrawResult.mage.abs() : ZERO_BN,
                            seeds: withdrawResult ? withdrawResult?.seeds.abs() : ZERO_BN,
                            to: values.to
                          },
                          {
                            type: ActionType.BASE,
                            message: (
                              <>
                                The following Deposits will be used:<br />
                                <ul css={{ paddingLeft: '25px', marginTop: '10px', marginBottom: 0, fontSize: FontSize.sm }}>
                                  {withdrawResult.deltaCrates.map((crate, index) => (
                                    <li key={index}>{displayTokenAmount(crate.amount, whitelistedToken)} from Deposits in Season {crate.season.toString()}</li>
                                  ))}
                                </ul>
                              </>
                            )
                          },
                          {
                            type: ActionType.END_TOKEN,
                            token: whitelistedToken
                          }
                        ]}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </>
            )}
          </>
        )}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isReady || !depositedBalance || depositedBalance.eq(0) || isSubmitting || values.to === ''}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          {!depositedBalance || depositedBalance.eq(0) ? 'Nothing to Transfer' : 'Transfer'}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Transfer: FC<{ token: ERC20Token; }> = ({ token }) => {
  /// Ledger
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Moonmage
  const season = useSeason();

  /// Cosmonaut
  const siloBalances = useCosmonautSiloBalances();
  const [refetchCosmonautSilo] = useFetchCosmonautSilo();
  const [refetchSilo] = useFetchMoonmageSilo();

  /// Form
  const middleware = useFormMiddleware();
  const depositedBalance = siloBalances[token.address]?.deposited.amount;
  const initialValues: TransferFormValues = useMemo(() => ({
    tokens: [
      {
        token: token,
        amount: undefined,
      },
    ],
    to: ''
  }), [token]);

  /// Handlers
  const onSubmit = useCallback(async (values: TransferFormValues, formActions: FormikHelpers<TransferFormValues>) => {
    let txToast;
    try {
      middleware.before();

      const withdrawResult = MoonmageSDK.Silo.Withdraw.withdraw(
        token,
        values.tokens,
        siloBalances[token.address]?.deposited.crates,
        season,
      );
        
      if (!signer) throw new Error('Missing signer');
      if (!withdrawResult) throw new Error('Nothing to Transfer.');
      if (!values.to) throw new Error('Please enter a valid recipient address.');

      let call;
      const seasons = withdrawResult.deltaCrates.map((crate) => crate.season.toString());
      const amounts = withdrawResult.deltaCrates.map((crate) => toStringBaseUnitBN(crate.amount.abs(), token.decimals));

      console.debug('[silo/transfer] transferring: ', {
        withdrawResult,
        calldata: {
          seasons,
          amounts,
        },
      });

      /// Optimize the call used depending on the
      /// number of crates.
      const sender = await signer.getAddress();
      if (seasons.length === 0) {
        throw new Error('Malformatted crates.');
      } else if (seasons.length === 1) {
        call = moonmage.transferDeposit(
          sender,
          values.to,
          token.address,
          seasons[0],
          amounts[0],
        );
      } else {
        call = moonmage.transferDeposits(
          sender,
          values.to,
          token.address,
          seasons,
          amounts,
        );
      }

      txToast = new TransactionToast({
        loading: `Transferring ${displayFullBN(withdrawResult.amount.abs(), token.displayDecimals, token.displayDecimals)} ${token.name} to ${trimAddress(values.to, true)}.`,
        success: 'Transfer successful.',
      });

      const txn = await call;
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautSilo(),
        refetchSilo(),
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
  }, [
    siloBalances,
    moonmage,
    token,
    season,
    refetchCosmonautSilo,
    refetchSilo,
    signer,
    middleware,
  ]);

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}>
      {(formikProps: FormikProps<TransferFormValues>) => (
        <TransferForm
          token={token}
          siloBalances={siloBalances}
          depositedBalance={depositedBalance}
          season={season}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default Transfer;
