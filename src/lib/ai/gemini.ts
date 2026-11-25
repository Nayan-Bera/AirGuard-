// Gemini AI Service - Google Gemini API integration for recommendations

import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai';
import { z } from 'zod';
import { appConfig } from '@/lib/config/env';
import type { 
  AirQualityData, 
  WeatherData, 
  HouseholdProfile, 
  HouseholdPlant,
  AIRecommendation,
  AIRecommendationResponse,
  ProductRecommendation,
  AirQualityForecast 
} from '@/types';

// Initialize Gemini
function getGeminiClient() {
  const apiKey = appConfig.ai.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Zod schema for validating AI responses
export const recommendationResponseSchema = z.object({
  air_quality_summary: z.string(),
  risk_level: z.enum(['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe']),
  outdoor_recommendations: z.array(z.object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timing: z.string().optional(),
    estimatedCost: z.string().optional(),
    expectedBenefit: z.string().optional(),
  })),
  indoor_recommendations: z.array(z.object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timing: z.string().optional(),
    estimatedCost: z.string().optional(),
    expectedBenefit: z.string().optional(),
  })),
  plant_recommendations: z.array(z.object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timing: z.string().optional(),
    estimatedCost: z.string().optional(),
    expectedBenefit: z.string().optional(),
  })),
  lifestyle_recommendations: z.array(z.object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timing: z.string().optional(),
    estimatedCost: z.string().optional(),
    expectedBenefit: z.string().optional(),
  })),
  family_recommendations: z.array(z.object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timing: z.string().optional(),
    estimatedCost: z.string().optional(),
    expectedBenefit: z.string().optional(),
  })),
  product_recommendations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['air_purifier', 'mask', 'air_monitor', 'kitchen_ventilation']),
    description: z.string(),
    reason: z.string(),
    url: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })).optional().default([]),
  upcoming_risks: z.array(z.object({
    event: z.string(),
    date: z.string(),
    riskLevel: z.string(),
    description: z.string(),
    preparations: z.array(z.string()),
  })),
  priority_actions: z.array(z.object({
    action: z.string(),
    reason: z.string(),
    urgency: z.string(),
  })),
  explanation: z.string(),
  data_sources: z.array(z.string()),
  generated_at: z.string(),
  disclaimer: z.string(),
});

interface RecommendationContext {
  airQuality: AirQualityData;
  weather: WeatherData;
  forecast?: AirQualityForecast[];
  household?: HouseholdProfile;
  plants?: HouseholdPlant[];
  location: { city: string; state: string; country: string };
  currentTime: string;
  season: string;
  upcomingFestivals?: Array<{ name: string; date: string; pollutionImpact: string; daysUntil: number }>;
}

function getProductRecommendations(context: RecommendationContext): ProductRecommendation[] {
  const products: ProductRecommendation[] = [];
  const aqi = context.airQuality.aqi;
  const highExposure = aqi > 100 || (context.household?.dailyOutdoorHours ?? 0) >= 2 || context.household?.transportMode === 'bike';

  if (!context.household?.hasAirPurifier && aqi > 100) {
    products.push({
      id: 'product-hepa-purifier',
      name: 'HEPA air purifier for your main room',
      category: 'air_purifier',
      description: 'Choose a model sized for the room where you sleep or spend the most time. Compare CADR, room coverage, noise, and replacement-filter availability.',
      reason: `Your current AQI is ${aqi} and your profile says you do not have an air purifier.`,
      url: 'https://www.amazon.in/Philips-AC0950-Purifier-Display-Allergen/dp/B0DB85YDRS',
      priority: aqi > 200 ? 'high' : 'medium',
    });
  }

  if (highExposure) {
    products.push({
      id: 'product-n95-mask',
      name: 'Certified N95/FFP2 respirator',
      category: 'mask',
      description: 'Choose a genuine, well-fitting respirator from a reputable seller; fit matters more than brand. Use it for essential outdoor travel during polluted periods.',
      reason: context.household?.transportMode === 'bike' ? 'Your profile includes bike travel, which increases direct outdoor exposure.' : `AQI ${aqi} can make longer outdoor exposure less comfortable.`,
      url: 'https://www.amazon.in/s?k=NIOSH+N95+respirator',
      priority: aqi > 200 ? 'high' : 'medium',
    });
  }

  if (context.household?.experiencesDust || aqi > 150) {
    products.push({
      id: 'product-air-monitor',
      name: 'Indoor PM2.5 and CO₂ monitor',
      category: 'air_monitor',
      description: 'An indoor monitor helps you see whether cooking, opening windows, or running a purifier changes the air in the rooms you use.',
      reason: context.household?.experiencesDust ? 'Your profile mentions dust concerns.' : 'It can help check how indoor conditions respond during high-pollution days.',
      url: 'https://www.amazon.in/Temtop-Detection-Temperature-Humidity-Connectivity/dp/B0D1K7GNPM',
      priority: 'low',
    });
  }

  if (context.household?.isKitchenVentilated === false) {
    products.push({
      id: 'product-kitchen-ventilation',
      name: 'Kitchen chimney or exhaust fan',
      category: 'kitchen_ventilation',
      description: 'Select an option appropriate for your kitchen layout and arrange safe professional installation.',
      reason: 'Your profile indicates the kitchen is not ventilated while cooking.',
      url: 'https://www.amazon.in/s?k=kitchen+chimney+exhaust+fan',
      priority: 'medium',
    });
  }

  return products;
}

