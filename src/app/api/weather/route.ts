import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchCurrentWeather, fetchWeatherForecast } from '@/services/weather';
import {
  parseCoordinatesFromQuery,
  createValidationErrorResponse,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import type { GeoCoordinates, WeatherData, WeatherForecast } from '@/types';

const weatherDaysSchema = z.coerce.number().int().min(1).max(16).default(7);

export interface WeatherApiResponse {
  current: WeatherData;
  forecast: WeatherForecast[];
  coordinates: GeoCoordinates;
  fetchedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coordsResult = parseCoordinatesFromQuery(searchParams);
    if (!coordsResult.success) {
      return coordsResult.response;
    }

    const daysParam = searchParams.get('days');
    const daysResult = weatherDaysSchema.safeParse(daysParam ?? undefined);
    if (!daysResult.success) {
      return createValidationErrorResponse(daysResult.error, 'Invalid "days" query parameter');
    }

    const coords = coordsResult.data;
    const days = daysResult.data;

    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(coords),
      fetchWeatherForecast(coords, days),
    ]);

    const payload: WeatherApiResponse = {
      current,
      forecast,
      coordinates: coords,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/weather', error);
  }
}
