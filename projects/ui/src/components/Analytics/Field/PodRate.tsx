import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalPodRateDocument, SeasonalPodRateQuery } from '~/generated/graphql';
import useSeason from '~/hooks/moonmage/useSeason';
import usePodRate from '~/hooks/moonmage/usePodRate';
import { SnapshotData } from '~/hooks/moonmage/useSeasonsQuery';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatPercentage } from '~/components/Analytics/formatters';

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalPodRateQuery>) => parseFloat(season.podRate) * 100;
const formatValue = (value: number) => `${value.toFixed(2)}%`;
const statProps = {
  title: 'Pod Rate',
  titleTooltip: 'The ratio of outstanding Pods per Moon, displayed as a percentage. The Pod Rate is used by Moonmage as a proxy for its health.',
  gap: 0.25,
  sx: { ml: 0 }
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatPercentage
};

const PodRate: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => {
  const podRate = usePodRate();
  const season  = useSeason();
  return (
    <SeasonPlot<SeasonalPodRateQuery>
      height={height}
      document={SeasonalPodRateDocument}
      defaultValue={podRate?.gt(0) ? podRate.toNumber() : 0}
      defaultSeason={season?.gt(0) ? season.toNumber() : 0}
      getValue={getValue}
      formatValue={formatValue}
      StatProps={statProps}
      LineChartProps={lineChartProps}
    />
  );
};

export default PodRate;
