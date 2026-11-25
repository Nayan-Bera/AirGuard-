// Historical Data Service
// Provides historical air quality data from stored observations
// and Open-Meteo's historical API

import type { GeoCoordinates } from '@/types';
import { appConfig } from '@/lib/config/env';

const HISTORICAL_AQ_URL = appConfig.apis.openMeteoAirQualityUrl;

export interface HistoricalDataPoint {
  date: string;
  pm25: number;
  pm10: number;
  aqi: number;
}

// Fetch historical air quality data from Open-Meteo
// Note: Open-Meteo provides up to 5 days of past data for free
export async function fetchRecentHistory(
  coords: GeoCoordinates,
  pastDays: number = 5
): Promise<HistoricalDataPoint[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    hourly: 'pm2_5,pm10',
    timezone: 'auto',
    past_days: Math.min(pastDays, 5).toString(),
    forecast_days: '0',
  });

  try {
    const response = await fetch(`${HISTORICAL_AQ_URL}?${params}`, {
      next: { revalidate: 7200 }, // Cache 2 hours
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.hourly) return [];

    // Aggregate hourly to daily
    const dailyMap = new Map<string, { pm25s: number[]; pm10s: number[] }>();

    data.hourly.time.forEach((time: string, i: number) => {
      const date = time.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { pm25s: [], pm10s: [] });
      }
      const day = dailyMap.get(date)!;
      if (data.hourly.pm2_5?.[i] != null) day.pm25s.push(data.hourly.pm2_5[i]);
      if (data.hourly.pm10?.[i] != null) day.pm10s.push(data.hourly.pm10[i]);
    });

    const result: HistoricalDataPoint[] = [];
    dailyMap.forEach((day, date) => {
      const avgPm25 = day.pm25s.length ? day.pm25s.reduce((a, b) => a + b, 0) / day.pm25s.length : 0;
      const avgPm10 = day.pm10s.length ? day.pm10s.reduce((a, b) => a + b, 0) / day.pm10s.length : 0;
      
      // Simple AQI calculation from PM2.5 for history display
      const { calculateCPCB_AQI } = require('@/lib/utils');
      const { aqi } = calculateCPCB_AQI({ pm25: avgPm25, pm10: avgPm10 });
      
      result.push({
        date,
        pm25: Math.round(avgPm25 * 10) / 10,
        pm10: Math.round(avgPm10 * 10) / 10,
        aqi,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return [];
  }
}
