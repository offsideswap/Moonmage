import React from 'react';
import { lighten, StackProps } from '@mui/material';
import Row from '~/components/Common/Row';

import { FC } from '~/types';
import { MoonmagePalette } from '~/components/App/muiTheme';

const OutputField : FC<{
  isNegative?: boolean;
  size?: 'small'
} & StackProps> = ({
  isNegative = false,
  children,
  sx,
  size,
  ...props
}) => (
  <Row
    sx={{
      backgroundColor: isNegative ? lighten(MoonmagePalette.lightestRed, 0.25) : MoonmagePalette.lightestBlue,
      borderRadius: 1,
      px: size === 'small' ? 1 : 2,
      py: size === 'small' ? 0.5 : 2,
      color: isNegative ? MoonmagePalette.trueRed : 'inherit',
      height: size === 'small' ? '42px' : '70px',
      ...sx
    }}
    alignItems="center"
    justifyContent="space-between"
    {...props}
    >
    {children}
  </Row>
);

export default OutputField;
