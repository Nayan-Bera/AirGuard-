import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchCurrentAirQuality } from '@/services/air-quality';
import { fetchCurrentWeather } from '@/services/weather';
import { reverseGeocode } from '@/services/location';
import { getFestivalWarnings, getSeasonalRisk } from '@/services/festivals';
import { chatWithAssistant } from '@/lib/ai/gemini';
import { retrieveTrustedKnowledge } from '@/lib/rag/knowledge-base';
import { chatMessageSchema } from '@/lib/validation/schemas';
import {
  parseJsonBody,
  createErrorResponse,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import { checkRateLimit } from '@/lib/api/rate-limit';
import type { AirQualityData, GeoCoordinates, LocationInfo, WeatherData } from '@/types';

const DEFAULT_COORDINATES: GeoCoordinates = {
  latitude: 28.6139,
  longitude: 77.209,
};

const chatHistoryEntrySchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.string().min(1).max(4000),
});

const chatRequestSchema = chatMessageSchema
  .extend({
    history: z.array(chatHistoryEntrySchema).max(50).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    {
      message: 'Both latitude and longitude must be provided together',
      path: ['latitude'],
    }
  );

export interface ChatApiResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  sources?: Array<{ title: string; source: string; url?: string }>;
}

function buildFallbackChatReply(
  message: string,
  airQuality?: AirQualityData,
  weather?: WeatherData,
  location?: Pick<LocationInfo, 'city' | 'state'>
): string {
  const question = message.toLowerCase();
  const aqi = airQuality?.aqi;
  const hasAqi = typeof aqi === 'number' && Number.isFinite(aqi);
  const place = [location?.city, location?.state].filter(Boolean).join(', ') || 'your selected area';
  const airSummary = hasAqi
    ? `The latest outdoor AQI for ${place} is **${Math.round(aqi)} (${airQuality?.category})**.`
    : `Live AQI data is temporarily unavailable for ${place}.`;

  if (/plant|pothos|snake plant|areca|peace lily|spider plant/.test(question)) {
    return `${airSummary}\n\n**Good indoor plant options**\n- **Snake plant** — a hardy choice for bedrooms or low-to-medium light; let the soil dry between watering.\n- **Pothos (money plant)** — easy to grow in bright, indirect light; keep it away from pets and small children because it is toxic if eaten.\n- **Areca palm** — suited to a brighter living room with indirect light; keep the soil lightly moist, not waterlogged.\n- **Spider plant** — a simple, pet-friendlier option for bright, indirect light.\n\nPlants can improve comfort and greenery, but they **do not meaningfully remove PM2.5 or replace a HEPA air purifier**. With AQI ${hasAqi ? Math.round(aqi) : 'elevated or unknown'}, prioritize reducing smoke indoors, using kitchen exhaust, and using mechanical filtration when needed.\n\nTell me your room light level, available space, and whether you have pets, and I can narrow this to the best 1–2 options.`;
  }

  if (/walk|outdoor|outside|run|exercise|commute/.test(question)) {
    const action = hasAqi && aqi > 200
      ? 'Avoid long or strenuous outdoor activity. If you must go out, keep the trip short and use a well-fitting N95/FFP2 respirator.'
      : hasAqi && aqi > 100
        ? 'Keep outdoor activity lighter and shorter than usual. Choose a route away from traffic and carry a well-fitting N95/FFP2 respirator for busy roads.'
        : 'A short walk is generally a lower-risk choice based on the available information. Prefer quieter routes and reassess if you notice smoke, dust, or throat irritation.';
    return `${airSummary}\n\n**For your outdoor plan**\n- ${action}\n- Avoid high-traffic roads and construction areas where possible.\n- Check the live AQI again before leaving, especially if conditions change.\n\nThis is general environmental guidance, not medical advice.`;
  }

  if (/window|ventilat/.test(question)) {
    const action = hasAqi && aqi > 150
      ? 'Keep windows and doors mostly closed toward traffic or dust sources. Ventilate briefly only when outdoor conditions improve.'
      : 'Use short periods of cross-ventilation when outdoor air is calmer, then close windows if traffic, smoke, or dust increases.';
    return `${airSummary}\n\n**Ventilation guidance**\n- ${action}\n- Always run the kitchen exhaust while cooking.\n- Do not burn incense, candles, or mosquito coils indoors during polluted periods.\n\nThis is general environmental guidance, not medical advice.`;
  }

  return `${airSummary}${weather ? ` The weather is ${weather.weatherDescription} at ${Math.round(weather.temperature)}°C.` : ''}\n\n**Practical steps for today**\n- Reduce indoor particle sources: use the kitchen exhaust and avoid burning products indoors.\n- If outdoor AQI is elevated, keep windows closed toward busy roads and use a correctly sized HEPA purifier in the room you use most.\n- For essential outdoor trips during polluted conditions, choose a well-fitting N95/FFP2 respirator.\n\nAsk me about outdoor activity, windows, masks, or improving indoor air. This is general environmental guidance, not medical advice.`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'local';
    const rl = checkRateLimit(`ai:chat:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return createErrorResponse(429, 'RATE_LIMITED', 'Too many chat requests. Please wait a moment.');
    }

    const bodyResult = await parseJsonBody(request, chatRequestSchema);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const { message, conversationId, history = [], latitude, longitude } = bodyResult.data;

    const coords: GeoCoordinates =
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : DEFAULT_COORDINATES;

    const [airQualityResult, weatherResult, locationResult] = await Promise.allSettled([
      fetchCurrentAirQuality(coords),
      fetchCurrentWeather(coords),
      reverseGeocode(coords),
    ]);

    const now = new Date();
    const seasonalRisk = getSeasonalRisk(now.getMonth() + 1);
    const festivalWarnings = getFestivalWarnings(30);

    const locationInfo =
      locationResult.status === 'fulfilled'
        ? {
            city: locationResult.value.city,
            state: locationResult.value.state,
            country: locationResult.value.country,
          }
        : undefined;

    const normalizedHistory = history.map((entry) => ({
      role: (entry.role === 'assistant' ? 'model' : entry.role) as 'user' | 'model',
      content: entry.content,
    }));

    const retrievedDocs = retrieveTrustedKnowledge(message, 3);
    const ragContext =
      retrievedDocs.length > 0
        ? `\n\n--- TRUSTED GUIDANCE REFERENCES ---\n${retrievedDocs
            .map((d) => `[${d.document.title} — ${d.document.source}]: ${d.document.content}`)
            .join('\n')}`
        : '';

    const airQuality = airQualityResult.status === 'fulfilled' ? airQualityResult.value : undefined;
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : undefined;
    let reply: string;
    try {
      reply = await chatWithAssistant(`${message}${ragContext}`, normalizedHistory, {
        airQuality,
        weather,
        location: locationInfo,
        currentTime: now.toISOString(),
        season: seasonalRisk.season,
        upcomingFestivals: festivalWarnings.map((warning) => ({
          name: warning.festival.name,
          date: warning.festival.date,
          pollutionImpact: warning.festival.pollutionImpact,
          daysUntil: warning.daysUntil,
        })),
      });
    } catch (error) {
      console.warn('AI chat unavailable; using local guidance:', error);
      reply = buildFallbackChatReply(message, airQuality, weather, locationInfo);
    }

    const payload: ChatApiResponse = {
      response: reply,
      conversationId: conversationId ?? crypto.randomUUID(),
      timestamp: now.toISOString(),
      sources: retrievedDocs.map((d) => ({
        title: d.document.title,
        source: d.document.source,
        url: d.document.url,
      })),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/chat', error);
  }
}
