'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AirQualityData } from '@/types';

interface PollutantGridProps {
  pollutants?: AirQualityData['pollutants'] | null;
  dominantPollutant?: string;
  isLoading?: boolean;
}

interface PollutantMeta {
  key: keyof Pick<AirQualityData['pollutants'], 'pm25' | 'pm10' | 'co' | 'no2' | 'so2' | 'o3'>;
  label: string;
  fullName: string;
  unit: string;
  // Thresholds for mini color indicator: [goodMax, moderateMax, poorMax]
  thresholds: [number, number, number];
}

const POLLUTANTS: PollutantMeta[] = [
  {
    key: 'pm25',
    label: 'PM2.5',
    fullName: 'Fine Particulate',
    unit: 'µg/m³',
    thresholds: [30, 60, 120],
  },
  {
    key: 'pm10',
    label: 'PM10',
    fullName: 'Coarse Particulate',
    unit: 'µg/m³',
    thresholds: [50, 100, 250],
  },
  {
    key: 'co',
    label: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'µg/m³',
    thresholds: [1000, 2000, 10000],
  },
  {
    key: 'no2',
    label: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    thresholds: [40, 80, 180],
  },
  {
    key: 'so2',
    label: 'SO₂',
    fullName: 'Sulphur Dioxide',
    unit: 'µg/m³',
    thresholds: [40, 80, 380],
  },
  {
    key: 'o3',
    label: 'O₃',
    fullName: 'Ground Ozone',
    unit: 'µg/m³',
    thresholds: [50, 100, 168],
  },
];

function getPollutantStatus(
  value: number | null | undefined,
  thresholds: [number, number, number]
): { dot: string; bar: string; text: string; level: string; percent: number } {
  if (value == null || Number.isNaN(value)) {
    return {
      dot: 'bg-zinc-300 dark:bg-zinc-600',
      bar: 'bg-zinc-300 dark:bg-zinc-700',
      text: 'text-muted-foreground',
      level: 'No data',
      percent: 0,
    };
  }

  const [good, moderate, poor] = thresholds;
  const percent = Math.min(100, Math.max(8, Math.round((value / (poor * 1.2)) * 100)));

  if (value <= good) {
    return {
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      level: 'Low',
      percent,
    };
  }
  if (value <= moderate) {
    return {
      dot: 'bg-yellow-500',
      bar: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      level: 'Moderate',
      percent,
    };
  }
  if (value <= poor) {
    return {
      dot: 'bg-orange-500',
      bar: 'bg-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      level: 'Elevated',
      percent,
    };
  }
  return {
    dot: 'bg-red-500',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    level: 'High',
    percent,
  };
}

export function PollutantGrid({
  pollutants,
  dominantPollutant,
  isLoading = false,
}: PollutantGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {POLLUTANTS.map((p) => (
          <Card key={p.key} size="sm" className="bg-card/80">
            <CardContent className="flex flex-col gap-2 py-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="size-2.5 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {POLLUTANTS.map((pollutant, index) => {
        const rawValue = pollutants?.[pollutant.key] ?? null;
        const status = getPollutantStatus(rawValue, pollutant.thresholds);
        const formattedValue =
          rawValue !== null && rawValue !== undefined && !Number.isNaN(rawValue)
            ? rawValue >= 100
              ? Math.round(rawValue).toLocaleString('en-IN')
              : (Math.round(rawValue * 10) / 10).toString()
            : 'N/A';

        const isDominant =
          dominantPollutant?.toUpperCase().replace(/[^A-Z0-9]/g, '') ===
          pollutant.key.toUpperCase();

        return (
          <motion.div
            key={pollutant.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <Card
              size="sm"
              className={cn(
                'h-full border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-md',
                isDominant && 'ring-1 ring-primary/40 border-primary/40'
              )}
            >
              <CardContent className="flex flex-col justify-between gap-2.5 py-0.5">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold tracking-tight">
                        {pollutant.label}
                      </span>
                      {isDominant && (
                        <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
                          Main
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {pollutant.fullName}
                    </p>
                  </div>
                  <span
                    className={cn('mt-1 size-2.5 shrink-0 rounded-full', status.dot)}
                    title={status.level}
                    aria-label={`${pollutant.label} level: ${status.level}`}
                  />
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tabular-nums tracking-tight">
                      {formattedValue}
                    </span>
                    {formattedValue !== 'N/A' && (
                      <span className="text-[11px] text-muted-foreground">
                        {pollutant.unit}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', status.bar)}
                        style={{ width: `${status.percent}%` }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-medium', status.text)}>
                      {status.level}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
