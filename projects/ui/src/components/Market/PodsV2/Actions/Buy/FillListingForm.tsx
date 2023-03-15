import { Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useProvider } from 'wagmi';
import BigNumber from 'bignumber.js';
import { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import TransactionToast from '~/components/Common/TxnToast';
import {
  FormState,
  SettingInput, SlippageSettingsFragment, SmartSubmitButton, TokenOutputField,
  TokenQuoteProvider,
  TokenSelectDialog, TxnSeparator,
  TxnSettings
} from '~/components/Common/Form';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import useCosmonautBalances from '~/hooks/cosmomage/useCosmonautBalances';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import useTokenMap from '~/hooks/chain/useTokenMap';
import useToggle from '~/hooks/display/useToggle';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import { Moonmage } from '~/generated';
import usePreferredToken, { PreferredToken } from '~/hooks/cosmomage/usePreferredToken';
import { useFetchCosmonautField } from '~/state/cosmomage/field/updater';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import Farm, { ChainableFunction, FarmFromMode, FarmToMode } from '~/lib/Moonmage/Farm';
import { displayBN, displayTokenAmount, MinBN, toStringBaseUnitBN, toTokenUnitsBN } from '~/util';
import { AppState } from '~/state';
import { MOON, ETH, PODS, WETH } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { PodListing } from '~/state/cosmomage/market';
import { optimizeFromMode } from '~/util/Farm';
import TokenIcon from '~/components/Common/TokenIcon';
import { IconSize } from '~/components/App/muiTheme';
import Row from '~/components/Common/Row';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

export type FillListingFormValues = FormState & {
  settings: SlippageSettingsFragment;
  maxAmountIn: BigNumber | undefined;
}

const FillListingV2Form : FC<
  FormikProps<FillListingFormValues>
  & {
    podListing: PodListing;
    contract: Moonmage;
    handleQuote: QuoteHandler;
    farm: Farm;
  }
> = ({
  // Formik
  values,
  setFieldValue,
  //
  podListing,
  contract,
  handleQuote,
  farm,
}) => {
  /// State
  const [isTokenSelectVisible, handleOpen, hideTokenSelect] = useToggle();

  /// Chain
  const getChainToken = useGetChainToken();
  const Moon          = getChainToken(MOON);
  const Eth           = getChainToken<NativeToken>(ETH);
  const Weth          = getChainToken<ERC20Token>(WETH);
  const erc20TokenMap = useTokenMap<ERC20Token | NativeToken>([MOON, ETH, WETH]);

  /// Cosmonaut
  const balances       = useCosmonautBalances();

  /// Moonmage
  const moonmageField = useSelector<AppState, AppState['_moonmage']['field']>(
    (state) => state._moonmage.field
  );

  /// Derived
  const tokenIn   = values.tokens[0].token;
  const amountIn  = values.tokens[0].amount;
  const tokenOut  = Moon;
  const amountOut = (tokenIn === tokenOut) // Moons
    ? values.tokens[0].amount
    : values.tokens[0].amountOut;
  const tokenInBalance = balances[tokenIn.address];

  const isReady       = amountIn?.gt(0) && amountOut?.gt(0);
  const isSubmittable = isReady;
  const podsPurchased = amountOut?.div(podListing.pricePerPod) || ZERO_BN;
  const placeInLine   = podListing.index.minus(moonmageField.harvestableIndex);

  /// Token select
  const handleSelectTokens = useCallback((_tokens: Set<Token>) => {
    // If the user has typed some existing values in,
    // save them. Add new tokens to the end of the list.
    // FIXME: match sorting of erc20TokenList
    const copy = new Set(_tokens);
    const v = values.tokens.filter((x) => {
      copy.delete(x.token);
      return _tokens.has(x.token);
    });
    setFieldValue('tokens', [
      ...v,
      ...Array.from(copy).map((_token) => ({
        token: _token,
        amount: undefined
      })),
    ]);
  }, [values.tokens, setFieldValue]);

  /// FIXME: standardized `maxAmountIn` approach?
  /// When `tokenIn` or `tokenOut` changes, refresh the
  /// max amount that the user can input of `tokenIn`.
  useEffect(() => {
    (async () => {
      // Maximum MOON precision is 6 decimals. remainingAmount * pricePerPod may
      // have more decimals, so we truncate at 6.
      const maxMoons = podListing.remainingAmount.times(podListing.pricePerPod).dp(
        MOON[1].decimals,
        BigNumber.ROUND_DOWN,
      );
      if (maxMoons.gt(0)) {
        if (tokenIn === Moon) {
          /// 1 POD is consumed by 1 MOON
          setFieldValue('maxAmountIn', maxMoons);
        } else if (tokenIn === Eth || tokenIn === Weth) {
          /// Estimate how many ETH it will take to buy `maxMoons` MOON.
          /// TODO: across different forms of `tokenIn`.
          /// This (obviously) only works for Eth and Weth.
          const estimate = await Farm.estimate(
            farm.buyMoons(),
            [ethers.BigNumber.from(Moon.stringify(maxMoons))],
            false, // forward = false -> run the calc backwards
          );
          setFieldValue(
            'maxAmountIn',
            toTokenUnitsBN(
              estimate.amountOut.toString(),
              tokenIn.decimals
            ),
          );
        } else {
          throw new Error(`Unsupported tokenIn: ${tokenIn.symbol}`);
        }
      } else {
        setFieldValue('maxAmountIn', ZERO_BN);
      }
    })();
  }, [Moon, Eth, Weth, farm, podListing.pricePerPod, podListing.remainingAmount, setFieldValue, tokenIn]);

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
        <TokenQuoteProvider
          key="tokens.0"
          name="tokens.0"
          tokenOut={Moon}
          disabled={!values.maxAmountIn}
          max={MinBN(
            values.maxAmountIn    || ZERO_BN,
            tokenInBalance?.total || ZERO_BN
          )}
          balance={tokenInBalance || undefined}
          state={values.tokens[0]}
          showTokenSelect={handleOpen}
          handleQuote={handleQuote}
          size="small"
        />
        {isReady ? (
          <>
            <TxnSeparator mt={0} />
            {/* Pods Output */}
            <TokenOutputField
              size="small"
              token={PODS}
              amount={podsPurchased}
              amountTooltip={(
                <>
                  {displayTokenAmount(amountOut!, Moon)} / {displayBN(podListing.pricePerPod)} Moons per Pod<br />= {displayTokenAmount(podsPurchased, PODS)}
                </>
              )}
              override={(
                <Row gap={0.5}>
                  <TokenIcon
                    token={PODS}
                    css={{
                      height: IconSize.xs,
                    }}
                  />
                  <Typography variant="bodySmall">
                    {PODS.symbol} @ {displayBN(placeInLine)}
                  </Typography>
                </Row>
              )}
            />
            {/* <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      tokenIn === Moon ? undefined : {
                        type: ActionType.SWAP,
                        tokenIn,
                        tokenOut,
                        /// FIXME: these are asserted by !!isReady
                        amountIn:   amountIn!,
                        amountOut:  amountOut!,
                      },
                      {
                        type: ActionType.BUY_PODS,
                        podAmount: podsPurchased,
                        pricePerPod: podListing.pricePerPod,
                        placeInLine: placeInLine
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box> */}
          </>
        ) : null}
        <SmartSubmitButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isSubmittable}
          contract={contract}
          tokens={values.tokens}
          mode="auto"
        >
          Fill
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// ---------------------------------------------------

const PREFERRED_TOKENS : PreferredToken[] = [
  {
    token: MOON,
    minimum: new BigNumber(1),    // $1
  },
  {
    token: ETH,
    minimum: new BigNumber(0.001) // ~$2-4
  },
  {
    token: WETH,
    minimum: new BigNumber(0.001) // ~$2-4
  }
];

const FillListingForm : FC<{
  podListing: PodListing
}> = ({
  podListing
}) => {
  /// Tokens
  const getChainToken = useGetChainToken();
  const Moon          = getChainToken(MOON);
  const Eth           = getChainToken(ETH);
  const Weth          = getChainToken(WETH);

  /// Ledger
  const { data: signer } = useSigner();
  const provider  = useProvider();
  const moonmage = useMoonmageContract(signer);

  /// Farm
  const farm      = useMemo(() => new Farm(provider), [provider]);

  /// Cosmonaut
  const balances                = useCosmonautBalances();
  const [refetchCosmonautField]    = useFetchCosmonautField();
  const [refetchCosmonautBalances] = useFetchCosmonautBalances();

  /// Form
  const middleware = useFormMiddleware();
  const baseToken = usePreferredToken(PREFERRED_TOKENS, 'use-best');
  const initialValues: FillListingFormValues = useMemo(() => ({
    settings: {
      slippage: 0.1
    },
    tokens: [
      {
        token: baseToken as (ERC20Token | NativeToken),
        amount: undefined,
      },
    ],
    maxAmountIn: undefined,
  }), [baseToken]);

  /// Handlers
  /// Does not execute for _tokenIn === MOON
  const handleQuote = useCallback<QuoteHandler>(
    async (_tokenIn, _amountIn, _tokenOut) => {
      const steps : ChainableFunction[] = [];

      if (_tokenIn === Eth) {
        steps.push(...[
          farm.wrapEth(FarmToMode.INTERNAL),       // wrap ETH to WETH (internal)
          ...farm.buyMoons(FarmFromMode.INTERNAL)  // buy Moons using internal WETH (exact)
        ]);
      } else if (_tokenIn === Weth) {
        steps.push(
          ...farm.buyMoons(
            /// Use INTERNAL, EXTERNAL, or INTERNAL_EXTERNAL to initiate the swap.
            optimizeFromMode(_amountIn, balances[Weth.address]),
          )
        );
      } else {
        throw new Error(`Filling a Listing via ${_tokenIn.symbol} is not currently supported`);
      }

      const amountIn = ethers.BigNumber.from(toStringBaseUnitBN(_amountIn, _tokenIn.decimals));
      const estimate = await Farm.estimate(
        steps,
        [amountIn]
      );

      return {
        amountOut:  toTokenUnitsBN(estimate.amountOut.toString(), _tokenOut.decimals),
        value:      estimate.value,
        steps:      estimate.steps,
      };
    },
    [Eth, Weth, balances, farm]
  );

  const onSubmit = useCallback(async (values: FillListingFormValues, formActions: FormikHelpers<FillListingFormValues>) => {
    let txToast;
    try {
      middleware.before();
      const formData    = values.tokens[0];
      const tokenIn     = formData.token;
      const amountMoons = tokenIn === Moon ? formData.amount : formData.amountOut;

      // Checks
      if (!podListing) throw new Error('No Pod Listing found');
      if (!signer) throw new Error('Connect a wallet');
      if (values.tokens.length > 1) throw new Error('Only one input token supported');
      if (!formData.amount || !amountMoons || amountMoons.eq(0)) throw new Error('No amount set');
      if (amountMoons.lt(podListing.minFillAmount)) throw new Error(`This Listing requires a minimum fill amount of ${displayTokenAmount(podListing.minFillAmount, PODS)}`);

      const data : string[] = [];
      const amountPods = amountMoons.div(podListing.pricePerPod);
      let finalFromMode : FarmFromMode;

      txToast = new TransactionToast({
        loading: `Buying ${displayTokenAmount(amountPods, PODS)} for ${displayTokenAmount(amountMoons, Moon)}...`,
        success: 'Fill successful.',
      });

      /// Fill Listing directly from MOON
      if (tokenIn === Moon) {
        // No swap occurs, so we know exactly how many moons are going in.
        // We can select from INTERNAL, EXTERNAL, INTERNAL_EXTERNAL.
        finalFromMode = optimizeFromMode(amountMoons, balances[Moon.address]);
      }

      /// Swap to MOON and buy
      else if (tokenIn === Eth || tokenIn === Weth) {
        // Require a quote
        if (!formData.steps || !formData.amountOut) throw new Error(`No quote available for ${formData.token.symbol}`);

        const encoded = Farm.encodeStepsWithSlippage(
          formData.steps,
          values.settings.slippage / 100,
        );
        data.push(...encoded);

        // At the end of the Swap step, the assets will be in our INTERNAL balance.
        // The Swap decides where to route them from (see handleQuote).
        finalFromMode = FarmFromMode.INTERNAL_TOLERANT;
      } else {
        throw new Error(`Filling a Listing via ${tokenIn.symbol} is not currently supported`);
      }

      console.debug(`[FillListing] using FarmFromMode = ${finalFromMode}`, podListing);

      data.push(
        moonmage.interface.encodeFunctionData('fillPodListing', [
          {
            account:  podListing.account,
            index:    Moon.stringify(podListing.index),
            start:    Moon.stringify(podListing.start),
            amount:   Moon.stringify(podListing.amount),
            pricePerPod: Moon.stringify(podListing.pricePerPod),
            maxHarvestableIndex: Moon.stringify(podListing.maxHarvestableIndex),
            minFillAmount: Moon.stringify(podListing.minFillAmount || 0), // minFillAmount for listings is measured in Moons
            mode:     podListing.mode,
          },
          Moon.stringify(amountMoons),
          finalFromMode,
        ])
      );

      const overrides = { value: formData.value };
      console.debug('[FillListing] ', {
        length: data.length,
        data,
        overrides
      });

      const txn = data.length === 1
        ? await signer.sendTransaction({
          to: moonmage.address,
          data: data[0],
          ...overrides
        })
        : await moonmage.farm(data, overrides);
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmonautField(),     // refresh plots; increment pods
        refetchCosmonautBalances(),  // decrement balance of tokenIn
        // FIXME: refresh listings
      ]);
      txToast.success(receipt);
      formActions.resetForm();
    } catch (err) {
      console.error(err);
      if (txToast) {
        txToast.error(err);
      } else {
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
    } finally {
      formActions.setSubmitting(false);
    }
  }, [Moon, podListing, signer, Eth, Weth, moonmage, refetchCosmonautField, refetchCosmonautBalances, balances, middleware]);

  return (
    <Formik<FillListingFormValues>
      enableReinitialize
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<FillListingFormValues>) => (
        <>
          <TxnSettings placement="condensed-form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <FillListingV2Form
            podListing={podListing}
            handleQuote={handleQuote}
            contract={moonmage}
            farm={farm}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default FillListingForm;
