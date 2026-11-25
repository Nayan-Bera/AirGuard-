// Air Quality Service - Open-Meteo Air Quality API integration
// https://air-quality-api.open-meteo.com/

import type { AirQualityData, AirQualityForecast, HourlyAirQuality, GeoCoordinates } from '@/types';
import { calculateCPCB_AQI, getAQIColor, getDataFreshness } from '@/lib/utils/index';
import { appConfig } from '@/lib/config/env';

const AIR_QUALITY_BASE_URL = appConfig.apis.openMeteoAirQualityUrl;

interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  current?: {
    time: string;
    interval: number;
    pm2_5?: number;
    pm10?: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    dust?: number;
    european_aqi?: number;
    us_aqi?: number;
    european_aqi_pm2_5?: number;
    european_aqi_pm10?: number;
    us_aqi_pm2_5?: number;
    us_aqi_pm10?: number;
  };
  hourly?: {
    time: string[];
    pm2_5?: number[];
    pm10?: number[];
    carbon_monoxide?: number[];
    nitrogen_dioxide?: number[];
    sulphur_dioxide?: number[];
    ozone?: number[];
    dust?: number[];
    european_aqi?: number[];
    us_aqi?: number[];
    us_aqi_pm2_5?: number[];
    us_aqi_pm10?: number[];
  };
}

// Cache for air quality data (short TTL - 15 minutes)
const airQualityCache = new Map<string, { data: AirQualityData; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

export async function fetchCurrentAirQuality(coords: GeoCoordinates): Promise<AirQualityData> {
  const cacheKey = getCacheKey(coords.latitude, coords.longitude);
  const cached = airQualityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    current: 'pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,us_aqi,us_aqi_pm2_5,us_aqi_pm10,european_aqi',
    timezone: 'auto',
  });

  const response = await fetch(`${AIR_QUALITY_BASE_URL}?${params}`, {
    next: { revalidate: 900 }, // 15 min revalidation
  });

  if (!response.ok) {
    throw new Error(`Air quality API error: ${response.status} ${response.statusText}`);
  }

  const raw: OpenMeteoAirQualityResponse = await response.json();

  if (!raw.current) {
    throw new Error('No current air quality data available');
  }

  const { current } = raw;

  // Calculate India CPCB AQI from pollutant concentrations
  const cpcbResult = calculateCPCB_AQI({
    pm25: current.pm2_5 ?? undefined,
    pm10: current.pm10 ?? undefined,
  });

  const data: AirQualityData = {
    aqi: cpcbResult.aqi,
    aqiStandard: 'india_cpcb',
    category: getAQIColor(cpcbResult.aqi).label,
    categoryColor: getAQIColor(cpcbResult.aqi).text,
    dominantPollutant: cpcbResult.dominantPollutant,
    pollutants: {
      pm25: current.pm2_5 ?? null,
      pm10: current.pm10 ?? null,
      co: current.carbon_monoxide ?? null,
      no2: current.nitrogen_dioxide ?? null,
      so2: current.sulphur_dioxide ?? null,
      o3: current.ozone ?? null,
      dust: current.dust ?? null,
    },
    source: 'Open-Meteo Air Quality API',
    sourceType: 'modelled_estimate',
    lastUpdated: current.time,
    dataFreshness: getDataFreshness(current.time),
  };

  airQualityCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export async function fetchHourlyAirQuality(coords: GeoCoordinates): Promise<HourlyAirQuality[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    hourly: 'pm2_5,pm10,us_aqi',
    timezone: 'auto',
    forecast_days: '2',
  });

  const response = await fetch(`${AIR_QUALITY_BASE_URL}?${params}`, {
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Hourly air quality API error: ${response.status}`);
  }

  const raw: OpenMeteoAirQualityResponse = await response.json();

  if (!raw.hourly) return [];

  return raw.hourly.time.map((time, i) => {
    const pm25 = raw.hourly!.pm2_5?.[i] ?? 0;
    const pm10 = raw.hourly!.pm10?.[i] ?? 0;
    const { aqi } = calculateCPCB_AQI({ pm25, pm10 });
    return {
      time,
      aqi,
      pm25,
      pm10,
    };
  });
}

export async function fetchAirQualityForecast(coords: GeoCoordinates, days: number = 5): Promise<AirQualityForecast[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    hourly: 'pm2_5,pm10,ozone,us_aqi',
    timezone: 'auto',
    forecast_days: days.toString(),
  });

  const response = await fetch(`${AIR_QUALITY_BASE_URL}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Forecast air quality API error: ${response.status}`);
  }

  const raw: OpenMeteoAirQualityResponse = await response.json();

  if (!raw.hourly) return [];

  // Aggregate hourly to daily
  const dailyMap = new Map<string, { pm25s: number[]; pm10s: number[]; o3s: number[]; aqis: number[] }>();

  raw.hourly.time.forEach((time, i) => {
    const date = time.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { pm25s: [], pm10s: [], o3s: [], aqis: [] });
    }
    const day = dailyMap.get(date)!;
    if (raw.hourly!.pm2_5?.[i] != null) day.pm25s.push(raw.hourly!.pm2_5![i]);
    if (raw.hourly!.pm10?.[i] != null) day.pm10s.push(raw.hourly!.pm10![i]);
    if (raw.hourly!.ozone?.[i] != null) day.o3s.push(raw.hourly!.ozone![i]);
    if (raw.hourly!.us_aqi?.[i] != null) day.aqis.push(raw.hourly!.us_aqi![i]);
  });

  const forecasts: AirQualityForecast[] = [];
  dailyMap.forEach((day, date) => {
    const avgPm25 = day.pm25s.length ? day.pm25s.reduce((a, b) => a + b, 0) / day.pm25s.length : 0;
    const avgPm10 = day.pm10s.length ? day.pm10s.reduce((a, b) => a + b, 0) / day.pm10s.length : 0;
    const avgO3 = day.o3s.length ? day.o3s.reduce((a, b) => a + b, 0) / day.o3s.length : 0;
    const { aqi } = calculateCPCB_AQI({ pm25: avgPm25, pm10: avgPm10 });

    forecasts.push({
      date,
      aqi,
      pm25: Math.round(avgPm25 * 10) / 10,
      pm10: Math.round(avgPm10 * 10) / 10,
      o3: Math.round(avgO3 * 10) / 10,
      category: getAQIColor(aqi).label,
    });
  });

  return forecasts;
}
