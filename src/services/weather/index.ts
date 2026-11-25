// Weather Service - Open-Meteo Weather API integration
// https://open-meteo.com/

import type { WeatherData, WeatherForecast, GeoCoordinates } from '@/types';
import { getWeatherDescription } from '@/lib/utils/index';
import { appConfig } from '@/lib/config/env';

const WEATHER_BASE_URL = appConfig.apis.openMeteoWeatherUrl;

interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    interval: number;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
    precipitation?: number;
    cloud_cover?: number;
    visibility?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
    wind_speed_10m_max?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
}

// Cache for weather data (moderate TTL - 30 minutes)
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCacheKey(lat: number, lon: number): string {
  return `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

export async function fetchCurrentWeather(coords: GeoCoordinates): Promise<WeatherData> {
  const cacheKey = getCacheKey(coords.latitude, coords.longitude);
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,cloud_cover,visibility,weather_code,is_day',
    daily: 'sunrise,sunset,uv_index_max,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  });

  const response = await fetch(`${WEATHER_BASE_URL}?${params}`, {
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const raw: OpenMeteoWeatherResponse = await response.json();

  if (!raw.current) {
    throw new Error('No current weather data available');
  }

  const { current, daily } = raw;

  const data: WeatherData = {
    temperature: current.temperature_2m ?? 0,
    feelsLike: current.apparent_temperature ?? 0,
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    windDirection: current.wind_direction_10m ?? 0,
    pressure: current.surface_pressure ?? 0,
    precipitation: current.precipitation ?? 0,
    precipitationProbability: daily?.precipitation_probability_max?.[0] ?? 0,
    cloudCover: current.cloud_cover ?? 0,
    visibility: current.visibility ?? undefined,
    weatherCode: current.weather_code ?? 0,
    weatherDescription: getWeatherDescription(current.weather_code ?? 0),
    isDay: (current.is_day ?? 1) === 1,
    sunrise: daily?.sunrise?.[0] ?? '',
    sunset: daily?.sunset?.[0] ?? '',
    uvIndex: daily?.uv_index_max?.[0] ?? undefined,
    lastUpdated: current.time,
  };

  weatherCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export async function fetchWeatherForecast(coords: GeoCoordinates, days: number = 7): Promise<WeatherForecast[]> {
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: days.toString(),
  });

  const response = await fetch(`${WEATHER_BASE_URL}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Weather forecast API error: ${response.status}`);
  }

  const raw: OpenMeteoWeatherResponse = await response.json();

  if (!raw.daily) return [];

  return raw.daily.time.map((date, i) => ({
    date,
    tempMax: raw.daily!.temperature_2m_max?.[i] ?? 0,
    tempMin: raw.daily!.temperature_2m_min?.[i] ?? 0,
    precipitationProbability: raw.daily!.precipitation_probability_max?.[i] ?? 0,
    weatherCode: raw.daily!.weather_code?.[i] ?? 0,
    weatherDescription: getWeatherDescription(raw.daily!.weather_code?.[i] ?? 0),
    windSpeedMax: raw.daily!.wind_speed_10m_max?.[i] ?? 0,
    sunrise: raw.daily!.sunrise?.[i] ?? '',
    sunset: raw.daily!.sunset?.[i] ?? '',
  }));
}
