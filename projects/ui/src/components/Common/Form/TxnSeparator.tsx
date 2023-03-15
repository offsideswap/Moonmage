import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { StackProps } from '@mui/material';
import { MoonmagePalette, IconSize } from '../../App/muiTheme';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

const TxnSeparator : FC<StackProps> = ({ ...props }) => (
  <Row justifyContent="center" {...props}>
    <ExpandMoreIcon width={IconSize.xs} sx={{ color: MoonmagePalette.blue }} />
  </Row>
);

export default TxnSeparator;
