import { Dialog, IconButton, Stack, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { MoonmagePalette, FontSize } from '~/components/App/muiTheme';
import CondensedCard from '~/components/Common/Card/CondensedCard';
import { CosmomageStationOrder } from '~/hooks/cosmomage/market/useCosmomageStation2';
import CosmonautModeFieldDialog from './FarmToModeDialog';
import useCosmomageStationItemStats from '~/hooks/cosmomage/market/useCosmomageStationItemStats';
import Row from '~/components/Common/Row';
import useCosmomageStationCancelTxn from '~/hooks/cosmomage/market/useCosmomageStationCancelTxn';
import { FarmToMode } from '~/lib/Moonmage/Farm';
import { PodOrder } from '~/state/cosmomage/market';

type Props = {
  item: CosmomageStationOrder | undefined | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  open2: boolean;
  setOpen2: React.Dispatch<React.SetStateAction<boolean>>;
};

const MarketItemDetailsDialog: React.FC<Props> = ({
  item,
  open,
  open2,
  setOpen,
  setOpen2,
}) => {
  const { data, isCancellable, openStates } = useCosmomageStationItemStats(item);
  const { loading, cancelListing, cancelOrder } = useCosmomageStationCancelTxn();

  const onClick = useCallback(() => {
    if (!item) return;
    if (item.type === 'listing') {
      // close ORDER DETAILS dialog
      setOpen(false);
      // initiate cancel listing
      cancelListing(item.id);
    } else if (item?.type === 'order') {
      // close ORDER DETAILS dialog
      setOpen(false);
      // open FARM TO MODE dialog
      setOpen2(true);
    }
  }, [cancelListing, item, setOpen, setOpen2]);

  const handleCancelOrder = useCallback(async (mode: FarmToMode) => {
    if (!item || !item.source) return;
    cancelOrder(
      item.source as PodOrder, 
      mode, 
      () => setOpen2(false)
    );
  }, [cancelOrder, item, setOpen2]);

  if (!data) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <CondensedCard
          title="ORDER DETAILS"
          actions={
            <IconButton
              aria-label="close"
              onClick={() => setOpen(false)}
              disableRipple
              sx={{ p: 0 }}
            >
              <CloseIcon
                sx={{ fontSize: FontSize.base, color: 'text.primary' }}
              />
            </IconButton>
          }
        >
          <Stack sx={{ borderTop: '0.5px solid', borderColor: 'divider' }}>
            <Stack
              sx={{ borderBottom: '0.5px solid', borderColor: 'divider' }}
              gap={2}
              px={1.5}
              py={1}
            >
              {data.map(({ label, info }) => {
                const infoColor =
                  label === 'STATUS' && openStates.includes(info)
                    ? MoonmagePalette.theme.winter.orderGreen
                    : 'text.secondary';
                return (
                  <Row width="100%" justifyContent="space-between" key={label}>
                    <Typography variant="bodySmall" color="text.primary">
                      {label}
                    </Typography>
                    <Typography variant="bodySmall" sx={{ color: infoColor }}>
                      {info}
                    </Typography>
                  </Row>
                );
              })}
            </Stack>
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              gap={1}
              p={1}
            >
              <LoadingButton
                color="error"
                variant="text"
                loading={loading}
                disabled={!data || !isCancellable}
                fullWidth
                onClick={onClick}
              >
                Cancel
              </LoadingButton>
            </Stack>
          </Stack>
        </CondensedCard>
      </Dialog>
      <CosmonautModeFieldDialog
        open={open2}
        onClose={() => setOpen2(false)}
        onSubmit={handleCancelOrder}
      />
    </>
  );
};
export default MarketItemDetailsDialog;
