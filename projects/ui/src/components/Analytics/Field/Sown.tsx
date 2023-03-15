import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalSownDocument, SeasonalSownQuery } from '~/generated/graphql';
import useSeason from '~/hooks/moonmage/useSeason';
import { SnapshotData } from '~/hooks/moonmage/useSeasonsQuery';
import { toTokenUnitsBN } from '~/util';
import { MOON } from '~/constants/tokens';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatTruncated } from '~/components/Analytics/formatters'; 

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalSownQuery>) => toTokenUnitsBN(season.sownMoons, MOON[1].decimals).toNumber();
const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const statProps = {
  title: 'Moons Sown',
  titleTooltip: 'The total number of Moons Sown at the end of each Season.',
  gap: 0.25,
  sx: { ml: 0 }
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatTruncated
};

const Sown: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => {
  const season  = useSeason();
  return (
    <SeasonPlot<SeasonalSownQuery>
      height={height}
      document={SeasonalSownDocument}
      defaultSeason={season?.gt(0) ? season.toNumber() : 0}
      getValue={getValue}
      formatValue={formatValue}
      StatProps={statProps}
      LineChartProps={lineChartProps}
    />
  );
};

export default Sown;
