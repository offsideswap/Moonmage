import React, { useCallback, useMemo } from 'react';
import { Alert, Box, Divider, Link, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ethers } from 'ethers';
import { useProvider } from 'wagmi';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TokenSelectDialog, { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import TokenQuoteProvider from '~/components/Common/Form/TokenQuoteProvider';
import { FormState } from '~/components/Common/Form';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import TxnAccordion from '~/components/Common/TxnAccordion';
import { BUY_FERTILIZER } from '~/components/Ship/FertilizerItemTooltips';
import SmartSubmitButton from '~/components/Common/Form/SmartSubmitButton';
import TransactionToast from '~/components/Common/TxnToast';
import IconWrapper from '~/components/Common/IconWrapper';
import { IconSize } from '~/components/App/muiTheme';
import TokenIcon from '~/components/Common/TokenIcon';
import { ERC20Token, NativeToken } from '~/classes/Token';
import { Token } from '~/classes';
import useToggle from '~/hooks/display/useToggle';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import useChainId from '~/hooks/chain/useChainId';
import useFertilizerSummary from '~/hooks/cosmomage/useFertilizerSummary';
import { useMoonmageContract, useFertilizerContract } from '~/hooks/ledger/useContract';
import useTokenMap from '~/hooks/chain/useTokenMap';
import useCosmonautBalances from '~/hooks/cosmomage/useCosmonautBalances';
import usePreferredToken, { PreferredToken } from '~/hooks/cosmomage/usePreferredToken';
import { useSigner } from '~/hooks/ledger/useSigner';
import Farm, { FarmFromMode, FarmToMode } from '~/lib/Moonmage/Farm';
import { displayFullBN, toStringBaseUnitBN, toTokenUnitsBN, getChainConstant } from '~/util';
import { useFetchCosmonautAllowances } from '~/state/cosmomage/allowances/updater';
import { useFetchCosmonautBalances } from '~/state/cosmomage/balances/updater';
import { useFetchCosmonautShip } from '~/state/cosmomage/ship/updater';
import { CosmonautBalances } from '~/state/cosmomage/balances';
import { ZERO_BN } from '~/constants';
import { MOON, ETH, USDC, USDT, WETH } from '~/constants/tokens';
import FertilizerItem from '../FertilizerItem';
import { optimizeFromMode } from '~/util/Farm';
import useAccount from '~/hooks/ledger/useAccount';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import { FC } from '~/types';

// ---------------------------------------------------

type BuyFormValues = FormState;

// ---------------------------------------------------

const PREFERRED_TOKENS : PreferredToken[] = [
  {
    token: MOON,
    minimum: new BigNumber(1),    // 1
  },
  {
    token: USDC,
    minimum: new BigNumber(1),    // $1
  },
  {
    token: ETH,
    minimum: new BigNumber(0.001) // ~$2-4
  }
];

const TOKEN_LIST = [MOON, USDC, ETH];

// ---------------------------------------------------

const BuyForm : FC<
  FormikProps<BuyFormValues>
  & {
    contract: ethers.Contract;
    handleQuote: QuoteHandler;
    balances: CosmonautBalances;
    tokenOut: ERC20Token;
  }
> = ({
  // Formik
  values,
  setFieldValue,
  isSubmitting,
  // Custom
  contract,
  handleQuote,
  balances,
  tokenOut: token
}) => {
  const tokenMap = useTokenMap<ERC20Token | NativeToken>(TOKEN_LIST);
  const { usdc, fert, humidity, actions } = useFertilizerSummary(values.tokens);

  // Extract
  const isValid = fert?.gt(0);

  // Handlers
  const [showTokenSelect, handleOpen, handleClose] = useToggle();
  const handleSelectTokens = useCallback((_tokens: Set<Token>) => {
    setFieldValue(
      'tokens',
      Array.from(_tokens).map((t) => ({ token: t, amount: null }))
    );
  }, [setFieldValue]);

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <TokenSelectDialog
          open={showTokenSelect}
          handleClose={handleClose}
          selected={values.tokens}
          handleSubmit={handleSelectTokens}
          balances={balances}
          tokenList={Object.values(tokenMap)}
          mode={TokenSelectMode.SINGLE}
        />
        {/* Form Contents */}
        {values.tokens.map((state, index) => (
          <TokenQuoteProvider
            key={state.token.address}
            name={`tokens.${index}`}
            state={state}
            tokenOut={token}
            balance={balances[state.token.address] || undefined}
            showTokenSelect={handleOpen}
            handleQuote={handleQuote}
          />
        ))}
        {/* Outputs */}
        {fert?.gt(0) ? (
          <>
            <Stack direction="column" gap={1} alignItems="center" justifyContent="center">
              <KeyboardArrowDownIcon color="secondary" />
              <Box sx={{ width: 150, pb: 1 }}>
                <FertilizerItem
                  isNew
                  amount={fert}
                  sprouts={fert.multipliedBy(humidity.plus(1))}
                  humidity={humidity}
                  state="active"
                  tooltip={BUY_FERTILIZER}
                />
              </Box>
              <Alert
                color="warning"
                icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon sx={{ fontSize: IconSize.small }} /></IconWrapper>}
                sx={{ color: 'black' }}
              >The amount of Fertilizer received rounds down to the nearest USDC. {usdc?.toFixed(2)} USDC = {fert?.toFixed(0)} FERT.
              </Alert>
              <Box sx={{ width: '100%', mt: 0 }}>
                <TxnAccordion defaultExpanded={false}>
                  <TxnPreview
                    actions={actions}
                  />
                  <Divider sx={{ my: 2, opacity: 0.4 }} />
                  <Box sx={{ pb: 1 }}>
                    <Typography variant="body2">
                      Sprouts become <strong>Rinsable</strong> on a <Link href="https://docs.moon.money/almanac/protocol/glossary#pari-passu" target="_blank" rel="noreferrer" underline="hover">pari passu</Link> basis. Upon <strong>Rinse</strong>, each Sprout is redeemed for <span><TokenIcon token={MOON[1]} css={{ height: IconSize.xs, marginTop: 2.6 }} /></span>1.
                    </Typography>
                  </Box>
                </TxnAccordion>
              </Box>
            </Stack>
          </>
        ) : null}
        {/* Submit */}
        <SmartSubmitButton
          mode="auto"
          // Button props
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          loading={isSubmitting}
          disabled={!isValid}
          // Smart props
          contract={contract}
          tokens={values.tokens}
        >
          Buy
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Buy : FC<{}> = () => {
  // Wallet connection
  const account = useAccount();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const chainId = useChainId();
  const fertContract = useFertilizerContract(signer);
  const moonmage = useMoonmageContract(signer);

  /// Cosmonaut
  const balances = useCosmonautBalances();
  const [refetchFertilizer] = useFetchCosmonautShip();
  const [refetchBalances]   = useFetchCosmonautBalances();
  const [refetchAllowances] = useFetchCosmonautAllowances();
  
  /// Farm
  const farm = useMemo(() => new Farm(provider), [provider]);

  // Tokens
  const Usdc = getChainConstant(USDC, chainId);
  const Moon = getChainConstant(MOON,  chainId);
  const Eth  = getChainConstant(ETH,  chainId);
  const Weth = getChainConstant(WETH, chainId);
  const Usdt = getChainConstant(USDT, chainId);
  
  /// Form
  const middleware = useFormMiddleware();
  const baseToken = usePreferredToken(PREFERRED_TOKENS, 'use-best');
  const tokenOut = Usdc;
  const initialValues : BuyFormValues = useMemo(() => ({
    tokens: [
      {
        token: baseToken as (ERC20Token | NativeToken),
        amount: undefined,
      },
    ],
  }), [baseToken]);

  /// Handlers
  // Doesn't get called if tokenIn === tokenOut
  // aka if the user has selected USDC as input
  const handleQuote = useCallback<QuoteHandler>(async (_tokenIn, _amountIn, _tokenOut) => {
    let estimate;
    if (_tokenIn === Moon) {
      estimate = await Farm.estimate([
        // WETH -> USDT
        farm.exchangeUnderlying(
          farm.contracts.curve.pools.moonCrv3.address,
          Moon.address,
          Usdc.address,
          optimizeFromMode(_amountIn, balances[_tokenIn.address]),
          FarmToMode.INTERNAL,
        ),
      ], [
        ethers.BigNumber.from(
          toStringBaseUnitBN(_amountIn, _tokenIn.decimals)
        )
      ]);
    } else if (_tokenIn === Eth) {
      estimate = await Farm.estimate([
        // WETH -> USDT
        farm.exchange(
          farm.contracts.curve.pools.tricrypto2.address,
          farm.contracts.curve.registries.cryptoFactory.address,
          Weth.address,
          Usdt.address,
          FarmFromMode.INTERNAL,
          FarmToMode.INTERNAL,
        ),
        // USDT -> USDC
        farm.exchange(
          farm.contracts.curve.pools.pool3.address,
          farm.contracts.curve.registries.poolRegistry.address,
          Usdt.address,
          Usdc.address,
          FarmFromMode.INTERNAL_TOLERANT,
          FarmToMode.INTERNAL,
        )
      ], [
        ethers.BigNumber.from(
          toStringBaseUnitBN(_amountIn, _tokenIn.decimals)
        )
      ]);
    } else {
      throw new Error('Unknown tokenIn.');
    }

    return {
      amountOut: toTokenUnitsBN(estimate.amountOut.toString(), _tokenOut.decimals),
      steps: estimate.steps,
    };
  }, [
    Moon,
    Eth,
    Usdc,
    Usdt,
    Weth,
    balances,
    farm,
  ]);

  const onSubmit = useCallback(async (values: BuyFormValues, formActions: FormikHelpers<BuyFormValues>) => {
    let txToast;
    try {
      middleware.before();

      if (!moonmage) throw new Error('Unable to access contracts');
      if (!account) throw new Error('Connect a wallet first.');

      /// Get amounts
      const tokenIn = values.tokens[0].token;  // input token
      const amount  = values.tokens[0].amount; // input amount (entered into the form)
      const amountUsdc = (
        tokenIn === Usdc
          ? values.tokens[0].amount            // identity
          : values.tokens[0].amountOut         // get amount of USDC received for some ETH
      )?.dp(0, BigNumber.ROUND_DOWN);

      if (!amount || !amountUsdc) throw new Error('An error occurred.');
    
      txToast = new TransactionToast({
        loading: `Buying ${displayFullBN(amountUsdc, Usdc.displayDecimals)} Fertilizer...`,
        success: 'Purchase successful.',
      });

      let call;
      let value = ZERO_BN;

      // Calculate the amount of underlying LP created when minting
      // `amountUsdc` FERT. This holds because 1 FERT = 1 USDC.
      const minLP = await farm.contracts.curve.zap.callStatic.calc_token_amount(
        farm.contracts.curve.pools.moonCrv3.address,
        [
          // 0.866616 is the ratio to add USDC/Moon at such that post-exploit
          // delta B in the Moon:3Crv pool with A=1 equals the pre-export 
          // total delta B times the haircut. Independent of the haircut %.
          Usdc.stringify(amountUsdc.times(0.866616)), // MOON
          0, // DAI
          Usdc.stringify(amountUsdc), // USDC
          0, // USDT
        ],
        true, // _is_deposit
        { gasLimit: 10000000 }
      );

      switch (tokenIn) {
        case Moon: {
          if (!values.tokens[0].steps) throw new Error('No quote found'); // FIXME: standardize this err message across forms
          const data : string[] = [
            // Swap MOON -> USDC
            ...Farm.encodeStepsWithSlippage(
              values.tokens[0].steps,
              0.1 / 100
            ),
            // Mint Fertilizer, which also mints Moons and 
            // deposits the underlying LP in the same txn.
            moonmage.interface.encodeFunctionData('mintFertilizer', [
              toStringBaseUnitBN(amountUsdc, 0),
              Farm.slip(minLP, 0.1 / 100),
              FarmFromMode.INTERNAL_TOLERANT,
            ])
          ];
          call = moonmage.farm(data);
          break;
        }
        case Eth: {
          if (!values.tokens[0].steps) throw new Error('No quote found'); // FIXME: standardize this err message across forms
          
          value = value.plus(amount);
          const data : string[] = [
            // Wrap input ETH into our internal balance
            moonmage.interface.encodeFunctionData('wrapEth', [
              toStringBaseUnitBN(value, Eth.decimals),
              FarmToMode.INTERNAL,
            ]),
            // Swap WETH -> USDC
            ...Farm.encodeStepsWithSlippage(
              values.tokens[0].steps,
              0.1 / 100
            ),
            // Mint Fertilizer, which also mints Moons and 
            // deposits the underlying LP in the same txn.
            moonmage.interface.encodeFunctionData('mintFertilizer', [
              toStringBaseUnitBN(amountUsdc, 0),
              Farm.slip(minLP, 0.1 / 100),
              FarmFromMode.INTERNAL_TOLERANT,
            ])
          ];
          // const gas = await moonmage.estimateGas.farm(data, { value: toStringBaseUnitBN(value, Eth.decimals) });
          call = moonmage.farm(data, {
            value: toStringBaseUnitBN(value, Eth.decimals),
          });
          break;
        }
        case Usdc: {
          console.debug('[PurchaseForm] purchasing with USDC', {
            address: farm.contracts.curve.pools.moonCrv3.address,
            moonAmount: toStringBaseUnitBN(amountUsdc.times(0.866616), Usdc.decimals),
            usdcAmount: toStringBaseUnitBN(amountUsdc, Usdc.decimals),
            fertAmount: toStringBaseUnitBN(amountUsdc, 0),
            minLP: minLP.toString(),
            minLPSlip: Farm.slip(minLP, 0.1 / 100).toString(),
          });
          call = moonmage.mintFertilizer(
            /// The input for Fertilizer has 0 decimals;
            /// it's the exact number of FERT you want to mint.
            toStringBaseUnitBN(amountUsdc, 0),
            Farm.slip(minLP, 0.1 / 100),
            FarmFromMode.EXTERNAL,
          );
          break;
        }
        default: {
          call = Promise.reject(new Error('Unrecognized token.'));
          break;
        }
      }

      if (!call) throw new Error('No supported purchase method.');

      const txn = await call;
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchFertilizer(),
        refetchBalances(),
        refetchAllowances(account, fertContract.address, Usdc),
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
      console.error(err);
    }
  }, [moonmage, account, Usdc, farm.contracts.curve.zap.callStatic, farm.contracts.curve.pools.moonCrv3.address, refetchFertilizer, refetchBalances, refetchAllowances, fertContract.address, Moon, Eth, middleware]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <BuyForm
          handleQuote={handleQuote}
          contract={moonmage}
          balances={balances}
          tokenOut={tokenOut}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default Buy;
