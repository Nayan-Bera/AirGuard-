'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, MapPin, Radio, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  formatTimestamp,
  getAQIColor,
  getAQIGradient,
  getDataFreshness,
} from '@/lib/utils/index';
import type { AirQualityData } from '@/types';

interface AQICardProps {
  data: AirQualityData | null;
  city?: string;
  isLoading?: boolean;
}

const FRESHNESS_CONFIG: Record<
  AirQualityData['dataFreshness'],
  { label: string; dotClass: string; textClass: string }
> = {
  live: {
    label: 'Live',
    dotClass: 'bg-emerald-500 animate-pulse',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  recent: {
    label: 'Recent',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-600 dark:text-sky-400',
  },
  stale: {
    label: 'Stale',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  unavailable: {
    label: 'Unavailable',
    dotClass: 'bg-zinc-400',
    textClass: 'text-muted-foreground',
  },
};

function getAQIStrokeColor(aqi: number): string {
  if (aqi <= 50) return '#10b981';
  if (aqi <= 100) return '#22c55e';
  if (aqi <= 200) return '#eab308';
  if (aqi <= 300) return '#f97316';
  if (aqi <= 400) return '#ef4444';
  return '#991b1b';
}

function getAQIHealthSummary(aqi: number): string {
  if (aqi <= 50) return 'Minimal impact. Ideal for outdoor activities.';
  if (aqi <= 100) return 'Minor breathing discomfort to sensitive people.';
  if (aqi <= 200) return 'Breathing discomfort to people with lung or heart issues.';
  if (aqi <= 300) return 'Breathing discomfort to most people on prolonged exposure.';
  if (aqi <= 400) return 'Respiratory illness on prolonged exposure. Limit outdoor time.';
  return 'Severe health impact even on healthy people. Stay indoors.';
}

export function AQICard({ data, city, isLoading = false }: AQICardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:justify-between">
          <Skeleton className="size-44 rounded-full" />
          <div className="flex flex-1 flex-col gap-3 w-full">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="relative overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Air Quality Index</span>
            <Badge variant="outline">India CPCB AQI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Air quality data is currently unavailable for this location.
        </CardContent>
      </Card>
    );
  }

  const aqi = Math.max(0, Math.round(data.aqi));
  const aqiColor = getAQIColor(aqi);
  const gradient = getAQIGradient(aqi);
  const strokeColor = getAQIStrokeColor(aqi);
  const freshnessKey = data.lastUpdated ? getDataFreshness(data.lastUpdated) : data.dataFreshness;
  const freshness = FRESHNESS_CONFIG[freshnessKey] ?? FRESHNESS_CONFIG.unavailable;

  // Circular SVG gauge geometry
  const size = 184;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(aqi, 500) / 500;
  const targetOffset = circumference * (1 - normalizedProgress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden border border-white/50 bg-white/75 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-zinc-900/65">
        {/* Ambient gradient glow */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-gradient-to-br opacity-20 blur-3xl',
            gradient
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
            gradient
          )}
        />

        <CardHeader className="relative flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <div className={cn('flex size-8 items-center justify-center rounded-lg', aqiColor.bg)}>
              <Activity className={cn('size-4', aqiColor.text)} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Air Quality Index</CardTitle>
              {city && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {city}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background/60 backdrop-blur-sm font-medium">
              India CPCB AQI
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative flex flex-col items-center gap-6 pt-2 pb-4 sm:flex-row sm:items-center">
          {/* Circular Animated Gauge */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
              aria-label={`AQI ${aqi}, ${data.category || aqiColor.label}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/50"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: targetOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                key={aqi}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className={cn('text-4xl font-bold tracking-tight tabular-nums', aqiColor.text)}
              >
                {aqi}
              </motion.span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                AQI
              </span>
              <Badge
                variant="outline"
                className={cn('mt-1.5 font-semibold', aqiColor.bg, aqiColor.text, aqiColor.border)}
              >
                {data.category || aqiColor.label}
              </Badge>
            </div>
          </div>

          {/* Right Metadata Panel */}
          <div className="flex flex-1 flex-col gap-3.5 text-center sm:text-left">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {getAQIHealthSummary(aqi)}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 backdrop-blur-sm">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Dominant Pollutant
                </span>
                <span className="mt-0.5 flex items-center justify-center gap-1.5 text-sm font-semibold sm:justify-start">
                  <Lightbulb className={cn('size-3.5', aqiColor.text)} />
                  {data.dominantPollutant || 'N/A'}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 backdrop-blur-sm">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex items-center justify-center gap-1.5 text-sm font-semibold sm:justify-start',
                    freshness.textClass
                  )}
                >
                  <span className={cn('size-2 rounded-full', freshness.dotClass)} />
                  {freshness.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground sm:justify-start">
              <span className="inline-flex items-center gap-1">
                <Radio className="size-3.5" />
                {data.stationName ? `${data.stationName} · ` : ''}
                {data.source}
                {data.sourceType === 'modelled_estimate' ? ' (Modelled)' : ' (Station)'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                Updated {data.lastUpdated ? formatTimestamp(data.lastUpdated) : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

