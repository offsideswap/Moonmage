import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';
import React from 'react';
import Token from '~/classes/Token';
import { MOON } from '~/constants/tokens';
import useAPY from '~/hooks/moonmage/useAPY';
import Row from '../Common/Row';
import TokenIcon from '../Common/TokenIcon';
import mageIconBlue from '~/img/moonmage/mage-icon-blue.svg';
import { displayFullBN } from '~/util';

import Stat from '../Common/Stat';
import useChainConstant from '~/hooks/chain/useChainConstant';

import { FC } from '~/types';

const TOOLTIP_COMPONENT_PROPS = {
  tooltip: {
    sx: {
      maxWidth: 'none !important',
      // boxShadow: '0px 6px 20px 10px rgba(255,255,255,0.3) !important',
    },
  },
};

type SiloAssetApyChipProps = {
  token: Token;
  metric: 'moon' | 'mage';
  variant?: 'default' | 'labeled';
};

const SiloAssetApyChip: FC<SiloAssetApyChipProps> = ({
  token,
  metric,
  variant = 'default',
}) => {
  const { data: latestYield } = useAPY();
  const Moon = useChainConstant(MOON);
  const isMoon = metric === 'moon';

  const seeds = token.getSeeds();
  const apys = latestYield
    ? seeds.eq(2)
      ? latestYield.bySeeds['2']
      : seeds.eq(4)
      ? latestYield.bySeeds['4']
      : null
    : null;

  const tokenProps = isMoon
    ? Moon
    : ({ symbol: 'Mage', logo: mageIconBlue } as Token);

  const val = apys ? apys[metric].times(100) : null;
  const displayString = `${
    val
      ? val.gt(0) && val.lt(0.1)
        ? '< 0.1'
        : val.toFixed(1)
      : '0.0'
  }%`;

  return (
    <Tooltip
      placement="right"
      componentsProps={TOOLTIP_COMPONENT_PROPS}
      title={
        <Row gap={0}>
          {metric === 'moon' && (
            <Box sx={{ px: 1, py: 0.5, maxWidth: 245 }}>
              <Stat
                title={
                  <Row gap={0.5}>
                    <TokenIcon token={Moon} />
                    Total Moons per Season
                  </Row>
                }
                gap={0.25}
                variant="h4"
                amount={
                  latestYield
                    ? displayFullBN(
                        latestYield.moonsPerSeasonEMA,
                        Moon.displayDecimals
                      )
                    : '0'
                }
                subtitle="30-day exponential moving average of Moons earned by all Mageholders per Season."
              />
            </Box>
          )}
          <Box
            sx={{
              maxWidth: isMoon ? 285 : 245,
              px: isMoon ? 1 : 0,
              py: isMoon ? 0.5 : 0,
            }}
          >
            {metric === 'moon' ? (
              <>
                {' '}
                The Variable Moon APY uses a moving average of Moons earned by
                Mageholders during recent Seasons to estimate a future rate of
                return, accounting for Mage growth.&nbsp;{' '}
              </>
            ) : (
              <>
                {' '}
                The Variable Mage APY estimates the growth in your Mage
                balance for Depositing {token.name}.&nbsp;{' '}
              </>
            )}
            <Link
              underline="hover"
              href="https://docs.moon.money/almanac/guides/silo/understand-vapy"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more
            </Link>
          </Box>
        </Row>
      }
    >
      <Chip
        variant="filled"
        color={metric === 'moon' ? 'primary' : 'secondary'}
        label={
          <Typography sx={{ whiteSpace: 'nowrap' }}>
            <Row gap={0.5} flexWrap="nowrap" justifyContent="center">
              {variant === 'labeled' && (
                <>
                  <TokenIcon token={tokenProps} /> vAPY:{' '}
                </>
              )}
              {displayString}
            </Row>
          </Typography>
        }
        onClick={undefined}
        size="small"
      />
    </Tooltip>
  );
};

export default SiloAssetApyChip;
