import React, { useState, useEffect, useCallback } from 'react';
import {
  DialogProps,
  Stack,
  Dialog,
  Typography,
  useMediaQuery,
  Divider,
  Box,
  Link,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import unripeMoonIcon from '~/img/tokens/unripe-moon-logo-circled.svg';
import brownLPIcon from '~/img/tokens/unripe-lp-logo-circled.svg';
import { MoonmagePalette } from '~/components/App/muiTheme';
import { StyledDialogActions, StyledDialogContent, StyledDialogTitle } from '~/components/Common/Dialog';
import pickImage from '~/img/moonmage/unripe/pick.png';
import DescriptionButton from '~/components/Common/DescriptionButton';
import type { PickMerkleResponse } from '~/functions/pick/pick';
import TransactionToast from '~/components/Common/TxnToast';
import Token from '~/classes/Token';
import { useSigner } from '~/hooks/ledger/useSigner';
import { MOON, MOON_CRV3_LP, MOON_ETH_UNIV2_LP, MOON_LUSD_LP, UNRIPE_MOON, UNRIPE_MOON_CRV3 } from '~/constants/tokens';
import { UNRIPE_ASSET_TOOLTIPS } from '~/constants/tooltips';
import { ZERO_BN } from '~/constants';
import { displayFullBN, toTokenUnitsBN } from '~/util';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import { FarmFromMode, FarmToMode } from '~/lib/Moonmage/Farm';
import useAccount from '~/hooks/ledger/useAccount';
import { useFetchCosmonautSilo } from '~/state/cosmomage/silo/updater';
import UnripeTokenRow from './UnripeTokenRow';
import Row from '~/components/Common/Row';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// ----------------------------------------------------

import { FC } from '~/types';

// ----------------------------------------------------

type UnripeKeys = (
  // Moons
  'circulatingMoons' |
  'withdrawnMoons' |
  'harvestableMoons' |
  'orderedMoons' |
  'farmableMoons' |
  'farmMoons' |
  'unripeMoons' |
  // LP
  'circulatingMoonEthLp' |
  'circulatingMoonLusdLp' |
  'circulatingMoon3CrvLp' |
  'withdrawnMoonEthLp' |
  'withdrawnMoonLusdLp' |
  'withdrawnMoon3CrvLp' |
  'circulatingMoonEthBdv' |
  'circulatingMoonLusdBdv' |
  'circulatingMoon3CrvBdv' |
  'withdrawnMoonEthBdv' |
  'withdrawnMoonLusdBdv' |
  'withdrawnMoon3CrvBdv' |
  'unripeLp'
);
type GetUnripeResponse = Partial<{ [key in UnripeKeys]: string }>;

// ----------------------------------------------------

const UNRIPE_MOON_CATEGORIES = [
  'circulating',
  'withdrawn',
  'harvestable',
  'ordered',
  // 'farmable',
  'farm',
] as const;

const UNRIPE_LP_CATEGORIES = [
  {
    key: 'MoonEth',
    token: MOON_ETH_UNIV2_LP[1],
  },
  {
    key: 'Moon3Crv',
    token: MOON_CRV3_LP[1],
  },
  {
    key: 'MoonLusd',
    token: MOON_LUSD_LP[1],
  },
] as const;

const tokenOrZero = (amount: string | undefined, token: Token) => {
  if (!amount) return ZERO_BN;
  return toTokenUnitsBN(amount, token.decimals);
};

const PickMoonsDialog: FC<{
  handleClose: any;
} & DialogProps> = ({
  open,
  sx,
  onClose,
  fullWidth,
  fullScreen,
  disableScrollLock,
  handleClose
}) => {
  /// Theme
  const theme         = useTheme();
  const isMobile      = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);

  /// Tokens
  const getChainToken = useGetChainToken();
  const urMoon        = getChainToken(UNRIPE_MOON);
  const urMoonCRV3    = getChainToken(UNRIPE_MOON_CRV3);
  
  /// Cosmonaut
  const [refetchCosmonautSilo] = useFetchCosmonautSilo();

  /// Ledger
  const account          = useAccount();
  const { data: signer } = useSigner();
  const moonmage        = useMoonmageContract(signer);
  
  /// Local data
  const [unripe, setUnripe]         = useState<GetUnripeResponse | null>(null);
  const [merkles, setMerkles]       = useState<PickMerkleResponse | null>(null);
  const [pickStatus, setPickStatus] = useState<null | 'picking' | 'success' | 'error'>(null);
  const [picked, setPicked]         = useState<[null, null] | [boolean, boolean]>([null, null]);

  /// Form
  const middleware = useFormMiddleware();

  /// Refresh 
  useEffect(() => {
    (async () => {
      try {
        if (account && open) {
          const [
            _unripe,
            _merkles,
            _picked,
          ] = await Promise.all([
            fetch(`/.netlify/functions/unripe?account=${account}`).then((response) => response.json()),
            fetch(`/.netlify/functions/pick?account=${account}`).then((response) => response.json()),
            Promise.all([
              moonmage.picked(account, urMoon.address),
              moonmage.picked(account, urMoonCRV3.address),
            ]),
          ]);
          console.debug('[PickDialog] loaded states', { _unripe, _merkles, _picked });
          setUnripe(_unripe);
          setMerkles(_merkles);
          setPicked(_picked);
        }
      } catch (err) {
        console.error(err);
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
    })();
  }, [account, moonmage, open, urMoon.address, urMoonCRV3.address]);

  /// Tab handlers
  const handleDialogClose = () => {
    handleClose();
    setTab(0);
  };
  const handleNextTab = () => {
    setTab(tab + 1);
  };
  const handlePreviousTab = () => {
    setTab(tab - 1);
    if (pickStatus !== 'picking') setPickStatus(null);
  };

  /// Pick handlers
  const handlePick = useCallback((isDeposit : boolean) => () => {
    if (!merkles) return;
    middleware.before();

    setPickStatus('picking');
    const data = [];

    if (merkles.moon && picked[0] === false) {
      data.push(moonmage.interface.encodeFunctionData('pick', [
        urMoon.address,
        merkles.moon.amount,
        merkles.moon.proof,
        isDeposit ? FarmToMode.INTERNAL : FarmToMode.EXTERNAL,
      ]));
      if (isDeposit) {
        data.push(moonmage.interface.encodeFunctionData('deposit', [
          urMoon.address,
          merkles.moon.amount,
          FarmFromMode.INTERNAL, // always use internal for deposits
        ]));
      }
    }
    if (merkles.moon3crv && picked[1] === false) {
      data.push(moonmage.interface.encodeFunctionData('pick', [
        urMoonCRV3.address,
        merkles.moon3crv.amount,
        merkles.moon3crv.proof,
        isDeposit ? FarmToMode.INTERNAL : FarmToMode.EXTERNAL,
      ]));
      if (isDeposit) {
        data.push(moonmage.interface.encodeFunctionData('deposit', [
          urMoonCRV3.address,
          merkles.moon3crv.amount,
          FarmFromMode.INTERNAL, // always use internal for deposits
        ]));
      }
    }

    const txToast = new TransactionToast({
      loading: `Picking${isDeposit ? ' and depositing' : ''} Unripe Assets`,
      success: `Pick${isDeposit ? ' and deposit' : ''} successful. You can find your Unripe Assets ${isDeposit ? 'in the Silo' : 'in your wallet'}.`,
    });

    moonmage.farm(data)
      .then((txn) => {
        txToast.confirming(txn);
        return txn.wait();
      })
      .then((receipt) => Promise.all([
        refetchCosmonautSilo(),
      ]).then(() => receipt))
      .then((receipt) => {
        txToast.success(receipt);
        setPickStatus('success');
      })
      .catch((err) => {
        console.error(
          txToast.error(err.error || err)
        );
        setPickStatus('error');
      });
  }, [merkles, picked, moonmage, urMoon.address, urMoonCRV3.address, refetchCosmonautSilo, middleware]);

  /// Tab: Pick Overview
  const alreadyPicked = picked[0] === true || picked[1] === true;
  const buttonLoading = !merkles;
  let buttonText      = 'Nothing to Pick';
  let buttonDisabled  = true;
  if (alreadyPicked) {
    buttonText = 'Already Picked';
    buttonDisabled = true;
  } else if (merkles && (merkles.moon || merkles.moon3crv)) {
    buttonDisabled = false;
    const avail = [];
    if (merkles.moon) avail.push('Unripe Moons');
    if (merkles.moon3crv) avail.push('Unripe MOON:3CRV LP');
    buttonText = `Pick ${avail.join(' & ')}`;
  }

  const tab0 = (
    <>
      <StyledDialogTitle sx={{ pb: 1 }} onClose={handleDialogClose}>
        Pick non-Deposited Unripe Moons and Unripe MOON:3CRV LP
      </StyledDialogTitle>
      <Row gap={1} pb={2} pl={1} pr={3}>
        <img
          src={pickImage}
          alt="pick"
          css={{ height: 120 }}
        />
        <Typography sx={{ fontSize: '15px' }} color="text.secondary">
          To claim non-Deposited Unripe Moons and Unripe MOON:3CRV LP, they must be Picked. After Replant, you can Pick assets to your wallet, or Pick and Deposit them directly in the Silo.<br /><br />
          Unripe Deposited assets <b>do not need to be Picked</b> and will be automatically Deposited at Replant.<br /><br />
          Read more about Unripe assets <Link href="https://docs.moon.money/almanac/farm/ship#unripe-assets" target="_blank" rel="noreferrer">here</Link>.
        </Typography>
      </Row>
      <Divider />
      <StyledDialogContent>
        <Stack gap={2}>
          {/**
            * Section 2: Unripe Moons
            */}
          <Stack gap={1}>
            {/**
              * Section 2a: Moons by State
              */}
            <Typography variant="h4">Non-Deposited pre-exploit Moon balances</Typography>
            <Stack gap={0.5} pl={1}>
              {UNRIPE_MOON_CATEGORIES.map((key) => (
                <UnripeTokenRow
                  key={key}
                  name={key === 'harvestable' ? 'Harvestable Pods' : `${key} Moons`}
                  amount={tokenOrZero(unripe?.[`${key}Moons`], MOON[1])}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`${key}Moons`]}
                  token={MOON[1]}
                />
              ))}
            </Stack>
            <Divider sx={{ ml: 1 }} />
            {/**
              * Section 3b: Total Unripe Moons
              */}
            <Row justifyContent="space-between" pl={1}>
              <Typography>
                Unripe Moons available to Pick at Replant
              </Typography>
              <Row gap={0.3}>
                <img src={unripeMoonIcon} alt="Circulating Moons" width={13} />
                <Typography variant="h4">
                  {displayFullBN(
                    // HOTFIX:
                    // After launching this dialog, the team decided to
                    // auto-deposit Farmable Moons. Instead of reworking the
                    // underlying JSONs, we just subtract farmableMoons from 
                    // the total unripeMoons for user display.
                    tokenOrZero(unripe?.unripeMoons, MOON[1]).minus(
                      tokenOrZero(unripe?.farmableMoons, MOON[1])
                    )
                  )}
                </Typography>
              </Row>
            </Row>
          </Stack>
          {/**
            * Section 3: LP
            */}
          <Stack sx={{ pl: isMobile ? 0 : 0, pb: 0.5 }} gap={1}>
            {/**
              * Section 2a: LP by State
              */}
            <Typography variant="h4">Non-Deposited pre-exploit LP balances</Typography>
            {UNRIPE_LP_CATEGORIES.map((obj) => (
              <Stack key={obj.token.address} gap={0.5} pl={1}>
                <Typography sx={{ fontSize: '16px' }}>{obj.token.name} Balances</Typography>
                <UnripeTokenRow
                  name={`Circulating ${obj.token.name}`}
                  amount={tokenOrZero(unripe?.[`circulating${obj.key}Lp`], obj.token)}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`circulating${obj.key}Lp`]}
                  token={obj.token}
                  bdv={tokenOrZero(unripe?.[`circulating${obj.key}Bdv`], MOON[1])}
                />
                <UnripeTokenRow
                  name={`Withdrawn ${obj.token.name}`}
                  amount={tokenOrZero(unripe?.[`withdrawn${obj.key}Lp`], obj.token)}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`withdrawn${obj.key}Lp`]}
                  token={obj.token}
                  bdv={tokenOrZero(unripe?.[`withdrawn${obj.key}Bdv`], MOON[1])}
                />
              </Stack>
            ))}
            <Divider sx={{ ml: 1 }} />
            {/**
              * Section 2b: Total Unripe LP
              */}
            <Row justifyContent="space-between" pl={1}>
              <Typography>
                Unripe MOON:3CRV LP available to Pick at Replant
              </Typography>
              <Row gap={0.3}>
                <img src={brownLPIcon} alt="Circulating Moons" width={13} />
                <Typography variant="h4">
                  {displayFullBN(tokenOrZero(unripe?.unripeLp, MOON[1]))}
                </Typography>
              </Row>
            </Row>
          </Stack>
        </Stack>
      </StyledDialogContent>
      <StyledDialogActions>
        <Box width="100%">
          <LoadingButton
            loading={buttonLoading}
            disabled={buttonDisabled}
            onClick={handleNextTab}
            fullWidth
            // Below two params are required for the disabled
            // state to work correctly and for the font to show
            // as white when enabled
            variant="contained"
            color="dark"
            sx={{
              py: 1,
              backgroundColor: MoonmagePalette.brown,
              '&:hover': { 
                backgroundColor: MoonmagePalette.brown,
                opacity: 0.96
              }
            }}>
            {buttonText}
          </LoadingButton>
        </Box>
      </StyledDialogActions>
    </>
  );

  /// Tab: Pick
  const tab1 = (
    <>
      <StyledDialogTitle
        onBack={handlePreviousTab}
        onClose={handleDialogClose}
      >
        Pick Unripe Assets
      </StyledDialogTitle>
      <StyledDialogContent sx={{ width: isMobile ? null : '560px' }}>
        <Stack gap={0.8}>
          {pickStatus === null ? (
            <>
              <DescriptionButton
                title="Pick Unripe Assets" 
                description="Claim your Unripe Moons and Unripe LP to your wallet." 
                onClick={handlePick(false)}
              />
              <DescriptionButton
                title="Pick and Deposit Unripe Assets" 
                description="Claim your Unripe Moons and Unripe LP, then Deposit them in the Silo to earn yield."
                onClick={handlePick(true)}
              />
            </>
          ) : (
            <Stack direction="column" sx={{ width: '100%', minHeight: 100 }} justifyContent="center" gap={1} alignItems="center">
              {pickStatus === 'picking' && <CircularProgress variant="indeterminate" color="primary" size={32} />}
              {pickStatus === 'error' && (
                <Typography color="text.secondary">Something went wrong while picking your Unripe assets.</Typography>
              )}
              {pickStatus === 'success' && (
                <Typography color="text.secondary">Unripe Assets picked successfully.</Typography>
              )}
            </Stack>
          )}
        </Stack>
      </StyledDialogContent>
    </>
  );

  return (
    <Dialog
      onClose={onClose}
      open={open}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      disableScrollLock={disableScrollLock}
      sx={{ ...sx }}
    >
      {tab === 0 && tab0}
      {tab === 1 && tab1}
    </Dialog>
  );
};

export default PickMoonsDialog;
