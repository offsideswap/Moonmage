import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, Alert, Box, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ethers } from 'ethers';
import TokenOutputField from '~/components/Common/Form/TokenOutputField';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { FormState, SettingInput, SmartSubmitButton, TxnSettings } from '~/components/Common/Form';
import TokenQuoteProvider from '~/components/Common/Form/TokenQuoteProvider';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import Pool from '~/classes/Pool';
import TxnSeparator from '~/components/Common/Form/TxnSeparator';
import PillRow from '~/components/Common/Form/PillRow';
import TokenSelectDialog, { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import { MOON, MOON_CRV3_LP, SEEDS, MAGE, UNRIPE_MOON, UNRIPE_MOON_CRV3 } from '~/constants/tokens';
import MoonmageSDK from '~/lib/Moonmage';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { displayFullBN, MaxBN, MinBN, toStringBaseUnitBN } from '~/util/Tokens';
import { Moonmage } from '~/generated/index';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import { ZERO_BN } from '~/constants';
import Farm from '~/lib/Moonmage/Farm';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import useToggle from '~/hooks/display/useToggle';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useFetchCosmonautSilo } from '~/state/cosmomage/silo/updater';
import { tokenResult } from '~/util';
import { CosmonautSilo } from '~/state/cosmomage/silo';
import useSeason from '~/hooks/moonmage/useSeason';
import { convert, Encoder as ConvertEncoder } from '~/lib/Moonmage/Silo/Convert';
import TransactionToast from '~/components/Common/TxnToast';
import useBDV from '~/hooks/moonmage/useBDV';
import TokenIcon from '~/components/Common/TokenIcon';
import { useFetchPools } from '~/state/moon/pools/updater';
import { ActionType } from '~/util/Actions';
import { IconSize } from '~/components/App/muiTheme';
import IconWrapper from '~/components/Common/IconWrapper';
import useCosmonautSilo from '~/hooks/cosmomage/useCosmonautSilo';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// -----------------------------------------------------------------------

type ConvertFormValues = FormState & {
  settings: {
    slippage: number;
  };
  maxAmountIn: BigNumber | undefined;
  tokenOut: Token | undefined;
};

// -----------------------------------------------------------------------

const INIT_CONVERSION = {
  amount: ZERO_BN,
  bdv:    ZERO_BN,
  mage:  ZERO_BN,
  seeds:  ZERO_BN,
  actions: []
};

const ConvertForm : FC<
  FormikProps<ConvertFormValues> & {
    /** List of tokens that can be converted to. */
    tokenList: (ERC20Token | NativeToken)[];
    /** Cosmonaut's silo balances */
    siloBalances: CosmonautSilo['balances'];
    moonmage: Moonmage;
    handleQuote: QuoteHandler;
    currentSeason: BigNumber;
  }
