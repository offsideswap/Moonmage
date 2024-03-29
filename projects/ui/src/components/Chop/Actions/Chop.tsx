import { Accordion, AccordionDetails, Box, CircularProgress, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  FormState,
  SmartSubmitButton,
  TokenAdornment,
  TokenOutputField,
  TokenSelectDialog,
  TxnPreview,
  TxnSeparator
} from '~/components/Common/Form';
import { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import TokenInputField from '~/components/Common/Form/TokenInputField';
import { MoonmagePalette } from '~/components/App/muiTheme';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import { Moonmage } from '~/generated/index';
import useToggle from '~/hooks/display/useToggle';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useCosmonautBalances from '~/hooks/cosmomage/useCosmonautBalances';
import useTokenMap from '~/hooks/chain/useTokenMap';
import { useSigner } from '~/hooks/ledger/useSigner';
import useAccount from '~/hooks/ledger/useAccount';
import usePreferredToken, { PreferredToken } from '~/hooks/cosmomage/usePreferredToken';
import { FarmToMode } from '~/lib/Moonmage/Farm';
import { ActionType } from '~/util/Actions';
import { displayBN, displayFullBN, optimizeFromMode, toStringBaseUnitBN } from '~/util';
import { UNRIPE_MOON, UNRIPE_MOON_CRV3, UNRIPE_TOKENS } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { AppState } from '~/state';
import useUnripeUnderlyingMap from '~/hooks/moonmage/useUnripeUnderlying';
import Row from '~/components/Common/Row';
import { FC } from '~/types';
import TransactionToast from '~/components/Common/TxnToast';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

type ChopFormValues = FormState & {
  destination: FarmToMode | undefined;
};

const ChopForm: FC<
  FormikProps<ChopFormValues> & {
    balances: ReturnType<typeof useCosmonautBalances>;
    moonmage: Moonmage;
  }
> = ({
  values,
  setFieldValue,
  balances,
  moonmage,
}) => {
  const erc20TokenMap = useTokenMap<ERC20Token | NativeToken>(UNRIPE_TOKENS);
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();
  const unripeUnderlying = useUnripeUnderlyingMap();

  /// Derived values
  const state          = values.tokens[0];
  const inputToken     = state.token;
  const tokenBalance   = balances[inputToken.address];
  const outputToken    = unripeUnderlying[inputToken.address];

  /// Chop Penalty  = 99% <-> Chop Rate     = 0.01
  const unripeTokens = useSelector<AppState, AppState['_moon']['unripe']>((_state) => _state._moon.unripe);
  const amountOut = state.amount?.multipliedBy(unripeTokens[inputToken.address]?.chopRate || ZERO_BN);
  const chopPenalty = unripeTokens[inputToken.address]?.chopPenalty || new BigNumber(100);

  ///
  const handleSelectTokens = useCallback((_tokens: Set<Token>) => {
    // If the user has typed some existing values in,
    // save them. Add new tokens to the end of the list.
    // FIXME: match sorting of erc20TokenList
    const copy = new Set(_tokens);
    const newValue = values.tokens.filter((x) => {
      copy.delete(x.token);
      return _tokens.has(x.token);
    });
    setFieldValue('tokens', [
      ...newValue,
      ...Array.from(copy).map((_token) => ({ 
        token: _token, 
        amount: undefined // balances[_token.address]?.total || 
      })),
    ]);
  }, [values.tokens, setFieldValue]);

  const isSubmittable = (
    amountOut?.gt(0)
    && values.destination
  );

  return (
    <Form autoComplete="off">
      <TokenSelectDialog
        open={isTokenSelectVisible}
        handleClose={hideTokenSelect}
        handleSubmit={handleSelectTokens}
        selected={values.tokens}
        balances={balances}
        tokenList={Object.values(erc20TokenMap)}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        <TokenInputField
          token={inputToken}
          balance={tokenBalance || ZERO_BN}
          name="tokens.0.amount"
          // MUI 
          fullWidth
          InputProps={{
            endAdornment: (
              <TokenAdornment
                token={inputToken}
                onClick={showTokenSelect}
              />
            )
          }}
        />
        <Stack gap={0.5}>
          <FarmModeField
            name="destination"
          />
          <Row justifyContent="space-between" px={0.5}>
            <Typography variant="body1" color="text.tertiary">Chop Penalty</Typography>
            {!unripeTokens[inputToken.address] ? (
              <CircularProgress size={16} thickness={5} sx={{ color: MoonmagePalette.theme.winter.red }} />
            ) : (
              <Typography variant="body1" color={MoonmagePalette.theme.winter.error}>
                {displayFullBN(chopPenalty, 5)}%
              </Typography>
            )}
          </Row>
        </Stack>
        {isSubmittable ? (
          <>
            <TxnSeparator />
            <TokenOutputField
              token={outputToken}
              amount={amountOut || ZERO_BN}
            />
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.BASE,
                        message: `Chop ${displayBN(state.amount || ZERO_BN)} ${inputToken}.`
                      },
                      {
                        type: ActionType.BASE,
                        message: `Add ${displayBN(amountOut || ZERO_BN)} ${outputToken} to the balance selected in the Destination field.`
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!isSubmittable}
          contract={moonmage}
          tokens={values.tokens}
          mode="auto"
        >
          Chop
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// ---------------------------------------------------

const PREFERRED_TOKENS : PreferredToken[] = [
  {
    token: UNRIPE_MOON,
    minimum: new BigNumber(1),
  },
  {
    token: UNRIPE_MOON_CRV3,
    minimum: new BigNumber(1),
  }
];

const Chop: FC<{}> = () => {
  /// Ledger
  const account           = useAccount();
  const { data: signer }  = useSigner();
  const moonmage         = useMoonmageContract(signer);

  /// Cosmonaut
  const cosmomageBalances    = useCosmonautBalances();
  const [refetchCosmonautBalances] = useFetchCosmonautBalances();
  
  /// Form
  const middleware = useFormMiddleware();
  const baseToken = usePreferredToken(PREFERRED_TOKENS, 'use-best');
  const initialValues: ChopFormValues = useMemo(() => ({
    tokens: [
      {
        token:  baseToken as ERC20Token,
        amount: undefined,
      },
    ],
    destination: FarmToMode.INTERNAL,
  }), [baseToken]);

  /// Handlers
  const onSubmit = useCallback(
    async (
      values: ChopFormValues,
      formActions: FormikHelpers<ChopFormValues>
    ) => {
      let txToast;
      try {
        middleware.before();

        if (!account) throw new Error('Connect a wallet first.');
        if (!values.destination) throw new Error('No destination selected.');
        const state = values.tokens[0];
        if (!state.amount?.gt(0)) throw new Error('No Unfertilized token to Chop.');

        txToast = new TransactionToast({
          loading: `Chopping ${displayFullBN(state.amount)} ${state.token.symbol}...`,
          success: 'Chop successful.',
        });

        const txn = await moonmage.chop(
          state.token.address,
          toStringBaseUnitBN(state.amount, state.token.decimals),
          optimizeFromMode(state.amount, cosmomageBalances[state.token.address]),
          values.destination
        );
        txToast.confirming(txn);

        const receipt = await txn.wait();
        await Promise.all([refetchCosmonautBalances()]); // should we also refetch the penalty?
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
      account,
      moonmage,
      refetchCosmonautBalances,
      cosmomageBalances,
      middleware,
    ]
  );

  return (
    <Formik<ChopFormValues>
      enableReinitialize
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<ChopFormValues>) => (
        <ChopForm
          balances={cosmomageBalances}
          moonmage={moonmage}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default Chop;
