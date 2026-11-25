import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchCurrentAirQuality, fetchAirQualityForecast } from '@/services/air-quality';
import { reverseGeocode } from '@/services/location';
import { evaluateNotifications } from '@/services/notifications';
import { notificationPreferencesSchema } from '@/lib/validation/schemas';
import { parseJsonBody, handleUnexpectedRouteError } from '@/lib/api/route-utils';
import type { GeoCoordinates } from '@/types';

const DEFAULT_COORDINATES: GeoCoordinates = {
  latitude: 28.6139,
  longitude: 77.209,
};

const notificationsRequestSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().optional(),
  preferences: notificationPreferencesSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(request, notificationsRequestSchema);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const { latitude, longitude, city, preferences } = bodyResult.data;
    const coords: GeoCoordinates =
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : DEFAULT_COORDINATES;

    const [aqResult, forecastResult, locResult] = await Promise.allSettled([
      fetchCurrentAirQuality(coords),
      fetchAirQualityForecast(coords, 5),
      reverseGeocode(coords),
    ]);

    const resolvedCity =
      city ||
      (locResult.status === 'fulfilled' ? locResult.value.city : 'Your Location');

    const activePreferences = {
      userId: 'local-user',
      enableAQIAlerts: preferences?.enableAQIAlerts ?? true,
      aqiThreshold: preferences?.aqiThreshold ?? 200,
      enablePM25Alerts: preferences?.enablePM25Alerts ?? true,
      pm25Threshold: preferences?.pm25Threshold ?? 60,
      enableFestivalAlerts: preferences?.enableFestivalAlerts ?? true,
      festivalAlertDaysBefore: preferences?.festivalAlertDaysBefore ?? 14,
      enableSeasonalAlerts: preferences?.enableSeasonalAlerts ?? true,
      enableForecastAlerts: preferences?.enableForecastAlerts ?? true,
    };

    const notifications = evaluateNotifications({
      userId: 'local-user',
      city: resolvedCity,
      airQuality: aqResult.status === 'fulfilled' ? aqResult.value : undefined,
      forecast: forecastResult.status === 'fulfilled' ? forecastResult.value : [],
      preferences: activePreferences,
    });

    return NextResponse.json(
      {
        city: resolvedCity,
        notifications,
        evaluatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/notifications', error);
  }
}

