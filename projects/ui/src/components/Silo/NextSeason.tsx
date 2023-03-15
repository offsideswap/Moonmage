import React from 'react';
import { Accordion, AccordionDetails, Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { SupportedChainId } from '~/constants/chains';
import { MOON, MAGE } from '~/constants/tokens';
import AccordionWrapper from '~/components/Common/Accordion/AccordionWrapper';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import TokenIcon from '~/components/Common/TokenIcon';
import Row from '~/components/Common/Row';
import { FC } from '~/types';

// ---------------------------------------------------------------

const Stat : FC<{ name: string }> = ({ children, name }) => (
  <Row justifyContent="space-between">
    <Typography variant="h4">{name}</Typography>
    <Typography variant="h4" textAlign="right">{children}</Typography>
  </Row>
);

const StatColumn : FC<{
  title: string;
  icon: JSX.Element
}> = ({
  title,
  icon,
  children
}) => (
  <Grid item xs={6}>
    <Stack gap={1}>
      <Row justifyContent="space-between">
        <Typography variant="h3">{title}</Typography>
        <Row>{icon}</Row>
      </Row>
      {children}
    </Stack>
  </Grid>
);

const NextSeason : FC<{ title: string | JSX.Element }> = ({ title }) => (
  <AccordionWrapper>
    <Accordion>
      <StyledAccordionSummary
        title={title}
        icon={<Typography>⏱</Typography>}
        gradientText={false}
      />
      <AccordionDetails sx={{ p: 0, pb: 2 }}>
        {/* Primary */}
        <Box sx={{ px: 2 }}>
          <Grid container columnSpacing={4}>
            {/* Moon Rewards */}
            <StatColumn title="Moon Rewards" icon={<TokenIcon token={MOON[SupportedChainId.MAINNET]} />}>
              <Stat name="New Moons">
                730,012
              </Stat>
              <Stat name="% of new Moons allocated to the Silo">
                33.3333%
              </Stat>
              <Stat name="My % Ownership of Mage">
                0.1012%
              </Stat>
            </StatColumn>
            {/* Mage Rewards */}
            <StatColumn title="Mage Rewards" icon={<TokenIcon token={MAGE} />}>
              <Stat name="My Seed Balance">
                730,012
              </Stat>
              <Stat name="New Mage per Seed">
                0.0001
              </Stat>
            </StatColumn>
          </Grid>
        </Box>
        <Divider sx={{ borderColor: 'secondary', my: 2 }} />
        {/* Summary */}
        <Box sx={{ px: 2 }}>
          <Grid container columnSpacing={4}>
            <StatColumn
              title="My New Earned Moons"
              icon={(
                <>
                  <Row gap={0.3}>
                    <TokenIcon token={MOON[SupportedChainId.MAINNET]} />
                    <Typography variant="h3">
                      244.33
                    </Typography>
                  </Row>
                </>
              )}
            />
            <StatColumn
              title="My New Earned Mage"
              icon={(
                <>
                  <Row gap={0.3}>
                    <TokenIcon token={MAGE} />
                    <Typography variant="h3">
                      244.33
                    </Typography>
                  </Row>
                </>
              )}
            />
          </Grid>
        </Box>
      </AccordionDetails>
    </Accordion>
  </AccordionWrapper>
);

export default NextSeason;
