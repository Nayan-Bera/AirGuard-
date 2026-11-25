'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Flame,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AQICard } from '@/components/dashboard/aqi-card';
import { PollutantGrid } from '@/components/dashboard/pollutant-grid';
import { WeatherCard } from '@/components/dashboard/weather-card';
import { WeatherForecastCard } from '@/components/dashboard/weather-forecast-card';
import { RecommendationsCard } from '@/components/dashboard/recommendations-card';
import { LocationSearch } from '@/components/dashboard/location-search';
import { AQIChart } from '@/components/charts/aqi-chart';
import { ForecastChart } from '@/components/charts/forecast-chart';
import { cn } from '@/lib/utils';
import { formatTimestamp, getAQIColor } from '@/lib/utils/index';
import type {
  AIRecommendationResponse,
  AirQualityData,
  AirQualityForecast,
  FestivalEvent,
  HourlyAirQuality,
  LocationInfo,
  WeatherData,
  WeatherForecast,
} from '@/types';

export interface FestivalWarningItem {
  festival: FestivalEvent;
  daysUntil: number;
  warningLevel: 'prepare' | 'imminent' | 'active' | 'recovery';
  preparations: string[];
}

export interface SeasonalRiskSummary {
  season: string;
  riskLevel: string;
  description: string;
  factors: string[];
  recommendations: string[];
}

export interface DashboardInitialData {
  location: LocationInfo;
  airQuality: AirQualityData | null;
  hourlyAirQuality: HourlyAirQuality[];
  airQualityForecast: AirQualityForecast[];
  weather: WeatherData | null;
  weatherForecast: WeatherForecast[];
  recommendations?: AIRecommendationResponse | null;
  festivalWarnings?: FestivalWarningItem[];
  seasonalRisk?: SeasonalRiskSummary;
}

interface DashboardClientProps {
  initialData?: DashboardInitialData;
}

const LOCATION_STORAGE_KEY = 'uaqa_selected_location';
const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const DEFAULT_LOCATION: LocationInfo = {
  coordinates: { latitude: 28.6139, longitude: 77.209 },
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
};

function normalizeAirQualityPayload(json: Record<string, unknown>): {
  current: AirQualityData | null;
  hourly: HourlyAirQuality[];
  forecast: AirQualityForecast[];
  location?: Partial<LocationInfo>;
} {
  const dataObj =
    (json.data as Record<string, unknown> | undefined) ?? json;
  const current =
    (dataObj.current as AirQualityData | undefined) ??
    (dataObj.airQuality as AirQualityData | undefined) ??
    (typeof dataObj.aqi === 'number' ? (dataObj as unknown as AirQualityData) : null);

  const hourly = Array.isArray(dataObj.hourly)
    ? (dataObj.hourly as HourlyAirQuality[])
    : [];
  const forecast = Array.isArray(dataObj.forecast)
    ? (dataObj.forecast as AirQualityForecast[])
    : [];
  const location = dataObj.location as Partial<LocationInfo> | undefined;

  return { current, hourly, forecast, location };
}

