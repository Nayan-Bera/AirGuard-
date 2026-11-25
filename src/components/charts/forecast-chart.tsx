'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAQIColor } from '@/lib/utils/index';
import type { AirQualityForecast, WeatherForecast } from '@/types';

interface ForecastChartProps {
  airQualityForecast: AirQualityForecast[];
  weatherForecast?: WeatherForecast[];
  isLoading?: boolean;
}

interface ForecastChartPoint {
  date: string;
  label: string;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  tempMax?: number;
  tempMin?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: ForecastChartPoint;
  }>;
}

function getAQIBarFill(aqi: number): string {
  if (aqi <= 50) return '#10b981';
  if (aqi <= 100) return '#22c55e';
  if (aqi <= 200) return '#eab308';
  if (aqi <= 300) return '#f97316';
  if (aqi <= 400) return '#ef4444';
  return '#991b1b';
}

function formatDateLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const aqiColor = getAQIColor(point.aqi);

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.date}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Forecast AQI</span>
          <span className={`font-semibold tabular-nums ${aqiColor.text}`}>
            {point.aqi} ({point.category})
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">PM2.5 / PM10</span>
          <span className="font-medium tabular-nums">
            {point.pm25} / {point.pm10} µg/m³
          </span>
        </div>
        {point.tempMax !== undefined && (
          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-1">
            <span className="text-muted-foreground">Temperature</span>
            <span className="font-semibold text-amber-500 tabular-nums">
              {Math.round(point.tempMax)}°C
              {point.tempMin !== undefined ? ` / ${Math.round(point.tempMin)}°C` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForecastChart({
  airQualityForecast,
  weatherForecast = [],
  isLoading = false,
}: ForecastChartProps) {
  const chartData: ForecastChartPoint[] = React.useMemo(() => {
    const weatherByDate = new Map(weatherForecast.map((w) => [w.date, w]));
    return airQualityForecast.slice(0, 7).map((item, idx) => {
      const weather = weatherByDate.get(item.date);
      return {
        date: item.date,
        label: formatDateLabel(item.date, idx),
        aqi: Math.round(item.aqi),
        category: item.category || getAQIColor(item.aqi).label,
        pm25: item.pm25,
        pm10: item.pm10,
        tempMax: weather?.tempMax,
        tempMin: weather?.tempMin,
      };
    });
  }, [airQualityForecast, weatherForecast]);

  const hasTemp = chartData.some((d) => d.tempMax !== undefined);

  if (isLoading) {
    return (
      <Card className="border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.16, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="size-4 text-amber-500" />
            Daily AQI & Temperature Forecast
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-500" />
              CPCB AQI
            </span>
            {hasTemp && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-amber-500" />
                Max Temp (°C)
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Daily AQI forecast is unavailable.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: hasTemp ? 4 : 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="aqi"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  {hasTemp && (
                    <YAxis
                      yAxisId="temp"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#f59e0b' }}
                      tickLine={false}
                      axisLine={false}
                      unit="°"
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    yAxisId="aqi"
                    dataKey="aqi"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.date} fill={getAQIBarFill(entry.aqi)} fillOpacity={0.88} />
                    ))}
                  </Bar>
                  {hasTemp && (
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="tempMax"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
