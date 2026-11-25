'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getWeatherDescription,
  getWeatherIcon,
  getWindDirectionLabel,
} from '@/lib/utils/index';
import type { WeatherData } from '@/types';

interface WeatherCardProps {
  data: WeatherData | null;
  isLoading?: boolean;
}

function formatSunTime(isoString?: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function WeatherCard({ data, isLoading = false }: WeatherCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Weather data is currently unavailable for this location.
        </CardContent>
      </Card>
    );
  }

  const icon = getWeatherIcon(data.weatherCode, data.isDay);
  const description = data.weatherDescription || getWeatherDescription(data.weatherCode);
  const windDir = getWindDirectionLabel(data.windDirection);

  const metrics = [
    {
      label: 'Humidity',
      value: `${Math.round(data.humidity)}%`,
      icon: Droplets,
      iconClass: 'text-sky-500',
    },
    {
      label: 'Wind',
      value: `${Math.round(data.windSpeed)} km/h ${windDir}`,
      icon: Wind,
      iconClass: 'text-teal-500',
    },
    {
      label: 'Pressure',
      value: `${Math.round(data.pressure)} hPa`,
      icon: Gauge,
      iconClass: 'text-indigo-500',
    },
    {
      label: 'Cloud Cover',
      value: `${Math.round(data.cloudCover)}%`,
      icon: Cloud,
      iconClass: 'text-slate-500',
    },
    {
      label: 'Precipitation',
      value: `${data.precipitation.toFixed(1)} mm (${Math.round(data.precipitationProbability)}%)`,
      icon: CloudRain,
      iconClass: 'text-blue-500',
    },
    {
      label: 'Sun Cycle',
      value: `${formatSunTime(data.sunrise)} / ${formatSunTime(data.sunset)}`,
      icon: data.isDay ? Sunrise : Sunset,
      iconClass: 'text-amber-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden border border-white/50 bg-white/75 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-zinc-900/65">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 size-56 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
        />

        <CardHeader className="relative flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base font-semibold">Current Weather</CardTitle>
          <Badge variant="secondary" className="font-medium">
            {description}
          </Badge>
        </CardHeader>

        <CardContent className="relative flex flex-col gap-5 pt-1">
          {/* Primary Temperature Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex size-16 items-center justify-center rounded-2xl bg-sky-500/10 text-4xl shadow-inner dark:bg-sky-400/10"
                role="img"
                aria-label={description}
              >
                {icon}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">
                    {Math.round(data.temperature)}°
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">C</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Feels like{' '}
                  <span className="font-medium text-foreground">
                    {Math.round(data.feelsLike)}°C
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5">
                <Sunrise className="size-3.5 text-amber-500" />
                <span>{formatSunTime(data.sunrise)}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5">
                <Sunset className="size-3.5 text-orange-500" />
                <span>{formatSunTime(data.sunset)}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {metrics.slice(0, 5).map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/55 px-3 py-2.5 backdrop-blur-sm"
                >
                  <Icon className={`mt-0.5 size-4 shrink-0 ${metric.iconClass}`} />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      {metric.label}
                    </span>
                    <span className="block truncate text-sm font-semibold tabular-nums">
                      {metric.value}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/55 px-3 py-2.5 backdrop-blur-sm">
              <Sunrise className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  {data.uvIndex !== undefined ? 'UV Index' : 'Daylight'}
                </span>
                <span className="block truncate text-sm font-semibold tabular-nums">
                  {data.uvIndex !== undefined
                    ? `${data.uvIndex.toFixed(1)}`
                    : data.isDay
                      ? 'Daytime'
                      : 'Night'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
