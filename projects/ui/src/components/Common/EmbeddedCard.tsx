import React from 'react';
import { Card, CardProps } from '@mui/material';

import { FC } from '~/types';
import { MoonmagePalette } from '../App/muiTheme';

const EmbeddedCard: FC<CardProps> = ({ children, ...cardProps }) => (
  <Card 
    {...cardProps} 
    sx={{ 
      ...cardProps.sx, 
      border: 'none',
      borderRadius: '6px !important',
      background: MoonmagePalette.white
    }}>
    {children}
  </Card>
);

export default EmbeddedCard;
