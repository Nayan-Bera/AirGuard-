import React, { Suspense } from 'react';
import { connection } from 'next/server';
import {
  DashboardClient,
  type DashboardInitialData,
} from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchAirQualityForecast,
  fetchCurrentAirQuality,
  fetchHourlyAirQuality,
} from '@/services/air-quality';
import { getFestivalWarnings, getSeasonalRisk } from '@/services/festivals';
import { fetchCurrentWeather, fetchWeatherForecast } from '@/services/weather';
import type { LocationInfo } from '@/types';

const DEFAULT_LOCATION: LocationInfo = {
  coordinates: { latitude: 28.6139, longitude: 77.209 },
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
};

function DashboardLoadingShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80 dark:from-zinc-950 dark:via-background dark:to-zinc-900/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-64 rounded-xl lg:col-span-5" />
          <Skeleton className="h-64 rounded-xl lg:col-span-7" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function DashboardDataLoader() {
  await connection();

  const coords = DEFAULT_LOCATION.coordinates;

  const [
    aqResult,
    hourlyResult,
    aqForecastResult,
    weatherResult,
    weatherForecastResult,
  ] = await Promise.allSettled([
    fetchCurrentAirQuality(coords),
    fetchHourlyAirQuality(coords),
    fetchAirQualityForecast(coords, 5),
    fetchCurrentWeather(coords),
    fetchWeatherForecast(coords, 7),
  ]);

  const currentMonth = new Date().getMonth() + 1;
  const festivalWarnings = getFestivalWarnings(30);
  const seasonalRisk = getSeasonalRisk(currentMonth);

  const initialData: DashboardInitialData = {
    location: DEFAULT_LOCATION,
    airQuality: aqResult.status === 'fulfilled' ? aqResult.value : null,
    hourlyAirQuality: hourlyResult.status === 'fulfilled' ? hourlyResult.value : [],
    airQualityForecast:
      aqForecastResult.status === 'fulfilled' ? aqForecastResult.value : [],
    weather: weatherResult.status === 'fulfilled' ? weatherResult.value : null,
    weatherForecast:
      weatherForecastResult.status === 'fulfilled'
        ? weatherForecastResult.value
        : [],
    festivalWarnings,
    seasonalRisk,
  };

  return <DashboardClient initialData={initialData} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingShell />}>
      <DashboardDataLoader />
    </Suspense>
  );
}
