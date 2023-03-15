import React, { useEffect, useMemo, useRef } from 'react';
import { Box, BoxProps, ClickAwayListener } from '@mui/material';
import { MoonmagePalette } from '~/components/App/muiTheme';
import { FC } from '~/types';

const BorderEffect: FC<
  {
    enabled?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
  } & BoxProps
> = ({ children, enabled = true, fullWidth = false, disabled = false }) => {
  // ref for this component to control border color
  const ref = useRef<HTMLDivElement | null>(null);

  // ref state to keep track of active state
  const activeRef = useRef<boolean>(false);

  const actions = useMemo(() => {
    const handleMouseOver = () => {
      if (!ref.current || activeRef.current || disabled) return;
      ref.current.style.padding = '1px';
      ref.current.style.border = '1px solid';
      ref.current.style.borderColor = MoonmagePalette.textBlue;
    };

    const handleMouseLeave = () => {
      if (!ref.current || activeRef.current || disabled) return;
      ref.current.style.padding = '1px';
      ref.current.style.border = '1px solid';
      ref.current.style.borderColor = MoonmagePalette.inputGrey;
    };

    const handleOnClick = () => {
      if (!ref.current || activeRef.current || disabled) return;
      ref.current.style.padding = '0px';
      ref.current.style.border = '2px solid';
      ref.current.style.borderColor = MoonmagePalette.theme.winter.primary;
      activeRef.current = true;
    };

    const handleClickAway = () => {
      if (!ref.current || !activeRef.current || disabled) return;
      ref.current.style.padding = '1px';
      ref.current.style.border = '1px solid';
      ref.current.style.borderColor = MoonmagePalette.inputGrey;
      activeRef.current = false;
    };

    return {
      handleMouseOver,
      handleMouseLeave,
      handleOnClick,
      handleClickAway,
    };
  }, [disabled]);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    if (disabled) {
      ref.current.style.borderColor = MoonmagePalette.inputGrey;
    }
  }, [enabled, disabled]);

  return !enabled ? (
    <>{children}</>
  ) : (
    <Box
      ref={ref}
      sx={{
        borderRadius: 1,
        border: '1px solid',
        padding: '1px',
        boxSizing: 'border-box',
        borderColor: MoonmagePalette.inputGrey,
        backgroundColor: MoonmagePalette.white,
      }}
      width={fullWidth ? '100%' : undefined}
      onMouseOver={actions.handleMouseOver}
      onMouseLeave={actions.handleMouseLeave}
      onClick={actions.handleOnClick}
    >
      <ClickAwayListener onClickAway={actions.handleClickAway}>
        <Box>{children}</Box>
      </ClickAwayListener>
    </Box>
  );
};

export default BorderEffect;
