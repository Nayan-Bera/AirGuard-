'use client';

import * as React from 'react';
import type { GeoCoordinates } from '@/types';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export const LOCATION_PERMISSION_EXPLANATION =
  'AirGuard AI uses your approximate location solely to fetch hyper-local air quality, pollutant levels, and weather forecasts for your area. Your coordinates are never stored for tracking or shared with third parties.';

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  explanation?: string;
}

export interface UseLocationResult {
  coordinates: GeoCoordinates | null;
  loading: boolean;
  error: string | null;
  permissionState: LocationPermissionState;
  explanation: string;
  requestPermission: () => Promise<GeoCoordinates | null>;
}

function mapGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location access was denied. Please enable location permissions in your browser settings or search for your city manually.';
    case err.POSITION_UNAVAILABLE:
      return 'Your current location could not be determined. Try again or select a city manually.';
    case err.TIMEOUT:
      return 'Location request timed out. Please try again or enter your city manually.';
    default:
      return 'Unable to retrieve your location. Please select a city manually.';
  }
}

export function useLocation(options: UseLocationOptions = {}): UseLocationResult {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 5 * 60 * 1000,
    explanation = LOCATION_PERMISSION_EXPLANATION,
  } = options;

  const [coordinates, setCoordinates] = React.useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionState, setPermissionState] =
    React.useState<LocationPermissionState>('prompt');

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPosition = React.useCallback((): Promise<GeoCoordinates | null> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      if (isMountedRef.current) {
        setPermissionState('unsupported');
        setError('Geolocation is not supported by your browser. Please search for your city manually.');
        setLoading(false);
      }
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeoCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (isMountedRef.current) {
            setCoordinates(coords);
            setPermissionState('granted');
            setError(null);
            setLoading(false);
          }
          resolve(coords);
        },
        (geoError) => {
          if (isMountedRef.current) {
            if (geoError.code === geoError.PERMISSION_DENIED) {
              setPermissionState('denied');
            }
            setError(mapGeolocationError(geoError));
            setLoading(false);
          }
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function') {
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    const handleChange = () => {
      if (!permissionStatus || cancelled || !isMountedRef.current) return;
      const state = permissionStatus.state as LocationPermissionState;
      setPermissionState(state);
      if (state === 'granted') {
        void fetchPosition();
      } else if (state === 'denied') {
        setError(
          'Location access is blocked in browser settings. Enable it or select your city manually.'
        );
      }
    };

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled || !isMountedRef.current) return;
        permissionStatus = status;
        const state = status.state as LocationPermissionState;
        setPermissionState(state);

        if (state === 'granted') {
          void fetchPosition();
        } else if (state === 'denied') {
          setError(
            'Location access was previously denied. Enable it in browser settings or search for your city manually.'
          );
        }

        status.addEventListener('change', handleChange);
      })
      .catch(() => {
        // Fallback silently when Permissions API is unavailable
      });

    return () => {
      cancelled = true;
      permissionStatus?.removeEventListener('change', handleChange);
    };
  }, [fetchPosition]);

  const requestPermission = React.useCallback(async () => {
    return fetchPosition();
  }, [fetchPosition]);

  return {
    coordinates,
    loading,
    error,
    permissionState,
    explanation,
    requestPermission,
  };
}
