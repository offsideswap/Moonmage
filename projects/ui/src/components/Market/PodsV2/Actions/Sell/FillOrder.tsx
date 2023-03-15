import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { bigNumberResult, displayBN, displayFullBN } from '~/util';
import { useMoonmageContract } from '~/hooks/ledger/useContract';
import usePodOrder from '~/hooks/moonmage/usePodOrder';
import FillOrderForm from '~/components/Market/PodsV2/Actions/Sell/FillOrderForm';
import StatHorizontal from '~/components/Common/StatHorizontal';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';
import CosmonautChip from '~/components/Common/CosmonautChip';
import { MOON, PODS } from '~/constants/tokens';

const FillOrder: React.FC<{}> = () => {
  const { orderID } = useParams<{ orderID?: string }>();
  const { data: podOrder, source, loading, error } = usePodOrder(orderID);
  const moonmage = useMoonmageContract();

  /// Verify that this order is still live via the contract.
  const [orderValid, setOrderValid] = useState<null | boolean>(null);
  useEffect(() => {
    if (orderID) {
      (async () => {
        try {
          const _order = await moonmage.podOrderById(orderID.toString()).then(bigNumberResult);
          console.debug('[pages/order] order = ', _order);
          setOrderValid(_order?.gt(0));
        } catch (e) {
          console.error(e);
          setOrderValid(false);
        }
      })();
    }
  }, [moonmage, orderID]);

  /// Loading isn't complete until orderValid is set
  if (loading || orderValid === null) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <CircularProgress color="primary" />
      </Stack>
    );
  }
  if (error) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <Typography>{error.message.toString()}</Typography>
      </Stack>
    );
  }
  if (!podOrder || !orderValid) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <Typography>Order not found.</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {/* Listing Details */}
      <Box px={0.5}>
        <Stack gap={0.75}>
          {/* add mr of -0.5 to offset padding of cosmomage chip */}
          <StatHorizontal label="Buyer" maxHeight={20} sx={{ mr: -0.5 }}>
            <CosmonautChip account={podOrder.account} />
          </StatHorizontal>
          <StatHorizontal label="Place in Line">
            0 - {displayBN(podOrder.maxPlaceInLine)}
          </StatHorizontal>
          <StatHorizontal label="Pods Requested">
            <Row gap={0.25}>
              <TokenIcon token={PODS} />{' '}
              {displayBN(podOrder.podAmountRemaining)}
            </Row>
          </StatHorizontal>
          <StatHorizontal label="Price per Pod">
            <Row gap={0.25}>
              <TokenIcon token={MOON[1]} />{' '}
              {displayFullBN(podOrder.pricePerPod)}
            </Row>
          </StatHorizontal>
          <StatHorizontal label="Moons Remaining">
            <Row gap={0.25}>
              <TokenIcon token={MOON[1]} />{' '}
              {displayBN(podOrder.podAmountRemaining.times(podOrder.pricePerPod))}
            </Row>
          </StatHorizontal>
        </Stack>
      </Box>
      <FillOrderForm podOrder={podOrder} />
    </Stack>
  );
};

export default FillOrder;