/**
 * Keeps the product useful when the model is temporarily unavailable or when a
 * household profile only has a few answers. These actions use the live AQI and
 * do not pretend to be a measured indoor-air reading.
 */
export function buildFallbackRecommendations(context: RecommendationContext): AIRecommendationResponse {
  const aqi = context.airQuality.aqi;
  const highPollution = aqi > 200;
  const elevatedPollution = aqi > 100;
  const priority: AIRecommendation['priority'] = highPollution ? 'high' : elevatedPollution ? 'medium' : 'low';
  const urgency = highPollution ? 'immediate' : elevatedPollution ? 'today' : 'this_week';
  const locationName = [context.location.city, context.location.state].filter(Boolean).join(', ') || 'your area';
  const hasPurifier = context.household?.hasAirPurifier;
  const hasKitchenVentilation = context.household?.isKitchenVentilated;
  const burnsIncense = context.household?.burnsIncense;

  const indoor: AIRecommendation[] = [
    {
      id: 'fallback-indoor-1', category: 'indoor', priority,
      title: highPollution ? 'Reduce outdoor air entering your home' : 'Use cleaner-air times for ventilation',
      description: highPollution
        ? 'Keep windows and doors closed toward busy roads. Open them only briefly if you need fresh air and outdoor conditions improve.'
        : 'Ventilate while outdoor AQI is lower, then close windows if traffic, smoke, or dust increases.',
      reason: `The latest outdoor AQI for ${locationName} is ${aqi} (${context.airQuality.category}).`,
    },
    {
      id: 'fallback-indoor-2', category: 'indoor', priority: hasPurifier ? 'medium' : priority,
      title: hasPurifier ? 'Run your air purifier in the occupied room' : 'Plan a particulate-filtration option',
      description: hasPurifier
        ? 'Use the purifier with doors and windows closed; clean or replace filters according to the manufacturer schedule.'
        : 'If pollution stays elevated, consider a correctly sized True HEPA purifier for the room where you sleep or spend the most time.',
      reason: 'Mechanical filtration is more effective for particle pollution than plants alone.',
    },
    {
      id: 'fallback-indoor-3', category: 'indoor', priority: 'medium',
      title: 'Limit indoor particle sources',
      description: `${burnsIncense ? 'Pause incense, candles, and mosquito coils indoors. ' : ''}${hasKitchenVentilation ? 'Use the kitchen exhaust throughout cooking.' : 'Use a kitchen exhaust fan or open a window away from traffic while cooking, then close it afterward.'}`,
      reason: 'Cooking smoke and burning products can raise indoor particle levels even when outdoor AQI is low.',
    },
  ];

  return {
    air_quality_summary: `Outdoor air in ${locationName} is currently AQI ${aqi} (${context.airQuality.category}). Follow these practical steps to reduce indoor exposure.`,
    risk_level: context.airQuality.category.toLowerCase().replace(' ', '_') as AIRecommendationResponse['risk_level'],
    outdoor_recommendations: [{
      id: 'fallback-outdoor-1', category: 'outdoor', priority,
      title: highPollution ? 'Move strenuous outdoor activity indoors' : 'Check AQI before long outdoor activity',
      description: highPollution ? 'Avoid prolonged exertion outdoors and use a well-fitted N95/FFP2 mask for essential trips.' : 'Prefer times with lower traffic and stop if smoke, dust, or irritation is noticeable.',
      reason: `AQI ${aqi} is the current outdoor-air indicator for your selected location.`,
    }],
    indoor_recommendations: indoor,
    plant_recommendations: [{
      id: 'fallback-plant-1', category: 'plants', priority: 'low',
      title: 'Keep plants clean, but do not rely on them for filtration',
      description: 'Wipe dust from leaves and use plants for comfort and greenery alongside ventilation and HEPA filtration when needed.',
      reason: 'Ordinary houseplants do not replace mechanical filtration for PM2.5.',
    }],
    lifestyle_recommendations: [],
    family_recommendations: [],
    product_recommendations: getProductRecommendations(context),
    upcoming_risks: [],
    priority_actions: indoor.slice(0, 3).map((item, index) => ({
      action: item.title,
      reason: item.reason,
      urgency: index === 0 ? urgency : highPollution ? 'today' : 'this_week',
    })),
    explanation: 'This action plan is based on the available live outdoor-air data. Add home details later to make the advice more specific.',
    data_sources: [context.airQuality.source, 'Built-in air-quality guidance'],
    generated_at: new Date().toISOString(),
    disclaimer: 'This is general environmental guidance, not a measured indoor-air reading or medical advice.',
  };
}

