'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Droplets, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWeatherIcon } from '@/lib/utils/index';
import type { WeatherForecast } from '@/types';

interface WeatherForecastCardProps {
  forecast: WeatherForecast[];
  isLoading?: boolean;
}

function formatDayLabel(dateStr: string, index: number): { day: string; date: string } {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: dateStr, date: '' };
  }
  const day =
    index === 0
      ? 'Today'
      : parsed.toLocaleDateString('en-IN', { weekday: 'short' });
  const date = parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { day, date };
}

export function WeatherForecastCard({
  forecast,
  isLoading = false,
}: WeatherForecastCardProps) {
  if (isLoading) {
    return (
      <Card className="border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-28 shrink-0 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-sky-500" />
            7-Day Weather Forecast
          </CardTitle>
          <span className="text-xs text-muted-foreground">Scroll for full week</span>
        </CardHeader>

        <CardContent>
          {forecast.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              7-day weather forecast is unavailable.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {forecast.slice(0, 7).map((day, idx) => {
                const { day: dayName, date } = formatDayLabel(day.date, idx);
                const icon = getWeatherIcon(day.weatherCode, true);

                return (
                  <div
                    key={day.date}
                    className="flex min-w-[116px] flex-1 snap-start flex-col items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 p-3 text-center transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-semibold">{dayName}</p>
                      <p className="text-[11px] text-muted-foreground">{date}</p>
                    </div>

                    <span
                      className="text-3xl leading-none"
                      role="img"
                      aria-label={day.weatherDescription}
                      title={day.weatherDescription}
                    >
                      {icon}
                    </span>

                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums">
                        <span>{Math.round(day.tempMax)}°</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-[11px] text-sky-600 dark:text-sky-400">
                        <span className="inline-flex items-center gap-0.5 tabular-nums">
                          <Droplets className="size-3" />
                          {Math.round(day.precipitationProbability)}%
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground tabular-nums">
                          <Wind className="size-3" />
                          {Math.round(day.windSpeedMax)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
