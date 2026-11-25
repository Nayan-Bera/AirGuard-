'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Clock,
  Database,
  Info,
  LineChart as LineChartIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationSearch } from '@/components/dashboard/location-search';
import { PollutantTrendChart } from '@/components/charts/pollutant-trend-chart';
import { cn } from '@/lib/utils';
import { formatTimestamp, getAQIColor } from '@/lib/utils/index';
import type {
  AirQualityData,
  AirQualityForecast,
  HourlyAirQuality,
  LocationInfo,
} from '@/types';

type TimeRange = '24h' | '48h' | '7d';
type InsightsTab = 'overview' | 'pm25' | 'pm10' | 'all';

const LOCATION_STORAGE_KEY = 'uaqa_selected_location';

const DEFAULT_LOCATION: LocationInfo = {
  coordinates: { latitude: 28.6139, longitude: 77.209 },
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
};

interface AQIHistoryPoint {
  time: string;
  label: string;
  fullTime: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

interface PollutantComparisonPoint {
  name: string;
  fullName: string;
  value: number;
  limit: number;
  percentOfLimit: number;
  unit: string;
  color: string;
}

function formatHourlyAxis(isoTime: string, includeDay: boolean): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    const timePart = isoTime.split('T')[1];
    return timePart ? timePart.slice(0, 5) : isoTime;
  }
  if (includeDay) {
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      hour12: false,
    });
  }
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatFullDateTime(isoTime: string): string {
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

function AQIHistoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: AQIHistoryPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const aqiStyle = getAQIColor(point.aqi);

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{point.fullTime}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">CPCB AQI</span>
          <span className={cn('font-bold tabular-nums', aqiStyle.text)}>
            {point.aqi} ({aqiStyle.label})
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">PM2.5</span>
          <span className="font-semibold tabular-nums">{point.pm25.toFixed(1)} µg/m³</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">PM10</span>
          <span className="font-semibold tabular-nums">{point.pm10.toFixed(1)} µg/m³</span>
        </div>
      </div>
    </div>
  );
}

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: PollutantComparisonPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{item.fullName}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Measured</span>
          <span className="font-bold tabular-nums">
            {item.value.toFixed(1)} {item.unit}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">CPCB Safe Limit</span>
          <span className="font-medium tabular-nums">
            {item.limit} {item.unit}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-1">
          <span className="text-muted-foreground">% of Safe Limit</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              item.percentOfLimit > 100
                ? 'text-red-500'
                : item.percentOfLimit > 70
                  ? 'text-amber-500'
                  : 'text-emerald-500'
            )}
          >
            {item.percentOfLimit}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function InsightsDashboard() {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [activeTab, setActiveTab] = useState<InsightsTab>('overview');

  const [currentAQ, setCurrentAQ] = useState<AirQualityData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyAirQuality[]>([]);
  const [forecastData, setForecastData] = useState<AirQualityForecast[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAirQuality = useCallback(
    async (lat: number, lon: number, background = false) => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/air-quality?lat=${lat}&lon=${lon}`);
        if (!res.ok) {
          throw new Error(`Air quality API returned status ${res.status}`);
        }
        const json = await res.json();
        setCurrentAQ(json.current ?? null);
        setHourlyData(Array.isArray(json.hourly) ? json.hourly : []);
        setForecastData(Array.isArray(json.forecast) ? json.forecast : []);
        setFetchedAt(json.fetchedAt ?? new Date().toISOString());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to fetch air quality insights.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Resolve location from URL params or localStorage on mount
  useEffect(() => {
    const paramLat = searchParams.get('lat');
    const paramLon = searchParams.get('lon');
    const paramCity = searchParams.get('city');

    if (paramLat && paramLon) {
      const lat = Number(paramLat);
      const lon = Number(paramLon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        const urlLocation: LocationInfo = {
          coordinates: { latitude: lat, longitude: lon },
          city: paramCity || 'Selected Location',
          state: searchParams.get('state') || '',
          country: searchParams.get('country') || '',
        };
        setLocation(urlLocation);
        fetchAirQuality(lat, lon);
        return;
      }
    }

    let saved: LocationInfo | null = null;
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw) as LocationInfo;
      }
    } catch {
      saved = null;
    }

    if (saved?.coordinates) {
      setLocation(saved);
      fetchAirQuality(saved.coordinates.latitude, saved.coordinates.longitude);
    } else {
      setLocation(DEFAULT_LOCATION);
      fetchAirQuality(
        DEFAULT_LOCATION.coordinates.latitude,
        DEFAULT_LOCATION.coordinates.longitude
      );
    }
  }, [fetchAirQuality, searchParams]);

  const handleSelectLocation = (selected: LocationInfo) => {
    setLocation(selected);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // Ignore storage errors
    }
    fetchAirQuality(selected.coordinates.latitude, selected.coordinates.longitude);
  };

  // Slice / transform hourly data based on selected timeRange
  const rangePoints = useMemo<AQIHistoryPoint[]>(() => {
    if (timeRange === '7d') {
      // For 7d, combine daily forecast / available multi-day observations clearly
      if (forecastData.length > 0) {
        return forecastData.map((day) => {
          const parsed = new Date(`${day.date}T00:00:00`);
          const label = Number.isNaN(parsed.getTime())
            ? day.date
            : parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
          return {
            time: `${day.date}T12:00:00`,
            label,
            fullTime: `${label} (Daily Modelled Estimate)`,
            aqi: Math.round(day.aqi),
            pm25: Math.round(day.pm25 * 10) / 10,
            pm10: Math.round(day.pm10 * 10) / 10,
          };
        });
      }
    }

    const sliceCount = timeRange === '24h' ? 24 : 48;
    const sliced = hourlyData.slice(0, sliceCount);
    const includeDay = timeRange === '48h';

    return sliced.map((item) => ({
      time: item.time,
      label: formatHourlyAxis(item.time, includeDay),
      fullTime: formatFullDateTime(item.time),
      aqi: Math.round(item.aqi ?? 0),
      pm25: Math.round((item.pm25 ?? 0) * 10) / 10,
      pm10: Math.round((item.pm10 ?? 0) * 10) / 10,
    }));
  }, [forecastData, hourlyData, timeRange]);

  const trendSeries = useMemo(() => {
    return rangePoints.map((pt) => ({
      time: pt.time,
      label: pt.label,
      pm25: pt.pm25,
      pm10: pt.pm10,
      aqi: pt.aqi,
    }));
  }, [rangePoints]);

  const summaryStats = useMemo(() => {
    if (rangePoints.length === 0) {
      return { avgAqi: null, peakAqi: null, minAqi: null, avgPm25: null };
    }
    const aqis = rangePoints.map((p) => p.aqi);
    const pm25s = rangePoints.map((p) => p.pm25);
    return {
      avgAqi: Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length),
      peakAqi: Math.max(...aqis),
      minAqi: Math.min(...aqis),
      avgPm25: Math.round((pm25s.reduce((a, b) => a + b, 0) / pm25s.length) * 10) / 10,
    };
  }, [rangePoints]);

  const pollutantComparisonData = useMemo<PollutantComparisonPoint[]>(() => {
    const p = currentAQ?.pollutants;
    if (!p) return [];

    const specs: Array<{
      name: string;
      fullName: string;
      val: number | null;
      limit: number;
      unit: string;
      color: string;
    }> = [
      {
        name: 'PM2.5',
        fullName: 'Fine Particulate Matter (PM2.5)',
        val: p.pm25,
        limit: 60,
        unit: 'µg/m³',
        color: '#8b5cf6',
      },
      {
        name: 'PM10',
        fullName: 'Coarse Particulate Matter (PM10)',
        val: p.pm10,
        limit: 100,
        unit: 'µg/m³',
        color: '#0ea5e9',
      },
      {
        name: 'NO₂',
        fullName: 'Nitrogen Dioxide (NO₂)',
        val: p.no2,
        limit: 80,
        unit: 'µg/m³',
        color: '#f59e0b',
      },
      {
        name: 'SO₂',
        fullName: 'Sulphur Dioxide (SO₂)',
        val: p.so2,
        limit: 80,
        unit: 'µg/m³',
        color: '#ec4899',
      },
      {
        name: 'O₃',
        fullName: 'Ground-level Ozone (O₃)',
        val: p.o3,
        limit: 100,
        unit: 'µg/m³',
        color: '#10b981',
      },
      {
        name: 'CO',
        fullName: 'Carbon Monoxide (CO)',
        val: p.co,
        limit: 2000,
        unit: 'µg/m³',
        color: '#6366f1',
      },
    ];

    return specs
      .filter((s) => s.val !== null && s.val !== undefined)
      .map((s) => {
        const value = Math.round((s.val ?? 0) * 10) / 10;
        return {
          name: s.name,
          fullName: s.fullName,
          value,
          limit: s.limit,
          percentOfLimit: Math.round((value / s.limit) * 100),
          unit: s.unit,
          color: s.color,
        };
      });
  }, [currentAQ]);

  const currentAqiStyle = currentAQ ? getAQIColor(currentAQ.aqi) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80 dark:from-zinc-950 dark:via-background dark:to-zinc-900/60">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header & Controls */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/75 p-5 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center dark:border-white/10 dark:bg-zinc-900/65"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Air Quality Insights
              </h1>
              {currentAQ && currentAqiStyle && (
                <Badge
                  variant="outline"
                  className={cn(
                    currentAqiStyle.bg,
                    currentAqiStyle.text,
                    currentAqiStyle.border
                  )}
                >
                  AQI {Math.round(currentAQ.aqi)} · {currentAqiStyle.label}
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
              <span className="tabular-nums">
                ({location.coordinates.latitude.toFixed(2)}°,{' '}
                {location.coordinates.longitude.toFixed(2)}°)
              </span>
              {fetchedAt && <span>Updated {formatTimestamp(fetchedAt)}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Range Selector */}
            <div
              role="group"
              aria-label="Time range selector"
              className="inline-flex items-center rounded-xl border border-border/60 bg-muted/50 p-1"
            >
              {(['24h', '48h', '7d'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  type="button"
                  size="xs"
                  variant={timeRange === range ? 'default' : 'ghost'}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'rounded-lg px-3 font-medium',
                    timeRange === range && 'shadow-xs'
                  )}
                >
                  {range.toUpperCase()}
                </Button>
              ))}
            </div>

            <LocationSearch
              currentLocation={location}
              onSelectLocation={handleSelectLocation}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                fetchAirQuality(
                  location.coordinates.latitude,
                  location.coordinates.longitude,
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

        {/* Error Banner */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to load insights</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  fetchAirQuality(
                    location.coordinates.latitude,
                    location.coordinates.longitude
                  )
                }
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Historical Note Banner (Highlighted for 7d) */}
        <Alert
          className={cn(
            'border-sky-500/30 bg-sky-500/8',
            timeRange === '7d' && 'border-amber-500/40 bg-amber-500/10'
          )}
        >
          <Info
            className={cn(
              'size-4',
              timeRange === '7d'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-sky-600 dark:text-sky-400'
            )}
          />
          <AlertTitle className="flex items-center gap-2">
            <span>Observation Window Note</span>
            {timeRange === '7d' && (
              <Badge variant="outline" className="text-[10px]">
                7-Day Mode
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription>
            Historical data beyond 48h requires stored observations. Live Open-Meteo feeds
            provide up to 48 hours of hourly resolution
            {timeRange === '7d'
              ? ' — showing available multi-day modelled summary points below.'
              : '.'}
          </AlertDescription>
        </Alert>

        {/* Summary KPI Cards */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Current CPCB AQI',
              value: currentAQ ? Math.round(currentAQ.aqi).toString() : '--',
              sub: currentAQ
                ? `${currentAQ.category} · Dominant: ${currentAQ.dominantPollutant}`
                : 'Waiting for data',
              icon: Lightbulb,
              accent: 'text-emerald-500',
            },
            {
              label: `${timeRange.toUpperCase()} Average AQI`,
              value: summaryStats.avgAqi !== null ? summaryStats.avgAqi.toString() : '--',
              sub:
                summaryStats.avgAqi !== null
                  ? getAQIColor(summaryStats.avgAqi).label
                  : 'No samples',
              icon: Clock,
              accent: 'text-sky-500',
            },
            {
              label: `${timeRange.toUpperCase()} Peak AQI`,
              value: summaryStats.peakAqi !== null ? summaryStats.peakAqi.toString() : '--',
              sub:
                summaryStats.minAqi !== null
                  ? `Low: ${summaryStats.minAqi} AQI`
                  : 'No range data',
              icon: LineChartIcon,
              accent: 'text-amber-500',
            },
            {
              label: `${timeRange.toUpperCase()} Avg PM2.5`,
              value:
                summaryStats.avgPm25 !== null ? `${summaryStats.avgPm25} µg/m³` : '--',
              sub: 'CPCB 24h limit: 60 µg/m³',
              icon: BarChart3,
              accent: 'text-violet-500',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card className="h-full border border-white/50 bg-white/75 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-zinc-900/65">
                  <CardContent className="flex flex-col justify-between gap-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stat.label}</span>
                      <Icon className={cn('size-4', stat.accent)} />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold tracking-tight tabular-nums">
                        {stat.value}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </section>

        {/* Main Analytical Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as InsightsTab)}
          className="space-y-4"
        >
          <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted/70 p-1 sm:w-fit">
            <TabsTrigger value="overview" className="rounded-lg px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pm25" className="rounded-lg px-4">
              PM2.5
            </TabsTrigger>
            <TabsTrigger value="pm10" className="rounded-lg px-4">
              PM10
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-4">
              All Pollutants
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* AQI History Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <LineChartIcon className="size-4 text-emerald-500" />
                      AQI History &amp; Trend ({timeRange.toUpperCase()})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Hourly India CPCB AQI progression calculated from particulate readings
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rangePoints.length} data points
                  </Badge>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                  ) : rangePoints.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      Hourly AQI history is unavailable for this location.
                    </div>
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart
                          data={rangePoints}
                          margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                        >
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
                            interval="preserveStartEnd"
                            minTickGap={30}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<AQIHistoryTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line
                            type="monotone"
                            dataKey="aqi"
                            name="CPCB AQI"
                            stroke="#10b981"
                            strokeWidth={2.75}
                            dot={rangePoints.length <= 10 ? { r: 4, fill: '#10b981' } : false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="pm25"
                            name="PM2.5 (µg/m³)"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* PM2.5 + PM10 Trend Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PollutantTrendChart
                data={trendSeries}
                pollutantKey="pm25"
                color="#8b5cf6"
                title="PM2.5 Trend"
                unit="µg/m³"
                subtitle="Fine particulate matter (< 2.5 µm)"
                isLoading={isLoading}
              />
              <PollutantTrendChart
                data={trendSeries}
                pollutantKey="pm10"
                color="#0ea5e9"
                title="PM10 Trend"
                unit="µg/m³"
                subtitle="Coarse particulate matter (< 10 µm)"
                isLoading={isLoading}
              />
            </div>

            {/* Pollutant Comparison Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <BarChart3 className="size-4 text-amber-500" />
                    Pollutant Comparison (% of India CPCB Safe Limit)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Normalized against CPCB 24-hour / 8-hour permissible thresholds (100% = threshold)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[260px] w-full rounded-xl" />
                  ) : pollutantComparisonData.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      Current pollutant breakdown is unavailable.
                    </div>
                  ) : (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart
                          data={pollutantComparisonData}
                          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            strokeOpacity={0.18}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'currentColor' }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                            unit="%"
                          />
                          <Tooltip content={<ComparisonTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            dataKey="percentOfLimit"
                            name="% of CPCB Safe Limit"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                          >
                            {pollutantComparisonData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} fillOpacity={0.88} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* PM2.5 TAB */}
          <TabsContent value="pm25" className="space-y-6">
            <PollutantTrendChart
              data={trendSeries}
              pollutantKey="pm25"
              color="#8b5cf6"
              title="PM2.5 Concentration Trend"
              unit="µg/m³"
              subtitle={`Showing ${timeRange.toUpperCase()} fine particulate concentration`}
              isLoading={isLoading}
              height={340}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="border border-white/50 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader>
                  <CardTitle className="text-base">About PM2.5 &amp; CPCB Thresholds</CardTitle>
                  <CardDescription>
                    Particles smaller than 2.5 micrometers can penetrate deep into the lungs and bloodstream.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      range: '0 - 30 µg/m³',
                      label: 'Good',
                      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    },
                    {
                      range: '31 - 60 µg/m³',
                      label: 'Satisfactory',
                      color: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
                    },
                    {
                      range: '61 - 90 µg/m³',
                      label: 'Moderate',
                      color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                    },
                    {
                      range: '91 - 120 µg/m³',
                      label: 'Poor',
                      color: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
                    },
                    {
                      range: '121 - 250 µg/m³',
                      label: 'Very Poor',
                      color: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
                    },
                    {
                      range: '250+ µg/m³',
                      label: 'Severe',
                      color: 'border-red-800/40 bg-red-900/15 text-red-700 dark:text-red-300',
                    },
                  ].map((band) => (
                    <div
                      key={band.label}
                      className={cn('rounded-xl border px-3.5 py-2.5 text-xs', band.color)}
                    >
                      <p className="font-semibold">{band.label}</p>
                      <p className="mt-0.5 opacity-85 tabular-nums">{band.range}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* PM10 TAB */}
          <TabsContent value="pm10" className="space-y-6">
            <PollutantTrendChart
              data={trendSeries}
              pollutantKey="pm10"
              color="#0ea5e9"
              title="PM10 Concentration Trend"
              unit="µg/m³"
              subtitle={`Showing ${timeRange.toUpperCase()} coarse particulate concentration`}
              isLoading={isLoading}
              height={340}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="border border-white/50 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/65">
                <CardHeader>
                  <CardTitle className="text-base">About PM10 &amp; Primary Sources</CardTitle>
                  <CardDescription>
                    Inhalable particles up to 10 micrometers from road dust, construction, and biomass smoke.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      range: '0 - 50 µg/m³',
                      label: 'Good',
                      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    },
                    {
                      range: '51 - 100 µg/m³',
                      label: 'Satisfactory',
                      color: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
                    },
                    {
                      range: '101 - 250 µg/m³',
                      label: 'Moderate',
                      color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                    },
                    {
                      range: '251 - 350 µg/m³',
                      label: 'Poor',
                      color: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
                    },
                    {
                      range: '351 - 430 µg/m³',
                      label: 'Very Poor',
                      color: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
                    },
                    {
                      range: '430+ µg/m³',
                      label: 'Severe',
                      color: 'border-red-800/40 bg-red-900/15 text-red-700 dark:text-red-300',
                    },
                  ].map((band) => (
                    <div
                      key={band.label}
                      className={cn('rounded-xl border px-3.5 py-2.5 text-xs', band.color)}
                    >
                      <p className="font-semibold">{band.label}</p>
                      <p className="mt-0.5 opacity-85 tabular-nums">{band.range}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ALL POLLUTANTS TAB */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PollutantTrendChart
                data={trendSeries}
                pollutantKey="pm25"
                color="#8b5cf6"
                title="PM2.5 Trend"
                unit="µg/m³"
                isLoading={isLoading}
              />
              <PollutantTrendChart
                data={trendSeries}
                pollutantKey="pm10"
                color="#0ea5e9"
                title="PM10 Trend"
                unit="µg/m³"
                isLoading={isLoading}
              />
            </div>

            <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-amber-500" />
                  All Tracked Pollutants Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Current concentration vs CPCB permissible limits across all monitored gases &amp; particulates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pollutantComparisonData.length > 0 && (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={pollutantComparisonData}
                        margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.18}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          unit="%"
                        />
                        <Tooltip content={<ComparisonTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar
                          dataKey="percentOfLimit"
                          name="% of CPCB Safe Limit"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        >
                          {pollutantComparisonData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} fillOpacity={0.88} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pollutantComparisonData.map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-background/60 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] tabular-nums',
                            item.percentOfLimit > 100
                              ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {item.percentOfLimit}% of limit
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.fullName}</p>
                      <div className="flex items-baseline justify-between border-t border-border/50 pt-2 text-xs">
                        <span className="text-lg font-bold tabular-nums">
                          {item.value} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          Limit: {item.limit} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Source Attribution */}
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border border-border/60 bg-muted/35 backdrop-blur-sm">
            <CardContent className="flex flex-col justify-between gap-4 py-1 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground">
                    Data Source Attribution &amp; Methodology
                  </p>
                  <p className="text-muted-foreground">
                    Source:{' '}
                    <span className="font-medium text-foreground">
                      {currentAQ?.source ?? 'Open-Meteo Air Quality API'}
                    </span>{' '}
                    · Type:{' '}
                    <span className="font-medium text-foreground">
                      {currentAQ?.sourceType === 'monitoring_station'
                        ? 'Ground Monitoring Station'
                        : 'Modelled Atmospheric Estimate'}
                    </span>{' '}
                    · Standard: <span className="font-medium text-foreground">India CPCB AQI</span>
                  </p>
                  <p className="text-muted-foreground">
                    Historical data beyond 48h requires stored observations.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Refreshed every 15 mins</span>
              </div>
            </CardContent>
          </Card>
        </motion.footer>
      </main>
    </div>
  );
}

