import { Alert, Box, InputAdornment, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useMemo } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  PlotFragment,
  PlotSettingsFragment,
  SmartSubmitButton,
  TokenAdornment,
  TokenInputField,
  TxnPreview
} from '~/components/Common/Form';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TransactionToast from '~/components/Common/TxnToast';
import PlotInputField from '~/components/Common/Form/PlotInputField';
import TxnAccordion from '~/components/Common/TxnAccordion';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import { useSigner } from '~/hooks/ledger/useSigner';
import useCosmonautListingsLedger from '~/hooks/cosmomage/useCosmonautListingsLedger';
import useCosmonautPlots from '~/hooks/cosmomage/useCosmonautPlots';
import useHarvestableIndex from '~/hooks/moonmage/useHarvestableIndex';
import { ActionType } from '~/util/Actions';
import {
  PlotMap,
  toStringBaseUnitBN,
  displayTokenAmount,
  displayBN,
  displayFullBN
} from '~/util';
import { FarmToMode } from '~/lib/Moonmage/Farm';

import { MOON, PODS } from '~/constants/tokens';
import { ONE_BN, ZERO_BN, POD_MARKET_TOOLTIPS } from '~/constants';
import FieldWrapper from '~/components/Common/Form/FieldWrapper';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import { useFetchCosmomageStationItems } from '~/hooks/cosmomage/market/useCosmomageStation2';

export type CreateListingFormValues = {
  plot:        PlotFragment
  pricePerPod: BigNumber | null;
  expiresAt:   BigNumber | null;
  destination: FarmToMode | null;
  settings:    PlotSettingsFragment & {};
}

const PricePerPodInputProps = {
  inputProps: { step: '0.01' },
  endAdornment: (
    <TokenAdornment
      token={MOON[1]}
      size="small"
    />
  )
};
const ExpiresAtInputProps = {
  endAdornment: (
    <InputAdornment position="end">
      <Box sx={{ pr: 1 }}>
        <Typography color="text.primary" sx={{ fontSize: '18px' }}>Place in Line</Typography>
      </Box>
    </InputAdornment>
  )
};

const REQUIRED_KEYS = [
  'plotIndex',
  'start',
  'end',
  'pricePerPod',
  'expiresAt',
  'destination'
] as (keyof CreateListingFormValues)[];

const CreateListingV2Form: FC<
  FormikProps<CreateListingFormValues> & {
    plots: PlotMap<BigNumber>;
    harvestableIndex: BigNumber;
  }
> = ({
  values,
  isSubmitting,
  plots,
  harvestableIndex,
}) => {
  /// Form Data
  const plot = values.plot;

  /// Data
  const existingListings = useCosmonautListingsLedger();

  /// Derived
  const placeInLine = useMemo(
    () => (plot.index ? new BigNumber(plot.index).minus(harvestableIndex) : ZERO_BN),
    [harvestableIndex, plot.index]
  );

  /// Calculations
  const alreadyListed = plot?.index
    ? existingListings[toStringBaseUnitBN(plot.index, MOON[1].decimals)]
    : false;
  const isSubmittable = (
    !REQUIRED_KEYS.some((k) => values[k] === null)
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <PlotInputField
          plots={plots}
          size="small"
        />
        {plot.index && (
          <>
            {alreadyListed ? (
              <Alert variant="standard" color="warning" icon={<WarningAmberIcon />}>
                This Plot is already listed on the Market. Creating a new Listing will override the previous one.
              </Alert>
            ) : null}
            <FieldWrapper label="Price per Pod" tooltip={POD_MARKET_TOOLTIPS.pricePerPodListing}>
              <TokenInputField
                name="pricePerPod"
                placeholder="0.0000"
                InputProps={PricePerPodInputProps}
                max={ONE_BN}
                size="small"
              />
            </FieldWrapper>
            <FieldWrapper label="Expires in" tooltip={POD_MARKET_TOOLTIPS.expiresAt}>
              <TokenInputField
                name="expiresAt"
                placeholder="0.0000"
                InputProps={ExpiresAtInputProps}
                max={placeInLine.plus(plot.start || ZERO_BN)}
                size="small"
              />
            </FieldWrapper>
            <FarmModeField
              name="destination"
              circDesc="When Pods are sold, send Moons to your wallet."
              farmDesc="When Pods are sold, send Moons to your internal Moonmage balance."
              label="Send proceeds to"
            />
            {isSubmittable && (
              <Box>
                <TxnAccordion>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.BASE,
                        message: `List ${displayTokenAmount(plot.amount || ZERO_BN, PODS)} at ${displayFullBN(values.pricePerPod || ZERO_BN)} Moons per Pod from your Plot at ${displayBN(placeInLine)} in the Pod Line.`
                      },
                      {
                        type: ActionType.BASE,
                        message: `If the Pod Line moves forward by ${displayFullBN(values.expiresAt || ZERO_BN)} more Pods, this Listing will automatically expire.`
                      },
                      {
                        type: ActionType.BASE,
                        message: `Proceeds will be delivered to your ${values.destination === FarmToMode.INTERNAL ? 'Farm balance' : 'Circulating balance'}.`
                      }
                    ]}
                  />
                </TxnAccordion>
              </Box>
            )}
          </>
        )}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          tokens={[]}
          mode="auto"
        >
          {alreadyListed ? 'Update Listing' : 'List'}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// ---------------------------------------------------

