'use client';

import React, { useId, useMemo } from 'react';
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
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface PollutantTrendPoint {
  time: string;
  label?: string;
  [key: string]: string | number | null | undefined;
}

export interface PollutantTrendChartProps {
  data: PollutantTrendPoint[];
  pollutantKey: string;
  color: string;
  title: string;
  unit: string;
  subtitle?: string;
  isLoading?: boolean;
  height?: number;
}

interface FormattedPoint {
  time: string;
  axisLabel: string;
  tooltipTime: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: FormattedPoint;
  }>;
  title: string;
  unit: string;
  color: string;
}

function formatAxisTime(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    const parts = isoTime.split('T');
    return parts[1] ? parts[1].slice(0, 5) : isoTime;
  }
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTooltipTime(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return isoTime;
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function PollutantTooltip({ active, payload, title, unit, color }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.tooltipTime}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {title}
        </span>
        <span className="font-bold tabular-nums text-foreground">
          {point.value.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}

export function PollutantTrendChart({
  data,
  pollutantKey,
  color,
  title,
  unit,
  subtitle,
  isLoading = false,
  height = 280,
}: PollutantTrendChartProps) {
  const rawId = useId();
  const gradientId = `pollutant-gradient-${rawId.replace(/:/g, '')}`;

  const chartData: FormattedPoint[] = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data
      .map((item) => {
        const rawVal = item[pollutantKey];
        const numericVal = typeof rawVal === 'number' && !Number.isNaN(rawVal) ? rawVal : 0;
        return {
          time: item.time,
          axisLabel: item.label || formatAxisTime(item.time),
          tooltipTime: formatTooltipTime(item.time),
          value: Math.round(numericVal * 10) / 10,
        };
      });
  }, [data, pollutantKey]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    const peak = Math.max(...values);
    const latest = values[values.length - 1];
    return {
      avg: Math.round(avg * 10) / 10,
      peak: Math.round(peak * 10) / 10,
      latest: Math.round(latest * 10) / 10,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full rounded-xl" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4" style={{ color }} />
              {title}
            </CardTitle>
            {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
          </div>

          {stats && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="rounded-lg bg-muted/60 px-2.5 py-1">
                <span className="text-muted-foreground">Avg: </span>
                <span className="font-semibold tabular-nums">
                  {stats.avg} {unit}
                </span>
              </div>
              <div className="rounded-lg bg-muted/60 px-2.5 py-1">
                <span className="text-muted-foreground">Peak: </span>
                <span className="font-semibold tabular-nums">
                  {stats.peak} {unit}
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {chartData.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm text-muted-foreground"
              style={{ height }}
            >
              No trend data available for {title}.
            </div>
          ) : (
            <div className="w-full" style={{ height }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.38} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} vertical={false} />
                  <XAxis
                    dataKey="axisLabel"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={34}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    unit={unit ? ` ${unit.split('/')[0]}` : ''}
                  />
                  <Tooltip
                    content={<PollutantTooltip title={title} unit={unit} color={color} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={title}
                    stroke={color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    activeDot={{ r: 5, strokeWidth: 0, fill: color }}
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