function buildRecommendationPrompt(context: RecommendationContext): string {
  const { airQuality, weather, forecast, household, plants, location, currentTime, season, upcomingFestivals } = context;

  let prompt = `You are an expert environmental health advisor for urban India. Generate personalized air quality recommendations based on the following REAL environmental data and user profile. 

IMPORTANT RULES:
1. Base ALL recommendations on the actual data provided below. Do NOT invent any data.
2. Never claim indoor plants can replace mechanical air filtration or reliably lower PM2.5.
3. Never make medical diagnoses.
4. Use CPCB India AQI standard categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500).
5. If any data is missing, say so explicitly.
6. Recommendations should be more cautious as pollution increases.
7. Include a disclaimer that this is informational guidance, not professional medical advice.

--- CURRENT ENVIRONMENTAL DATA ---
Location: ${location.city}, ${location.state}, ${location.country}
Time: ${currentTime}
Season: ${season}

Air Quality (CPCB India AQI):
- AQI: ${airQuality.aqi} (${airQuality.category})
- Dominant Pollutant: ${airQuality.dominantPollutant}
- PM2.5: ${airQuality.pollutants.pm25 !== null ? airQuality.pollutants.pm25 + ' µg/m³' : 'Not available'}
- PM10: ${airQuality.pollutants.pm10 !== null ? airQuality.pollutants.pm10 + ' µg/m³' : 'Not available'}
- CO: ${airQuality.pollutants.co !== null ? airQuality.pollutants.co + ' µg/m³' : 'Not available'}
- NO2: ${airQuality.pollutants.no2 !== null ? airQuality.pollutants.no2 + ' µg/m³' : 'Not available'}
- SO2: ${airQuality.pollutants.so2 !== null ? airQuality.pollutants.so2 + ' µg/m³' : 'Not available'}
- O3: ${airQuality.pollutants.o3 !== null ? airQuality.pollutants.o3 + ' µg/m³' : 'Not available'}
- Data Source: ${airQuality.source} (${airQuality.sourceType})
- Last Updated: ${airQuality.lastUpdated}

Weather:
- Temperature: ${weather.temperature}°C (Feels like ${weather.feelsLike}°C)
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.windSpeed} km/h
- Cloud Cover: ${weather.cloudCover}%
- Precipitation: ${weather.precipitation} mm
- Conditions: ${weather.weatherDescription}
- Sunrise: ${weather.sunrise}
- Sunset: ${weather.sunset}
`;

  if (forecast && forecast.length > 0) {
    prompt += `\n--- AIR QUALITY FORECAST (Next ${forecast.length} days) ---\n`;
    forecast.forEach(f => {
      prompt += `${f.date}: AQI ${f.aqi} (${f.category}), PM2.5: ${f.pm25} µg/m³, PM10: ${f.pm10} µg/m³\n`;
    });
    prompt += `Note: Forecasts are modelled estimates and may not be accurate.\n`;
  }

  if (household) {
    prompt += `\n--- HOUSEHOLD PROFILE ---
Property: ${household.propertyType || 'Not specified'}
Floor: ${household.floorNumber || 'Not specified'} of ${household.totalFloors || 'Not specified'}
BHK: ${household.bhk || 'Not specified'}
Environment: ${household.environmentType || 'Not specified'}
Transport: ${household.transportMode || 'Not specified'}
Daily outdoor exposure: ${household.dailyOutdoorHours || 'Not specified'} hours
Has balcony: ${household.hasBalcony ?? 'Not specified'}
Has garden: ${household.hasGarden ?? 'Not specified'}
Ventilation: ${household.hasProperVentilation ?? 'Not specified'}
Windows usually: ${household.windowsUsuallyOpen ? 'Open' : household.windowsUsuallyOpen === false ? 'Closed' : 'Not specified'}
Air purifier: ${household.hasAirPurifier ?? 'Not specified'}
AC: ${household.hasAC ?? 'Not specified'}
Exhaust fan: ${household.hasExhaustFan ?? 'Not specified'}
Cooking fuel: ${household.cookingFuel || 'Not specified'}
Kitchen ventilated: ${household.isKitchenVentilated ?? 'Not specified'}
Burns incense/coils: ${household.burnsIncense ?? 'Not specified'}
Dust issues: ${household.experiencesDust ?? 'Not specified'}
Nearby: ${household.nearbyFeatures?.join(', ') || 'Not specified'}
`;
  }

  if (plants && plants.length > 0) {
    prompt += `\n--- INDOOR PLANTS ---\n`;
    plants.forEach(p => {
      prompt += `- ${p.name} (Location: ${p.location})\n`;
    });
  }

  if (upcomingFestivals && upcomingFestivals.length > 0) {
    prompt += `\n--- UPCOMING FESTIVALS ---\n`;
    upcomingFestivals.forEach(f => {
      prompt += `- ${f.name} on ${f.date} (${f.daysUntil} days away, pollution impact: ${f.pollutionImpact})\n`;
    });
  }

  prompt += `
--- REQUIRED OUTPUT FORMAT ---
Respond ONLY with a valid JSON object matching this exact structure:
{
  "air_quality_summary": "Brief summary of current conditions",
  "risk_level": "good|satisfactory|moderate|poor|very_poor|severe",
  "outdoor_recommendations": [{"id": "out_1", "category": "outdoor", "title": "...", "description": "...", "reason": "...", "priority": "critical|high|medium|low", "timing": "...", "estimatedCost": "...", "expectedBenefit": "..."}],
  "indoor_recommendations": [{"id": "in_1", "category": "indoor", "title": "...", "description": "...", "reason": "...", "priority": "critical|high|medium|low"}],
  "plant_recommendations": [{"id": "pl_1", "category": "plants", "title": "...", "description": "...", "reason": "...", "priority": "medium|low"}],
  "lifestyle_recommendations": [{"id": "ls_1", "category": "lifestyle", "title": "...", "description": "...", "reason": "...", "priority": "medium|low"}],
  "family_recommendations": [{"id": "fm_1", "category": "family", "title": "...", "description": "...", "reason": "...", "priority": "medium|low"}],
  "upcoming_risks": [{"event": "...", "date": "...", "riskLevel": "...", "description": "...", "preparations": ["..."]}],
  "priority_actions": [{"action": "...", "reason": "...", "urgency": "immediate|today|this_week"}],
  "explanation": "Detailed explanation of current conditions and reasoning",
  "data_sources": ["Open-Meteo Air Quality API", "Open-Meteo Weather API"],
  "generated_at": "${new Date().toISOString()}",
  "disclaimer": "This information is for general environmental guidance only. It does not replace official public health advisories or professional medical advice. Always consult local authorities and healthcare providers for health-related decisions."
}

Provide at least 2-3 recommendations per category where data supports them. Be specific and actionable.`;

  return prompt;
}

