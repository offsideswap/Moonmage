import { Box, Card, Stack, Typography } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import useAccount from '~/hooks/ledger/useAccount';
import { displayBN, trimAddress } from '~/util';
import { AppState } from '~/state';
import AuthEmptyState from '~/components/Common/ZeroState/AuthEmptyState';
import AddressIcon from '~/components/Common/AddressIcon';
import { IconSize } from '~/components/App/muiTheme';
import { MAGE } from '~/constants/tokens';
import TokenIcon from '~/components/Common/TokenIcon';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

const MageholderCard : FC<{}> = () => {
  const account       = useAccount();
  const cosmomageSilo    = useSelector<AppState, AppState['_cosmomage']['silo']>((state) => state._cosmomage.silo);
  
  return (
    <Card sx={{ position: 'sticky', top: 120, p: 2 }}>
      <Stack gap={1}>
        <Row justifyContent="space-between">
          <Typography variant="h4">Mageholder</Typography>
          {account && (
            <Row gap={0.3}>
              <AddressIcon address={account} size={IconSize.xs} />
              <Typography variant="body1">{trimAddress(account)}</Typography>
            </Row>
          )}
        </Row>
        {account ? (
          <Row gap={0.5}>
            <TokenIcon token={MAGE} css={{ height: IconSize.small }} />
            <Typography variant="bodyLarge">{displayBN(cosmomageSilo.mage.active)} MAGE</Typography>
          </Row>
        ) : (
          <Box height={{ xs: 100, md: 150 }}>
            <AuthEmptyState message="Your Mage will appear here." />
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default MageholderCard;