> = ({
  tokenList,
  siloBalances,
  moonmage,
  handleQuote,
  currentSeason,
  // Formik
  values,
  isSubmitting,
  setFieldValue,
}) => {
  /// Local state
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();
  const getBDV = useBDV();

  /// Extract values from form state
  const tokenIn   = values.tokens[0].token;     // converting from token
  const amountIn  = values.tokens[0].amount;    // amount of from token
  const tokenOut  = values.tokenOut;            // converting to token
  const amountOut = values.tokens[0].amountOut; // amount of to token
  const maxAmountIn     = values.maxAmountIn;
  const canConvert      = maxAmountIn?.gt(0) || false;
  const siloBalance     = siloBalances[tokenIn.address]; // FIXME: this is mistyped, may not exist
  const depositedAmount = siloBalance?.deposited.amount || ZERO_BN;
  const isQuoting = values.tokens[0].quoting || false;

  /// Derived form state
  let isReady        = false;
  let buttonLoading  = false;
  let buttonContent  = 'Convert';
  let bdvOut;     // the BDV received after re-depositing `amountOut` of `tokenOut`.
  let bdvIn;
  let deltaBDV : (BigNumber | undefined); // the change in BDV during the convert. should always be >= 0.
  let deltaMage; // the change in Mage during the convert. should always be >= 0.
  let deltaSeedsPerBDV; // change in seeds per BDV for this pathway. ex: moon (2 seeds) -> moon:3crv (4 seeds) = +2 seeds.
  let deltaSeeds; // the change in seeds during the convert.

  ///
  const [conversion, setConversion] = useState(INIT_CONVERSION);
  const runConversion = useCallback((_amountIn: BigNumber) => {
    if (!tokenOut) {
      setConversion(INIT_CONVERSION);
    } else if (tokenOut && !isQuoting) {
      console.debug('[Convert] setting conversion, ', tokenOut, isQuoting);
      setConversion(
        convert(
          tokenIn,   // from
          tokenOut,  // to
          _amountIn, // amount
          siloBalance?.deposited.crates || [], // depositedCrates
          currentSeason,
        )
      );
    }
  }, [currentSeason, isQuoting, siloBalance?.deposited.crates, tokenIn, tokenOut]);

  /// FIXME: is there a better pattern for this?
  /// we want to refresh the conversion info only
  /// when the quoting is complete and amountOut
  /// has been updated respectively. if runConversion
  /// depends on amountIn it will run every time the user
  /// types something into the input.
  useEffect(() => {
    runConversion(amountIn || ZERO_BN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountOut, runConversion]);

  /// Change button state and prepare outputs
  if (depositedAmount.eq(0)) {
    buttonContent = 'Nothing to Convert';
  } else if (values.maxAmountIn === null) {
    if (values.tokenOut) {
      buttonContent = 'Refreshing convert data...';
      buttonLoading = false;
    } else {
      buttonContent = 'No output selected';
      buttonLoading = false;
    }
  } else if (!canConvert) {
    // buttonContent = 'Pathway unavailable';
  } else  {
    buttonContent = 'Convert';
    if (tokenOut && amountOut?.gt(0)) {
      isReady    = true;
      bdvOut     = getBDV(tokenOut).times(amountOut);
      deltaBDV   = MaxBN(
        bdvOut.minus(conversion.bdv.abs()),
        ZERO_BN
      );
      deltaMage = MaxBN(
        tokenOut.getMage(deltaBDV),
        ZERO_BN
      );
      deltaSeedsPerBDV = (
        tokenOut.getSeeds()
          .minus(tokenIn.getSeeds())
      );
      deltaSeeds = (
        tokenOut.getSeeds(bdvOut)  // seeds for depositing this token with new BDV
          .minus(conversion.seeds.abs())   // seeds lost when converting
      );
      //
      console.log(`BDV: ${getBDV(tokenOut)}`);
      console.log(`amountOut: ${amountOut}`);
      console.log(`bdvIn: ${conversion.bdv}`);
      console.log(`bdvOut: ${bdvOut}`);
      console.log('Conversion: ', conversion);
    }
  }
  
  /// When a new output token is selected, reset maxAmountIn.
  const handleSelectTokenOut = useCallback(async (_tokens: Set<Token>) => {
    const arr = Array.from(_tokens);
    if (arr.length !== 1) throw new Error();
    const _tokenOut = arr[0];
    /// only reset if the user clicked a different token
    if (tokenOut !== _tokenOut) {
      setFieldValue('tokenOut', _tokenOut);
      setFieldValue('maxAmountIn', null);
    }
  }, [setFieldValue, tokenOut]);

  /// When `tokenIn` or `tokenOut` changes, refresh the
  /// max amount that the user can input of `tokenIn`.
  /// FIXME: flash when clicking convert tab
  useEffect(() => {
    (async () => {
      if (tokenOut) {
        const _maxAmountIn = (
          await moonmage.getMaxAmountIn(
            tokenIn.address,
            tokenOut.address,
          )
          .then(tokenResult(tokenIn))
          .catch(() => ZERO_BN) // if calculation fails, consider this pathway unavailable
        );
        setFieldValue('maxAmountIn', _maxAmountIn);
      }
    })();
  }, [moonmage, setFieldValue, tokenIn, tokenOut]);

  const maxAmountUsed = (amountIn && maxAmountIn) ? amountIn.div(maxAmountIn) : null;

  return (
    <Form noValidate autoComplete="off">
      <TokenSelectDialog
        open={isTokenSelectVisible}
        handleClose={hideTokenSelect}
        handleSubmit={handleSelectTokenOut}
        selected={values.tokens}
        tokenList={tokenList}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        {/* Input token */}
        <TokenQuoteProvider
          name="tokens.0"
          tokenOut={(tokenOut || tokenIn) as ERC20Token}
          max={MinBN(values.maxAmountIn || ZERO_BN, depositedAmount)}
          balance={depositedAmount}
          balanceLabel="Deposited Balance"
          state={values.tokens[0]}
          handleQuote={handleQuote}
          displayQuote={(_amountOut) => (
            (_amountOut && deltaBDV) && (
              <Typography variant="body1">
                ~{displayFullBN(conversion.bdv.abs(), 2)} BDV
              </Typography>
            )
          )}
          tokenSelectLabel={tokenIn.symbol}
          disabled={(
            !values.maxAmountIn         // still loading `maxAmountIn`
            || values.maxAmountIn.eq(0) // = 0 means we can't make this conversion
          )}
        />
        {/* Output token */}
        {depositedAmount.gt(0) ? (
          <PillRow
            isOpen={isTokenSelectVisible}
            label="Convert to"
            onClick={showTokenSelect}
          >
            {tokenOut ? <TokenIcon token={tokenOut} /> : null}
            <Typography>{tokenOut?.symbol || 'Select token'}</Typography>
          </PillRow>
        ) : null}
        {(!canConvert && tokenOut) ? (
          <Box>
            <Alert
              color="warning"
              icon={(
                <IconWrapper boxSize={IconSize.medium}>
                  <WarningAmberIcon sx={{ fontSize: IconSize.small, alignItems: 'flex-start' }} />
                </IconWrapper>
              )}
            >
              {tokenIn.symbol} can only be Converted to {tokenOut.symbol} when deltaB {tokenIn.isLP || tokenIn.symbol === 'urMOON3CRV' ? '<' : '>'} 0.<br />
              {/* <Typography sx={{ opacity: 0.7 }} fontSize={FontSize.sm}>Press ⌥ + 1 to see deltaB.</Typography> */}
            </Alert>
          </Box>
        ) : null}
        {(amountIn && tokenOut && maxAmountIn && amountOut?.gt(0)) ? (
          <>
            <TxnSeparator mt={-1} />
            <TokenOutputField
              token={tokenOut}
              amount={amountOut || ZERO_BN}
              amountSecondary={bdvOut ? `~${displayFullBN(bdvOut, 2)} BDV` : undefined}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="center">
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={MAGE}
                  amount={deltaMage || ZERO_BN}
                  amountTooltip={( 
                    deltaBDV?.gt(0) ? (
                      <>
                        Converting will increase the BDV of your Deposit by {displayFullBN(deltaBDV || ZERO_BN, 6)}{deltaBDV?.gt(0) ? ', resulting in a gain of Mage' : ''}.
                      </>
                    ) : (
                      <>
                        The BDV of your Deposit won&apos;t change with this Convert.
                      </>
                    )
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={SEEDS}
                  amount={deltaSeeds || ZERO_BN}
                  amountTooltip={(
                    <>
                      Converting from {tokenIn.symbol} to {tokenOut.symbol} results in {(
                        (!deltaSeedsPerBDV || deltaSeedsPerBDV.eq(0)) 
                          ? 'no change in SEEDS per BDV'
                          : `a ${deltaSeedsPerBDV.gt(0) ? 'gain' : 'loss'} of ${deltaSeedsPerBDV.abs().toString()} Seeds per BDV`
                      )}.
                    </>
                  )}
                />
              </Box>
            </Stack>
            {(maxAmountUsed && maxAmountUsed.gt(0.9)) ? (
              <Box>
                <Alert color="warning" icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon color="warning" sx={{ fontSize: IconSize.small }} /></IconWrapper>}>
                  You are converting {displayFullBN(maxAmountUsed.times(100), 4, 0)}% of the way to the peg. 
                  When Converting all the way to the peg, the Convert may fail due to a small amount of slippage in the direction of the peg.
                </Alert>
              </Box>
            ) : null}
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.BASE,
                        message: `Convert ${displayFullBN(amountIn, tokenIn.displayDecimals)} ${tokenIn.name} to ${displayFullBN(amountOut, tokenIn.displayDecimals)} ${tokenOut.name}.`
                      },
                      {
                        type: ActionType.UPDATE_SILO_REWARDS,
                        mage: deltaMage || ZERO_BN,
                        seeds: deltaSeeds || ZERO_BN,
                      }
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={buttonLoading || isQuoting}
          disabled={!isReady || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          {buttonContent}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// -----------------------------------------------------------------------

const Convert : FC<{
  pool: Pool;
  fromToken: ERC20Token | NativeToken;
}> = ({
  pool,
  fromToken
}) => {
  /// Tokens
  const getChainToken = useGetChainToken();
  const Moon          = getChainToken(MOON);
  const MoonCrv3      = getChainToken(MOON_CRV3_LP);
  const urMoon        = getChainToken(UNRIPE_MOON);
  const urMoonCrv3    = getChainToken(UNRIPE_MOON_CRV3);

  /// Ledger
  const { data: signer }  = useSigner();
  const moonmage         = useMoonmageContract(signer);
  
  /// Token List
  const [tokenList, initialTokenOut] = useMemo(() => {
    const allTokens = (fromToken === urMoon || fromToken === urMoonCrv3)
      ? [
        urMoon,
        urMoonCrv3,
      ]
      : [
        Moon,
        MoonCrv3,
      ];
    const _tokenList = allTokens.filter((_token) => _token !== fromToken);
    return [
      _tokenList,     // all available tokens to convert to
      _tokenList[0],  // tokenOut is the first available token that isn't the fromToken
    ];
  }, [urMoon, urMoonCrv3, Moon, MoonCrv3, fromToken]);

  /// Moonmage
  const season = useSeason();

  /// Cosmonaut
  const cosmomageSilo              = useCosmonautSilo();
  const cosmomageSiloBalances      = cosmomageSilo.balances;
  const [refetchCosmonautSilo]     = useFetchCosmonautSilo();
  const [refetchPools]          = useFetchPools();

  /// Form
  const middleware    = useFormMiddleware();
  const initialValues : ConvertFormValues = useMemo(() => ({
    // Settings
    settings: {
      slippage: 0.1,
    },
    // Token Inputs
    tokens: [
      {
        token:      fromToken,
        amount:     undefined,
        quoting:    false,
        amountOut:  undefined,
      },
    ],
    // Convert data
    maxAmountIn:    undefined,
    // Token Outputs
    tokenOut:       initialTokenOut,
  }), [fromToken, initialTokenOut]);

  /// Handlers
  // This handler does not run when _tokenIn = _tokenOut (direct deposit)
  const handleQuote = useCallback<QuoteHandler>(
    async (_tokenIn, _amountIn, _tokenOut) => moonmage.getAmountOut(
      _tokenIn.address,
      _tokenOut.address,
      toStringBaseUnitBN(_amountIn, _tokenIn.decimals),
    ).then(tokenResult(_tokenOut)),
    [moonmage]
  );

  const onSubmit = useCallback(async (values: ConvertFormValues, formActions: FormikHelpers<ConvertFormValues>) => {
    let txToast;
    try {
      middleware.before();
      if (!values.settings.slippage) throw new Error('No slippage value set.');
      if (!values.tokenOut) throw new Error('No output token selected');
      if (!values.tokens[0].amount?.gt(0)) throw new Error('No amount input');
      if (!values.tokens[0].amountOut) throw new Error('No quote available.');
      
      const tokenIn   = values.tokens[0].token;     // converting from token
      const amountIn  = values.tokens[0].amount;    // amount of from token
      const tokenOut  = values.tokenOut;            // converting to token
      const amountOut = values.tokens[0].amountOut; // amount of to token
      const amountInStr  = tokenIn.stringify(amountIn);
      const amountOutStr = Farm.slip(
        ethers.BigNumber.from(tokenOut.stringify(amountOut)),
        values.settings.slippage / 100
      ).toString();
      
      const depositedCrates = cosmomageSiloBalances[tokenIn.address]?.deposited?.crates;
      if (!depositedCrates) throw new Error('No deposited crates available.');

      const conversion = MoonmageSDK.Silo.Convert.convert(
        tokenIn,  // from
        tokenOut, // to
        amountIn,
        depositedCrates,
        season,
      );

      txToast = new TransactionToast({
        loading: 'Converting...',
        success: 'Convert successful.',
      });

      /// FIXME:
      /// Once the number of pathways increases, use a matrix
      /// to calculate available conversions and the respective
      /// encoding strategy. Just gotta get to Replant...
      let convertData;
      if (tokenIn === urMoon && tokenOut === urMoonCrv3) {
        convertData = ConvertEncoder.unripeMoonsToLP(
          amountInStr,      // amountMoons
          amountOutStr,     // minLP
        );
      } else if (tokenIn === urMoonCrv3 && tokenOut === urMoon) {
        convertData = ConvertEncoder.unripeLPToMoons(
          amountInStr,      // amountLP
          amountOutStr,     // minMoons
        );
      } else if (tokenIn === Moon && tokenOut === MoonCrv3) {
        convertData = ConvertEncoder.moonsToCurveLP(
          amountInStr,      // amountMoons
          amountOutStr,     // minLP
          tokenOut.address, // output token address = pool address
        );
      } else if (tokenIn === MoonCrv3 && tokenOut === Moon) {
        convertData = ConvertEncoder.curveLPToMoons(
          amountInStr,      // amountLP
          amountOutStr,     // minMoons
          tokenIn.address,  // output token address = pool address
        );
      } else {
        throw new Error('Unknown conversion pathway');
      }

      const crates  = conversion.deltaCrates.map((crate) => crate.season.toString());
      const amounts = conversion.deltaCrates.map((crate) => tokenIn.stringify(crate.amount.abs()));

      console.debug('[Convert] executing', {
        tokenIn,
        amountIn,
        tokenOut,
        amountOut,
        amountInStr,
        amountOutStr,
        depositedCrates,
        conversion,
        convertData,
        crates,
        amounts,
      });

      const txn = await moonmage.convert(
        convertData,
        crates,
        amounts
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautSilo(),  // update cosmomage silo since we just moved deposits around
        refetchPools(),       // update prices to account for pool conversion
      ]);
      txToast.success(receipt);
      formActions.resetForm({
        values: {
          ...initialValues,
          tokenOut: undefined,
        }
      });
    } catch (err) {
      console.error(err);
      if (txToast) {
        txToast.error(err);
      } else {
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
      formActions.setSubmitting(false);
    }
  }, [cosmomageSiloBalances, cosmomageSilo.moons.earned, season, urMoon, urMoonCrv3, Moon, MoonCrv3, moonmage, refetchCosmonautSilo, refetchPools, initialValues, middleware]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <>
          <TxnSettings placement="inside-form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <ConvertForm
            handleQuote={handleQuote}
            tokenList={tokenList as (ERC20Token | NativeToken)[]}
            siloBalances={cosmomageSiloBalances}
            moonmage={moonmage}
            currentSeason={season}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default Convert;
