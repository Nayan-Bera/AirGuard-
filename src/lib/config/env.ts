import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Manual JWT Auth
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // Supabase Database (optional in local fallback mode)
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // External Environmental APIs
  OPEN_METEO_AIR_QUALITY_URL: z
    .string()
    .url()
    .default('https://air-quality-api.open-meteo.com/v1/air-quality'),
  OPEN_METEO_WEATHER_URL: z
    .string()
    .url()
    .default('https://api.open-meteo.com/v1/forecast'),
  OPEN_METEO_GEOCODING_URL: z
    .string()
    .url()
    .default('https://geocoding-api.open-meteo.com/v1'),
  NOMINATIM_REVERSE_URL: z
    .string()
    .url()
    .default('https://nominatim.openstreetmap.org/reverse'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
}

const raw = parsed.success ? parsed.data : envSchema.parse({});

export const appConfig = {
  isProduction: raw.NODE_ENV === 'production',
  appUrl: raw.NEXT_PUBLIC_APP_URL,
  auth: {
    accessSecret:
      raw.JWT_ACCESS_SECRET ||
      (raw.NODE_ENV === 'production'
        ? ''
        : 'dev_only_fallback_access_secret_32_chars'),
    refreshSecret:
      raw.JWT_REFRESH_SECRET ||
      (raw.NODE_ENV === 'production'
        ? ''
        : 'dev_only_fallback_refresh_secret_32_chars'),
    accessExpiresIn: raw.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: raw.JWT_REFRESH_EXPIRES_IN,
  },
  ai: {
    geminiApiKey: raw.GEMINI_API_KEY || '',
    geminiModel: raw.GEMINI_MODEL,
  },
  db: {
    supabaseUrl: raw.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY || '',
    databaseUrl: raw.DATABASE_URL || '',
    isConfigured: Boolean(
      raw.NEXT_PUBLIC_SUPABASE_URL && raw.SUPABASE_SERVICE_ROLE_KEY
    ),
  },
  apis: {
    openMeteoAirQualityUrl: raw.OPEN_METEO_AIR_QUALITY_URL,
    openMeteoWeatherUrl: raw.OPEN_METEO_WEATHER_URL,
    openMeteoGeocodingUrl: raw.OPEN_METEO_GEOCODING_URL,
    nominatimReverseUrl: raw.NOMINATIM_REVERSE_URL,
  },
} as const;