function normalizeWeatherPayload(json: Record<string, unknown>): {
  current: WeatherData | null;
  forecast: WeatherForecast[];
} {
  const dataObj =
    (json.data as Record<string, unknown> | undefined) ?? json;
  const current =
    (dataObj.current as WeatherData | undefined) ??
    (dataObj.weather as WeatherData | undefined) ??
    (typeof dataObj.temperature === 'number' ? (dataObj as unknown as WeatherData) : null);

  const forecast = Array.isArray(dataObj.forecast)
    ? (dataObj.forecast as WeatherForecast[])
    : Array.isArray(dataObj.daily)
      ? (dataObj.daily as WeatherForecast[])
      : [];

  return { current, forecast };
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [location, setLocation] = useState<LocationInfo>(
    initialData?.location ?? DEFAULT_LOCATION
  );
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(
    initialData?.airQuality ?? null
  );
  const [hourlyAirQuality, setHourlyAirQuality] = useState<HourlyAirQuality[]>(
    initialData?.hourlyAirQuality ?? []
  );
  const [airQualityForecast, setAirQualityForecast] = useState<AirQualityForecast[]>(
    initialData?.airQualityForecast ?? []
  );
  const [weather, setWeather] = useState<WeatherData | null>(
    initialData?.weather ?? null
  );
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>(
    initialData?.weatherForecast ?? []
  );
  const [recommendations, setRecommendations] =
    useState<AIRecommendationResponse | null>(initialData?.recommendations ?? null);

  const [isLoading, setIsLoading] = useState<boolean>(!initialData?.airQuality);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    initialData?.airQuality?.lastUpdated ?? new Date().toISOString()
  );

  // Pull-to-refresh touch tracking
  const touchStartYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);

  const fetchDataForCoordinates = useCallback(
    async (
      lat: number,
      lon: number,
      options: { background?: boolean } = {}
    ) => {
      if (options.background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [aqRes, weatherRes] = await Promise.all([
          fetch(`/api/air-quality?lat=${lat}&lon=${lon}`),
          fetch(`/api/weather?lat=${lat}&lon=${lon}`),
        ]);

        if (!aqRes.ok && !weatherRes.ok) {
          throw new Error(
            `Unable to load environmental data (AQ: ${aqRes.status}, Weather: ${weatherRes.status})`
          );
        }

        if (aqRes.ok) {
          const aqJson = (await aqRes.json()) as Record<string, unknown>;
          const normalizedAQ = normalizeAirQualityPayload(aqJson);
          if (normalizedAQ.current) setAirQuality(normalizedAQ.current);
          if (normalizedAQ.hourly.length > 0) setHourlyAirQuality(normalizedAQ.hourly);
          if (normalizedAQ.forecast.length > 0) setAirQualityForecast(normalizedAQ.forecast);
          if (normalizedAQ.location?.city) {
            setLocation((prev) => ({
              ...prev,
              city: normalizedAQ.location?.city || prev.city,
              state: normalizedAQ.location?.state ?? prev.state,
              country: normalizedAQ.location?.country ?? prev.country,
            }));
          }
        } else {
          setError(`Air quality service returned ${aqRes.status}. Showing latest available data.`);
        }

        if (weatherRes.ok) {
          const weatherJson = (await weatherRes.json()) as Record<string, unknown>;
          const normalizedWeather = normalizeWeatherPayload(weatherJson);
          if (normalizedWeather.current) setWeather(normalizedWeather.current);
          if (normalizedWeather.forecast.length > 0) {
            setWeatherForecast(normalizedWeather.forecast);
          }
        } else if (aqRes.ok) {
          setError(`Weather service returned ${weatherRes.status}.`);
        }

        // Generate useful actions automatically after the live data has loaded.
        try {
          const recRes = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lon }),
          });
          if (recRes.ok) {
            const recJson = (await recRes.json()) as AIRecommendationResponse;
            if (recJson && typeof recJson.air_quality_summary === 'string') {
              setRecommendations(recJson);
            }
          }
        } catch {
          // Recommendations endpoint may require auth or profile; gracefully ignore
        }

        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch live air quality and weather data.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const requestBrowserGeolocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationNotice(
        'Browser geolocation is unavailable. Use "Change Location" to pick your city.'
      );
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          let nextLocation: LocationInfo = {
            coordinates,
            city: 'Locating your city…',
            state: '',
            country: '',
          };
          try {
            const reverseRes = await fetch(
              `/api/location/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
            );
            if (reverseRes.ok) {
              const resolved = await reverseRes.json() as LocationInfo;
              if (resolved.city && resolved.city !== 'Unknown') {
                nextLocation = { ...resolved, coordinates };
              }
            }
          } catch {
            // AQI can still be fetched from the GPS coordinates below.
          }
          setLocation(nextLocation);
          setLocationNotice(
            nextLocation.city === 'Locating your city…'
              ? 'Using your device location. City details could not be verified; check the coordinates or choose a city manually.'
              : `Using your device location: ${[nextLocation.city, nextLocation.state, nextLocation.country].filter(Boolean).join(', ')}.`
          );
          try {
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLocation));
          } catch {
            // Ignore storage quota errors
          }
          fetchDataForCoordinates(coordinates.latitude, coordinates.longitude);
          resolve();
        },
        () => {
          setLocationNotice(
            'Location permission was not granted. Showing New Delhi — you can search any city manually.'
          );
          resolve();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  }, [fetchDataForCoordinates]);

  // First-visit initialization: restore saved location or request browser geolocation
  useEffect(() => {
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
      fetchDataForCoordinates(saved.coordinates.latitude, saved.coordinates.longitude);
      return;
    }

    // First visit: request geolocation permission and also ensure fresh API data
    requestBrowserGeolocation();
    if (!initialData?.airQuality) {
      fetchDataForCoordinates(
        DEFAULT_LOCATION.coordinates.latitude,
        DEFAULT_LOCATION.coordinates.longitude
      );
    }
  }, [fetchDataForCoordinates, initialData?.airQuality, requestBrowserGeolocation]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchDataForCoordinates(
        location.coordinates.latitude,
        location.coordinates.longitude,
        { background: true }
      );
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [autoRefresh, fetchDataForCoordinates, location.coordinates.latitude, location.coordinates.longitude]);

  const handleSelectLocation = (selected: LocationInfo) => {
    setLocation(selected);
    setLocationNotice(null);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // Ignore storage errors
    }
    fetchDataForCoordinates(selected.coordinates.latitude, selected.coordinates.longitude);
  };

  const handleManualRefresh = () => {
    fetchDataForCoordinates(location.coordinates.latitude, location.coordinates.longitude, {
      background: true,
    });
  };

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(84, delta * 0.5));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 56 && !isRefreshing) {
      handleManualRefresh();
    }
    touchStartYRef.current = null;
    setPullDistance(0);
  };

  const festivalWarnings = initialData?.festivalWarnings ?? [];
  const seasonalRisk = initialData?.seasonalRisk;
  const currentAqi = airQuality?.aqi ?? null;
  const aqiColor = currentAqi !== null ? getAQIColor(currentAqi) : null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80 dark:from-zinc-950 dark:via-background dark:to-zinc-900/60"
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 8 && (
        <div
          className="flex items-center justify-center gap-2 overflow-hidden text-xs text-muted-foreground transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={cn('size-3.5', pullDistance >= 56 && 'animate-spin text-primary')}
          />
          <span>{pullDistance >= 56 ? 'Release to refresh' : 'Pull down to refresh'}</span>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Location & Controls Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur-xl shadow-sm sm:flex-row sm:items-center dark:border-white/10 dark:bg-zinc-900/65"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Air Quality Dashboard
              </h1>
              {aqiColor && currentAqi !== null && (
                <Badge
                  variant="outline"
                  className={cn(aqiColor.bg, aqiColor.text, aqiColor.border)}
                >
                  {aqiColor.label} · {Math.round(currentAqi)}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <MapPin className="size-3.5 text-primary" />
                {[location.city, location.state, location.country].filter(Boolean).join(', ')}
              </span>
              <span className="tabular-nums">
                ({location.coordinates.latitude.toFixed(2)}°,{' '}
                {location.coordinates.longitude.toFixed(2)}°)
              </span>
              <span>Synced {formatTimestamp(lastSyncedAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LocationSearch
              currentLocation={location}
              onSelectLocation={handleSelectLocation}
              onRequestGeolocation={requestBrowserGeolocation}
              open={searchOpen}
              onOpenChange={setSearchOpen}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={cn('text-xs', autoRefresh && 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400')}
            >
              Auto: {autoRefresh ? 'On' : 'Off'}
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading || isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </motion.header>

        {/* Location Notice */}
        {locationNotice && (
          <Alert className="border-sky-500/30 bg-sky-500/10">
            <MapPin className="size-4 text-sky-600 dark:text-sky-400" />
            <AlertTitle>Location Notice</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{locationNotice}</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setSearchOpen(true)}
              >
                Search City
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
            <AlertTriangle className="size-4" />
            <AlertTitle>Data Fetch Warning</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleManualRefresh}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Health & Environmental Warnings */}
        {(currentAqi !== null && currentAqi > 200) ||
        festivalWarnings.length > 0 ||
        seasonalRisk ? (
          <section aria-label="Air quality warnings" className="grid gap-3 md:grid-cols-2">
            {currentAqi !== null && currentAqi > 200 && (
              <Alert
                variant="destructive"
                className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
              >
                <ShieldAlert className="size-4" />
                <AlertTitle>
                  {currentAqi > 400
                    ? 'Severe Air Pollution Alert'
                    : currentAqi > 300
                      ? 'Very Poor Air Quality Alert'
                      : 'Poor Air Quality Advisory'}
                </AlertTitle>
                <AlertDescription className="text-red-700/90 dark:text-red-300/90">
                  CPCB AQI is {Math.round(currentAqi)}. Minimize outdoor exertion, keep windows
                  sealed during peak hours, and wear an N95 mask outdoors.
                </AlertDescription>
              </Alert>
            )}

            {festivalWarnings.length > 0 && (
              <Alert className="border-amber-500/40 bg-amber-500/10">
                <Flame className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>
                  Upcoming Pollution Event: {festivalWarnings[0].festival.name} (in{' '}
                  {festivalWarnings[0].daysUntil} days)
                </AlertTitle>
                <AlertDescription>
                  {festivalWarnings[0].preparations[0]} ·{' '}
                  {festivalWarnings[0].preparations[1]}
                </AlertDescription>
              </Alert>
            )}

            {seasonalRisk && !(currentAqi !== null && currentAqi > 200 && festivalWarnings.length > 0) && (
              <Alert className="border-violet-500/30 bg-violet-500/5 md:col-span-1">
                <Lightbulb className="size-4 text-violet-500" />
                <AlertTitle>
                  {seasonalRisk.season} Season Risk: {seasonalRisk.riskLevel}
                </AlertTitle>
                <AlertDescription>{seasonalRisk.description}</AlertDescription>
              </Alert>
            )}
          </section>
        ) : null}

        {/* Primary Hero Row: AQI Card + Weather Card */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <AQICard
              data={airQuality}
              city={location.city}
              isLoading={isLoading && !airQuality}
            />
          </div>
          <div className="lg:col-span-7">
            <WeatherCard data={weather} isLoading={isLoading && !weather} />
          </div>
        </section>

        {/* Individual Pollutants */}
        <section aria-label="Pollutant breakdown" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pollutant Concentrations
            </h2>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="size-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>
          <PollutantGrid
            pollutants={airQuality?.pollutants}
            dominantPollutant={airQuality?.dominantPollutant}
            isLoading={isLoading && !airQuality}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AQIChart
            data={hourlyAirQuality}
            isLoading={isLoading && hourlyAirQuality.length === 0}
          />
          <ForecastChart
            airQualityForecast={airQualityForecast}
            weatherForecast={weatherForecast}
            isLoading={isLoading && airQualityForecast.length === 0}
          />
        </section>

        {/* Bottom Row: 7-Day Weather + AI Recommendations Preview */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <WeatherForecastCard
              forecast={weatherForecast}
              isLoading={isLoading && weatherForecast.length === 0}
            />
          </div>
          <div className="lg:col-span-5">
            <RecommendationsCard
              recommendations={recommendations}
              aqi={currentAqi}
              isLoading={isLoading && !airQuality}
            />
          </div>
        </section>

        {/* Loading Overlay Skeleton Helper (for initial cold state without server data) */}
        {isLoading && !airQuality && !weather && (
          <div className="sr-only" aria-live="polite">
            Loading air quality and weather dashboard...
            <Skeleton className="h-4 w-24" />
          </div>
        )}
      </main>
    </div>
  );
}

