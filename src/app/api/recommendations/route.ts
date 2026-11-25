import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  fetchCurrentAirQuality,
  fetchAirQualityForecast,
} from '@/services/air-quality';
import { fetchCurrentWeather } from '@/services/weather';
import { reverseGeocode } from '@/services/location';
import { getFestivalWarnings, getSeasonalRisk } from '@/services/festivals';
import { generateRecommendations } from '@/lib/ai/gemini';
import {
  householdProfileSchema,
  locationSchema,
  plantSchema,
} from '@/lib/validation/schemas';
import {
  parseJsonBody,
  createErrorResponse,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import { checkRateLimit } from '@/lib/api/rate-limit';
import type {
  AIRecommendationResponse,
  GeoCoordinates,
  HouseholdPlant,
  HouseholdProfile,
} from '@/types';

// Rate limiting consideration:
// This endpoint invokes the Gemini LLM and fetches multiple upstream environmental APIs.
// In production, enforce per-user / per-IP rate limiting (e.g. sliding window via Upstash Redis
// or Next.js middleware, such as 10 requests/hour per user) and cache responses by rounded
// coordinates + household profile hash to prevent quota exhaustion and abuse.

const recommendationsRequestSchema = locationSchema.extend({
  household: householdProfileSchema.partial().optional(),
  plants: z.array(plantSchema).max(50).optional(),
});

type HouseholdInput = NonNullable<z.infer<typeof recommendationsRequestSchema>['household']>;
type PlantInput = NonNullable<z.infer<typeof recommendationsRequestSchema>['plants']>[number];

function toHouseholdProfile(input: HouseholdInput, fallbackCity: string): HouseholdProfile {
  const now = new Date().toISOString();
  return {
    id: 'request-household',
    userId: 'anonymous',
    city: input.city ?? fallbackCity,
    environmentType: input.environmentType ?? null,
    transportMode: input.transportMode ?? null,
    dailyOutdoorHours: input.dailyOutdoorHours ?? null,
    outdoorTimings: input.outdoorTimings ?? null,
    propertyType: input.propertyType ?? null,
    isOwned: input.isOwned ?? null,
    totalFloors: input.totalFloors ?? null,
    floorNumber: input.floorNumber ?? null,
    bhk: input.bhk ?? null,
    approximateSize: input.approximateSize ?? null,
    hasBalcony: input.hasBalcony ?? null,
    hasGarden: input.hasGarden ?? null,
    hasProperVentilation: input.hasProperVentilation ?? null,
    windowsUsuallyOpen: input.windowsUsuallyOpen ?? null,
    nearbyFeatures: input.nearbyFeatures ?? [],
    hasAirPurifier: input.hasAirPurifier ?? null,
    hasAC: input.hasAC ?? null,
    hasExhaustFan: input.hasExhaustFan ?? null,
    cookingFuel: input.cookingFuel ?? null,
    isKitchenVentilated: input.isKitchenVentilated ?? null,
    burnsIncense: input.burnsIncense ?? null,
    experiencesDust: input.experiencesDust ?? null,
    profileCompletionPercent: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function toHouseholdPlants(plants: PlantInput[]): HouseholdPlant[] {
  return plants.map((plant, index) => ({
    id: `request-plant-${index}`,
    householdId: 'request-household',
    name: plant.name,
    type: plant.type,
    location: plant.location,
    notes: plant.notes,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'local';
    const rl = checkRateLimit(`ai:recommendations:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return createErrorResponse(429, 'RATE_LIMITED', 'Too many recommendation requests. Please wait a minute.');
    }

    const bodyResult = await parseJsonBody(request, recommendationsRequestSchema);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const { latitude, longitude, city, household, plants } = bodyResult.data;
    const coords: GeoCoordinates = { latitude, longitude };

    const [airQuality, forecast, weather, locationInfo] = await Promise.all([
      fetchCurrentAirQuality(coords),
      fetchAirQualityForecast(coords),
      fetchCurrentWeather(coords),
      reverseGeocode(coords),
    ]);

    const now = new Date();
    const seasonalRisk = getSeasonalRisk(now.getMonth() + 1);
    const festivalWarnings = getFestivalWarnings(30);

    const resolvedCity = city ?? locationInfo.city;
    const recommendations: AIRecommendationResponse = await generateRecommendations({
      airQuality,
      weather,
      forecast,
      household: household ? toHouseholdProfile(household, resolvedCity) : undefined,
      plants: plants ? toHouseholdPlants(plants) : undefined,
      location: {
        city: resolvedCity,
        state: locationInfo.state,
        country: locationInfo.country,
      },
      currentTime: now.toISOString(),
      season: seasonalRisk.season,
      upcomingFestivals: festivalWarnings.map((warning) => ({
        name: warning.festival.name,
        date: warning.festival.date,
        pollutionImpact: warning.festival.pollutionImpact,
        daysUntil: warning.daysUntil,
      })),
    });

    return NextResponse.json(recommendations, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/recommendations', error);
  }
}
