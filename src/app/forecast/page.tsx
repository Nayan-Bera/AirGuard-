import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ForecastDashboard } from '@/components/forecast/forecast-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Pollution Forecast & Events',
  description:
    '5-day air quality forecast, 7-day weather outlook, seasonal risk assessment, and festival pollution preparedness timeline.',
};

function ForecastLoadingShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80 dark:from-zinc-950 dark:via-background dark:to-zinc-900/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-xl lg:col-span-7" />
          <Skeleton className="h-72 rounded-xl lg:col-span-5" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ForecastPage() {
  return (
    <Suspense fallback={<ForecastLoadingShell />}>
      <ForecastDashboard />
    </Suspense>
  );
}
