'use client';

import * as React from 'react';
import type { AirQualityData } from '@/types';

const DEFAULT_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export interface UseAirQualityResult {
  data: AirQualityData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function useAirQuality(
  lat: number | null | undefined,
  lon: number | null | undefined,
  refreshIntervalMs: number = DEFAULT_REFRESH_INTERVAL_MS
): UseAirQualityResult {
  const [data, setData] = React.useState<AirQualityData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const hasCoords = isValidCoordinate(lat) && isValidCoordinate(lon);

  const fetchAirQuality = React.useCallback(async () => {
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

      const response = await fetch(`/api/air-quality?${params.toString()}`, {
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
          `Failed to fetch air quality data (${response.status})`;
        throw new Error(message);
      }

      const current = payload?.current ?? payload?.data?.current ?? payload;
      const validCurrent =
        current &&
        typeof current === 'object' &&
        typeof current.aqi === 'number' &&
        Number.isFinite(current.aqi);

      if (!validCurrent) {
        throw new Error('Live AQI data is unavailable for this location');
      }

      if (!controller.signal.aborted) {
        setData(current as AirQualityData);
        setError(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        const message =
          err instanceof Error ? err.message : 'Unable to fetch air quality data';
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

    void fetchAirQuality();

    if (refreshIntervalMs <= 0) {
      return () => {
        abortControllerRef.current?.abort();
      };
    }

    const intervalId = window.setInterval(() => {
      void fetchAirQuality();
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [hasCoords, fetchAirQuality, refreshIntervalMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchAirQuality,
  };
}
