'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import {
  AlertCircle,
  CalendarDays,
  CloudSun,
  Flame,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
  Wind,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationSearch } from '@/components/dashboard/location-search';
import { WeatherForecastCard } from '@/components/dashboard/weather-forecast-card';
import { ForecastChart } from '@/components/charts/forecast-chart';
import { FestivalCard } from '@/components/forecast/festival-card';
import { SeasonalRiskCard, type SeasonalRiskData } from '@/components/forecast/seasonal-risk-card';
import { WarningTimeline } from '@/components/forecast/warning-timeline';
import { cn } from '@/lib/utils';
import { formatTimestamp, getAQIColor } from '@/lib/utils/index';
import type {
  AirQualityForecast,
  FestivalEvent,
  LocationInfo,
  WeatherForecast,
} from '@/types';

const LOCATION_STORAGE_KEY = 'uaqa_selected_location';
type FestivalLookaheadDays = 60 | 90 | 180 | 365;
const FESTIVAL_LOOKAHEAD_OPTIONS: FestivalLookaheadDays[] = [60, 90, 180, 365];

const DEFAULT_LOCATION: LocationInfo = {
  coordinates: { latitude: 28.6139, longitude: 77.209 },
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
};

interface FestivalWarningItem {
  festival: FestivalEvent;
  daysUntil: number;
  warningLevel: 'prepare' | 'imminent' | 'active' | 'recovery';
  preparations: string[];
}

