import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useAccount as useWagmiAccount } from 'wagmi';
import { Stack, Tooltip, Typography } from '@mui/material';
import { GridColumns } from '@mui/x-data-grid';
import { Token } from '~/classes';
import { CosmonautSiloBalance } from '~/state/cosmomage/silo';
import type { DepositCrate } from '~/state/cosmomage/silo';
import { calculateGrownMage, displayBN, displayFullBN } from '~/util';
import useSeason from '~/hooks/moonmage/useSeason';
import { MOON, MAGE } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import useSiloTokenToFiat from '~/hooks/moonmage/useSiloTokenToFiat';
import useChainConstant from '~/hooks/chain/useChainConstant';
import COLUMNS from '~/components/Common/Table/cells';
import Fiat from '~/components/Common/Fiat';
import TableCard from '../../Common/TableCard';
import StatHorizontal from '~/components/Common/StatHorizontal';

/**
 * Prep data to loading to a CratesCard.
 */
import { FC } from '~/types';

const Deposits : FC<{
  token: Token;
  siloBalance: CosmonautSiloBalance | undefined;
}> = ({
  token,
  siloBalance,
}) => {
  const Moon = useChainConstant(MOON);
  const getUSD = useSiloTokenToFiat();
  const currentSeason = useSeason();
  const account = useWagmiAccount();

  const rows : (DepositCrate & { id: BigNumber })[] = useMemo(() => 
    siloBalance?.deposited.crates.map((deposit) => ({
      id: deposit.season,
      ...deposit
    })) || [],
    [siloBalance?.deposited.crates]
  );

  const columns = useMemo(() => ([
    COLUMNS.season,
    {
      field: 'amount',
      flex: 1,
      headerName: 'Amount',
      align: 'left',
      headerAlign: 'left',
      valueFormatter: (params) => displayFullBN(params.value, token.displayDecimals, token.displayDecimals),
      renderCell: (params) => (
        <Tooltip
          placement="bottom"
          title={(
            <Stack gap={0.5}>
              <StatHorizontal label="BDV when Deposited">
                {displayFullBN(params.row.bdv.div(params.row.amount), 6)}
              </StatHorizontal>
              <StatHorizontal label="Total BDV">
                {displayFullBN(params.row.bdv, token.displayDecimals)}
              </StatHorizontal>
              <StatHorizontal label="Current Value">
                <Fiat amount={params.row.amount} token={Moon} />
              </StatHorizontal>
            </Stack>
          )}
        >
          <span>
            <Typography display={{ xs: 'none', md: 'block' }}>{displayFullBN(params.value, token.displayDecimals, token.displayDecimals)}</Typography>
            <Typography display={{ xs: 'block', md: 'none' }}>{displayBN(params.value)}</Typography>
          </span>
        </Tooltip>
      ),
      sortable: false,
    },
    {
      field: 'mage',
      flex: 1,
      headerName: 'Mage',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => displayBN(params.value),
      renderCell: (params) => {
        const grownMage = calculateGrownMage(currentSeason, params.row.seeds, params.row.season); 
        const totalMage = params.value.plus(grownMage);
        return (
          <Tooltip
            placement="bottom"
            title={(
              <Stack gap={0.5}>
                <StatHorizontal label="Mage at Deposit">
                  {displayFullBN(params.row.mage, 2, 2)}
                </StatHorizontal>
                <StatHorizontal label="Mage grown since Deposit">
                  {displayFullBN(grownMage, 2, 2)}
                </StatHorizontal>
                {/* <Typography color="gray">Earning {displayBN(seedsPerSeason)} Mage per Season</Typography> */}
              </Stack>
            )}
          >
            <span>
              <Typography display={{ xs: 'none', md: 'block' }}>{displayFullBN(totalMage, MAGE.displayDecimals, MAGE.displayDecimals)}</Typography>
              <Typography display={{ xs: 'block', md: 'none' }}>{displayBN(totalMage)}</Typography>
            </span>
          </Tooltip>
        );
      },
      sortable: false,
    },
    COLUMNS.seeds,
  ] as GridColumns), [token.displayDecimals, Moon, currentSeason]);

  const amount = siloBalance?.deposited.amount;
  const state = !account ? 'disconnected' : 'ready';

  return (
    <TableCard
      title={`${token.name} Deposits`}
      rows={rows}
      columns={columns}
      amount={amount}
      value={getUSD(token, amount || ZERO_BN)}
      state={state}
      token={token}
    />
  );
};

export default Deposits;