export async function generateRecommendations(context: RecommendationContext): Promise<AIRecommendationResponse> {
  try {
    // This must be inside the try block: a missing GEMINI_API_KEY should show
    // the local action plan, not make the recommendations endpoint fail.
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: appConfig.ai.geminiModel,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });
    const prompt = buildRecommendationPrompt(context);
    const result: GenerateContentResult = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate with Zod
    const validated = recommendationResponseSchema.parse(parsed);
    // Keep product links curated by the app instead of allowing an AI response
    // to create unverified shopping URLs.
    return { ...validated, product_recommendations: getProductRecommendations(context) };
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
    return buildFallbackRecommendations(context);
  }
}

// Chat function for the AI assistant
export async function chatWithAssistant(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
  context: Partial<RecommendationContext>
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: appConfig.ai.geminiModel,
    generationConfig: {
      temperature: 0.5,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
    systemInstruction: `You are an expert Urban Air Quality Assistant for India. You help users understand air quality, weather impacts, and provide personalized recommendations based on real environmental data.

RULES:
1. Only reference data that has been provided to you. Never invent AQI values, weather data, or statistics.
2. Never make medical diagnoses or prescribe treatment.
3. Never claim that ordinary indoor plants can meaningfully replace air purifiers or reliably lower PM2.5.
4. Use CPCB India AQI categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500).
5. Be concise, friendly, and actionable.
6. If you don't have enough data to answer, say so clearly.
7. Always include a brief disclaimer for health-related advice.

${context.airQuality ? `Current AQI: ${context.airQuality.aqi} (${context.airQuality.category}), PM2.5: ${context.airQuality.pollutants.pm25} µg/m³` : ''}
${context.weather ? `Weather: ${context.weather.temperature}°C, ${context.weather.weatherDescription}, Humidity: ${context.weather.humidity}%` : ''}
${context.location ? `Location: ${context.location.city}, ${context.location.state}` : ''}
${context.household ? `User lives in: ${context.household.propertyType || 'Unknown'}, Floor: ${context.household.floorNumber || 'Unknown'}, Transport: ${context.household.transportMode || 'Unknown'}` : ''}`,
  });

  const chat = model.startChat({
    history: conversationHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
}