export function ForecastDashboard() {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [lookaheadDays, setLookaheadDays] = useState<FestivalLookaheadDays>(90);

  const [aqForecast, setAqForecast] = useState<AirQualityForecast[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>([]);
  const [festivals, setFestivals] = useState<FestivalEvent[]>([]);
  const [warnings, setWarnings] = useState<FestivalWarningItem[]>([]);
  const [seasonalRisk, setSeasonalRisk] = useState<SeasonalRiskData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const fetchAllForecasts = useCallback(
    async (lat: number, lon: number, daysWindow: number, background = false) => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [aqRes, weatherRes, festivalsRes] = await Promise.all([
          fetch(`/api/air-quality?lat=${lat}&lon=${lon}`),
          fetch(`/api/weather?lat=${lat}&lon=${lon}&days=7`),
          fetch(`/api/festivals?days=${daysWindow}`),
        ]);

        if (!aqRes.ok && !weatherRes.ok && !festivalsRes.ok) {
          throw new Error('Failed to load forecast and event services.');
        }

        if (aqRes.ok) {
          const aqJson = await aqRes.json();
          setAqForecast(Array.isArray(aqJson.forecast) ? aqJson.forecast.slice(0, 5) : []);
        }

        if (weatherRes.ok) {
          const weatherJson = await weatherRes.json();
          setWeatherForecast(
            Array.isArray(weatherJson.forecast) ? weatherJson.forecast.slice(0, 7) : []
          );
        }

        if (festivalsRes.ok) {
          const festJson = await festivalsRes.json();
          setFestivals(Array.isArray(festJson.festivals) ? festJson.festivals : []);
          setWarnings(Array.isArray(festJson.warnings) ? festJson.warnings : []);
          setSeasonalRisk(festJson.seasonalRisk ?? null);
        }

        setFetchedAt(new Date().toISOString());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to fetch pollution forecast data.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initialize location from URL params or localStorage
  useEffect(() => {
    const paramLat = searchParams.get('lat');
    const paramLon = searchParams.get('lon');
    const paramCity = searchParams.get('city');

    if (paramLat && paramLon) {
      const lat = Number(paramLat);
      const lon = Number(paramLon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        const nextLoc: LocationInfo = {
          coordinates: { latitude: lat, longitude: lon },
          city: paramCity || 'Selected Location',
          state: searchParams.get('state') || '',
          country: searchParams.get('country') || '',
        };
        setLocation(nextLoc);
        fetchAllForecasts(lat, lon, lookaheadDays);
        return;
      }
    }

    let saved: LocationInfo | null = null;
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as LocationInfo;
    } catch {
      saved = null;
    }

    const activeLoc = saved?.coordinates ? saved : DEFAULT_LOCATION;
    setLocation(activeLoc);
    fetchAllForecasts(
      activeLoc.coordinates.latitude,
      activeLoc.coordinates.longitude,
      lookaheadDays
    );
  }, [fetchAllForecasts, lookaheadDays, searchParams]);

  const handleSelectLocation = (selected: LocationInfo) => {
    setLocation(selected);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // Ignore storage errors
    }
    fetchAllForecasts(
      selected.coordinates.latitude,
      selected.coordinates.longitude,
      lookaheadDays
    );
  };

  const handleLookaheadChange = async (days: FestivalLookaheadDays) => {
    setLookaheadDays(days);
    try {
      const res = await fetch(`/api/festivals?days=${days}`);
      if (res.ok) {
        const festJson = await res.json();
        setFestivals(Array.isArray(festJson.festivals) ? festJson.festivals : []);
        setWarnings(Array.isArray(festJson.warnings) ? festJson.warnings : []);
        setSeasonalRisk(festJson.seasonalRisk ?? null);
      }
    } catch {
      // Ignore transient festival refresh errors
    }
  };

  const weatherTrendData = useMemo(() => {
    return weatherForecast.slice(0, 7).map((w, idx) => {
      const d = new Date(`${w.date}T00:00:00`);
      const label =
        idx === 0
          ? 'Today'
          : Number.isNaN(d.getTime())
            ? w.date
            : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      return {
        label,
        tempMax: Math.round(w.tempMax),
        tempMin: Math.round(w.tempMin),
        rain: Math.round(w.precipitationProbability),
      };
    });
  }, [weatherForecast]);

  const primaryWarning = warnings[0] ?? null;
  const warningByFestivalId = useMemo(() => {
    const map = new Map<string, FestivalWarningItem>();
    warnings.forEach((w) => map.set(w.festival.id, w));
    return map;
  }, [warnings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80 dark:from-zinc-950 dark:via-background dark:to-zinc-900/60">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/75 p-5 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center dark:border-white/10 dark:bg-zinc-900/65"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Pollution Forecast &amp; Events
              </h1>
              {seasonalRisk && (
                <Badge
                  variant="outline"
                  className="border-sky-500/35 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                >
                  {seasonalRisk.season} · {seasonalRisk.riskLevel} Risk
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <MapPin className="size-3.5 text-emerald-500" />
                {[location.city, location.state, location.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              {fetchedAt && <span>Updated {formatTimestamp(fetchedAt)}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LocationSearch
              currentLocation={location}
              onSelectLocation={handleSelectLocation}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                fetchAllForecasts(
                  location.coordinates.latitude,
                  location.coordinates.longitude,
                  lookaheadDays,
                  true
                )
              }
              disabled={isLoading || isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </motion.header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Forecast Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 5-Day Air Quality Forecast */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Wind className="size-4 text-emerald-500" />
              5-Day Air Quality Forecast
            </h2>
            <span className="text-xs text-muted-foreground">India CPCB AQI Estimate</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ForecastChart
                airQualityForecast={aqForecast}
                weatherForecast={weatherForecast}
                isLoading={isLoading}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <Card className="h-full border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Lightbulb className="size-4 text-emerald-500" />
                    Daily AQI Outlook
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Projected daily average particulate matter &amp; ozone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))
                  ) : aqForecast.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      5-day air quality forecast unavailable.
                    </p>
                  ) : (
                    aqForecast.slice(0, 5).map((day, idx) => {
                      const style = getAQIColor(day.aqi);
                      const parsed = new Date(`${day.date}T00:00:00`);
                      const label =
                        idx === 0
                          ? 'Today'
                          : Number.isNaN(parsed.getTime())
                            ? day.date
                            : parsed.toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              });

                      return (
                        <div
                          key={day.date}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              PM2.5: {day.pm25} · PM10: {day.pm10} · O₃: {day.o3} µg/m³
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 font-semibold tabular-nums',
                              style.bg,
                              style.text,
                              style.border
                            )}
                          >
                            {Math.round(day.aqi)} · {day.category}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* 7-Day Weather Forecast */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CloudSun className="size-4 text-sky-500" />
              7-Day Weather Forecast
            </h2>
            <span className="text-xs text-muted-foreground">
              Wind &amp; rain strongly influence pollutant dispersal
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <WeatherForecastCard forecast={weatherForecast} isLoading={isLoading} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.14 }}
              className="lg:col-span-5"
            >
              <Card className="h-full border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <CalendarDays className="size-4 text-amber-500" />
                    Temperature &amp; Rain Trend
                  </CardTitle>
                  <CardDescription className="text-xs">
                    7-day max temperature (°C) and precipitation chance (%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[190px] w-full rounded-xl" />
                  ) : weatherTrendData.length === 0 ? (
                    <div className="flex h-[190px] items-center justify-center text-sm text-muted-foreground">
                      Weather trend unavailable.
                    </div>
                  ) : (
                    <div className="h-[190px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart
                          data={weatherTrendData}
                          margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="tempGradientForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="rainGradientForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            strokeOpacity={0.18}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="tempMax"
                            name="Max Temp (°C)"
                            stroke="#f59e0b"
                            strokeWidth={2.2}
                            fill="url(#tempGradientForecast)"
                          />
                          <Area
                            type="monotone"
                            dataKey="rain"
                            name="Rain Prob (%)"
                            stroke="#0ea5e9"
                            strokeWidth={2}
                            fill="url(#rainGradientForecast)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Seasonal Risk Assessment */}
        <section className="space-y-3">
          <SeasonalRiskCard seasonalRisk={seasonalRisk} isLoading={isLoading} />
        </section>

        {/* Advance Warning Timeline */}
        <section className="space-y-3">
          <WarningTimeline
            eventName={primaryWarning?.festival.name}
            eventDate={primaryWarning?.festival.date}
            daysUntil={primaryWarning?.daysUntil ?? null}
          />
        </section>

        {/* Festival Warnings & Preparations */}
        {warnings.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldAlert className="size-4 text-red-500" />
                Active Festival Pollution Warnings
              </h2>
              <Badge variant="destructive" className="text-xs">
                {warnings.length} Alert{warnings.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {warnings.map((warning, idx) => (
                <FestivalCard
                  key={warning.festival.id}
                  festival={warning.festival}
                  daysUntil={warning.daysUntil}
                  warningLevel={warning.warningLevel}
                  preparations={warning.preparations}
                  defaultExpanded={idx === 0}
                  index={idx}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Festivals Calendar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Flame className="size-4 text-amber-500" />
                Upcoming Festivals &amp; Pollution Events
              </h2>
              <p className="text-xs text-muted-foreground">
                Color-coded pollution impact ratings and historical AQI recovery profiles
              </p>
            </div>

            <div className="inline-flex items-center rounded-xl border border-border/60 bg-muted/50 p-1">
              {FESTIVAL_LOOKAHEAD_OPTIONS.map((days) => (
                <Button
                  key={days}
                  type="button"
                  size="xs"
                  variant={lookaheadDays === days ? 'default' : 'ghost'}
                  onClick={() => handleLookaheadChange(days)}
                  className="rounded-lg px-2.5 text-xs"
                >
                  Next {days}d
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, idx) => (
                <Skeleton key={idx} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : festivals.length === 0 ? (
            <Card className="border bg-white/75 backdrop-blur-xl dark:bg-zinc-900/65">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No major pollution-impacting festivals recorded in the next {lookaheadDays} days.
                Try expanding the horizon to 180d or 365d.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {festivals.map((festival, idx) => {
                const matchedWarning = warningByFestivalId.get(festival.id);
                return (
                  <FestivalCard
                    key={festival.id}
                    festival={festival}
                    daysUntil={matchedWarning?.daysUntil}
                    warningLevel={matchedWarning?.warningLevel}
                    preparations={matchedWarning?.preparations}
                    index={idx}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

