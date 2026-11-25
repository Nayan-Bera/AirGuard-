'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAQIColor } from '@/lib/utils/index';
import type { HourlyAirQuality } from '@/types';

interface AQIChartProps {
  data: HourlyAirQuality[];
  isLoading?: boolean;
}

interface ChartPoint {
  time: string;
  label: string;
  pm25: number;
  pm10: number;
  aqi: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    payload?: ChartPoint;
  }>;
  label?: string;
}

function formatHourLabel(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    const timePart = isoTime.split('T')[1];
    return timePart ? timePart.slice(0, 5) : isoTime;
  }
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const aqiStyle = getAQIColor(point.aqi);

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-violet-500" />
            PM2.5
          </span>
          <span className="font-semibold tabular-nums">{point.pm25.toFixed(1)} µg/m³</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-sky-500" />
            PM10
          </span>
          <span className="font-semibold tabular-nums">{point.pm10.toFixed(1)} µg/m³</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-border/60 pt-1">
          <span className="text-muted-foreground">CPCB AQI</span>
          <span className={`font-semibold tabular-nums ${aqiStyle.text}`}>
            {point.aqi} ({aqiStyle.label})
          </span>
        </div>
      </div>
    </div>
  );
}

export function AQIChart({ data, isLoading = false }: AQIChartProps) {
  const chartData: ChartPoint[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const now = Date.now();
    // Prefer upcoming/recent 24-hour window if timestamps are valid
    const futureOrRecent = data.filter((item) => {
      const t = new Date(item.time).getTime();
      return !Number.isNaN(t) && t >= now - 6 * 3600 * 1000;
    });
    const slice = (futureOrRecent.length >= 8 ? futureOrRecent : data).slice(0, 24);
    return slice.map((item) => ({
      time: item.time,
      label: formatHourLabel(item.time),
      pm25: Math.round((item.pm25 ?? 0) * 10) / 10,
      pm10: Math.round((item.pm10 ?? 0) * 10) / 10,
      aqi: Math.round(item.aqi ?? 0),
    }));
  }, [data]);

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
      transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="size-4 text-violet-500" />
            Hourly Particulate Trend
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-violet-500" />
              PM2.5
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-500" />
              PM10
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Hourly air quality data is unavailable.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="pm10Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    unit=" µg"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pm10"
                    name="PM10"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pm10Gradient)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    name="PM2.5"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pm25Gradient)"
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
