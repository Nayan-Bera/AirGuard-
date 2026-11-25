// Location Service - Geocoding and reverse geocoding

import type { GeoCoordinates, LocationInfo } from '@/types';
import { appConfig } from '@/lib/config/env';

const GEOCODING_BASE_URL = appConfig.apis.openMeteoGeocodingUrl;

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string; // State
  admin2?: string; // District
  admin3?: string;
  admin4?: string;
  timezone?: string;
  population?: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

// Cache for geocoding
const geocodingCache = new Map<string, LocationInfo>();

export async function reverseGeocode(coords: GeoCoordinates): Promise<LocationInfo> {
  const cacheKey = `${coords.latitude.toFixed(3)}_${coords.longitude.toFixed(3)}`;
  const cached = geocodingCache.get(cacheKey);
  if (cached) return cached;

  // Use Open-Meteo geocoding to find nearest city
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    count: '1',
  });

  // Open-Meteo doesn't have reverse geocoding, so we use a free alternative
  // Try Nominatim (OpenStreetMap) for reverse geocoding
  const response = await fetch(
    `${appConfig.apis.nominatimReverseUrl}?lat=${coords.latitude}&lon=${coords.longitude}&format=json&zoom=10`,
    {
      headers: { 'User-Agent': 'UrbanAirQualityAssistant/1.0' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    }
  );

  if (!response.ok) {
    // Fallback: return coordinates as location
    return {
      coordinates: coords,
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
    };
  }

  const data = await response.json();

  const location: LocationInfo = {
    coordinates: coords,
    city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown',
    state: data.address?.state || 'Unknown',
    country: data.address?.country || 'Unknown',
    localArea: data.address?.suburb || data.address?.neighbourhood || undefined,
    timezone: undefined,
  };

  geocodingCache.set(cacheKey, location);
  return location;
}

export async function searchLocations(query: string): Promise<Array<{ name: string; state: string; country: string; coordinates: GeoCoordinates }>> {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_BASE_URL}/search?${params}`, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) return [];

  const data: GeocodingResponse = await response.json();

  if (!data.results) return [];

  return data.results.map((r) => ({
    name: r.name,
    state: r.admin1 || '',
    country: r.country || '',
    coordinates: {
      latitude: r.latitude,
      longitude: r.longitude,
    },
  }));
}