const CreateListingV2: FC<{}> = () => {
  /// Tokens
  const getChainToken = useGetChainToken();

  /// Ledger
  const { data: signer } = useSigner();
  const moonmage = useMoonmageContract(signer);

  /// Moonmage
  const harvestableIndex = useHarvestableIndex();

  /// Cosmonaut
  const plots            = useCosmonautPlots();
  const { fetch: refetchCosmomageStationItems } = useFetchCosmomageStationItems();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: CreateListingFormValues = useMemo(() => ({
    plot: {
      index:       null,
      amount:      null,
      start:       null,
      end:         null,
    },
    pricePerPod: null,
    expiresAt:   null,
    destination: FarmToMode.INTERNAL,
    settings: {
      showRangeSelect: false,
    }
  }), []);

  // eslint-disable-next-line unused-imports/no-unused-vars
  const onSubmit = useCallback(async (values: CreateListingFormValues, formActions: FormikHelpers<CreateListingFormValues>) => {
    const Moon = getChainToken(MOON);
    let txToast;
    try {
      middleware.before();
      const { plot: { index, start, end, amount }, pricePerPod, expiresAt, destination } = values;
      if (!index || !start || !end || !amount || !pricePerPod || !expiresAt || !destination) throw new Error('Missing data');

      const plotIndexBN = new BigNumber(index);
      const numPods     = plots[index];

      if (!numPods) throw new Error('Plot not found.');
      if (start.gte(end)) throw new Error('Invalid start/end parameter.');
      if (!end.minus(start).eq(amount)) throw new Error('Malformatted amount.');
      if (pricePerPod.gt(1)) throw new Error('Price per pod cannot be more than 1.');
      if (expiresAt.gt(plotIndexBN.minus(harvestableIndex).plus(start))) throw new Error('This listing would expire after the Plot harvests.');

      txToast = new TransactionToast({
        loading: 'Listing Pods...',
        success: 'List successful.',
      });

      /// expiresAt is relative (ie 0 = front of pod line)
      /// add harvestableIndex to make it absolute
      const maxHarvestableIndex = expiresAt.plus(harvestableIndex);
      const txn = await moonmage.createPodListing(
        toStringBaseUnitBN(index,       Moon.decimals),   // absolute plot index
        toStringBaseUnitBN(start,       Moon.decimals),   // relative start index
        toStringBaseUnitBN(amount,      Moon.decimals),   // relative amount
        toStringBaseUnitBN(pricePerPod, Moon.decimals),   // price per pod
        toStringBaseUnitBN(maxHarvestableIndex, Moon.decimals), // absolute index of expiry
        toStringBaseUnitBN(new BigNumber(1), Moon.decimals), // minFillAmount is measured in Moons
        destination,
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchCosmomageStationItems(),
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
  }, [middleware, plots, harvestableIndex, moonmage, refetchCosmomageStationItems, getChainToken]);

  return (
    <Formik<CreateListingFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<CreateListingFormValues>) => (
        <CreateListingV2Form
          plots={plots}
          harvestableIndex={harvestableIndex}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default CreateListingV2;
