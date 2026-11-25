'use client';

import * as React from 'react';
import type { WeatherData } from '@/types';

const DEFAULT_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function useWeather(
  lat: number | null | undefined,
  lon: number | null | undefined,
  refreshIntervalMs: number = DEFAULT_REFRESH_INTERVAL_MS
): UseWeatherResult {
  const [data, setData] = React.useState<WeatherData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const hasCoords = isValidCoordinate(lat) && isValidCoordinate(lon);

  const fetchWeather = React.useCallback(async () => {
    if (!isValidCoordinate(lat) || !isValidCoordinate(lon)) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
      });

      const response = await fetch(`/api/weather?${params.toString()}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.error?.message ||
          payload?.message ||
          `Failed to fetch weather data (${response.status})`;
        throw new Error(message);
      }

      if (!controller.signal.aborted) {
        setData(payload as WeatherData);
        setError(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        const message =
          err instanceof Error ? err.message : 'Unable to fetch weather data';
        setError(message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [lat, lon]);

  React.useEffect(() => {
    if (!hasCoords) {
      abortControllerRef.current?.abort();
      setLoading(false);
      return;
    }

    void fetchWeather();

    if (refreshIntervalMs <= 0) {
      return () => {
        abortControllerRef.current?.abort();
      };
    }

    const intervalId = window.setInterval(() => {
      void fetchWeather();
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [hasCoords, fetchWeather, refreshIntervalMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchWeather,
  };
}
