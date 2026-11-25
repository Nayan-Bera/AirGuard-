import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCurrentAirQuality,
  fetchHourlyAirQuality,
  fetchAirQualityForecast,
} from '@/services/air-quality';
import {
  parseCoordinatesFromQuery,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import type { AirQualityData, AirQualityForecast, GeoCoordinates, HourlyAirQuality } from '@/types';

export interface AirQualityApiResponse {
  current: AirQualityData;
  hourly: HourlyAirQuality[];
  forecast: AirQualityForecast[];
  coordinates: GeoCoordinates;
  fetchedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const coordsResult = parseCoordinatesFromQuery(request.nextUrl.searchParams);
    if (!coordsResult.success) {
      return coordsResult.response;
    }

    const coords = coordsResult.data;

    const [current, hourly, forecast] = await Promise.all([
      fetchCurrentAirQuality(coords),
      fetchHourlyAirQuality(coords),
      fetchAirQualityForecast(coords),
    ]);

    const payload: AirQualityApiResponse = {
      current,
      hourly,
      forecast,
      coordinates: coords,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/air-quality', error);
  }
}
