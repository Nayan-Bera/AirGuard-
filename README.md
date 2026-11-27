# AeroPulse AI — Urban Air Quality Assistant

A production-ready GenAI-powered Urban Air Quality Assistant built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Framer Motion**, **Recharts**, **Supabase + Drizzle ORM**, and **Google Gemini**.

AeroPulse AI combines real-time environmental data, weather conditions, pollution forecasts, festival/seasonal intelligence, and a personalized household profile to generate actionable, grounded environmental guidance.

## Key Features

- **Real-Time Air Quality & Weather**: Fetches live pollutant concentrations (`PM2.5`, `PM10`, `CO`, `NO2`, `SO2`, `O3`, `Dust`) and weather conditions from Open-Meteo Air Quality & Weather APIs with CPCB India AQI calculation, source attribution, and data freshness indicators.
- **Automatic & Manual Location Detection**: Uses browser Geolocation + Nominatim reverse geocoding, with city search via Open-Meteo Geocoding API as a fallback.
- **Personalized Household Profile (`/home`)**: Multi-step onboarding wizard collecting property type, floor, ventilation, cooking fuel, commuting habits, nearby pollution sources, and indoor plants, plus a transparent **Home Environment Score**.
- **GenAI Personalization Engine (`/api/recommendations`)**: Uses Google Gemini (`gemini-2.0-flash`) with Zod-validated structured JSON output covering outdoor safety, indoor air quality, plant care & limitations, lifestyle, and family recommendations.
- **Conversational AI Assistant (`/assistant`)**: Context-aware chat interface grounded with real-time environmental data and a trusted **RAG Knowledge Base** (`WHO`, `CPCB`, `EPA` advisories) with source attribution.
- **Pollution Forecast & Festival Intelligence (`/forecast`)**: 5-day AQI forecast, 7-day weather forecast, seasonal risk analysis (Winter inversion, Summer dust/ozone, Monsoon washout), and advance preparation timelines for festivals like Diwali, New Year, Holi, and Durga Puja.
- **Air Quality Insights (`/insights`)**: Interactive Recharts visualizations for hourly trends, PM2.5/PM10 comparisons, and recent historical patterns.
- **Settings & Early Alerts (`/settings`)**: Configurable AQI/PM2.5 alert thresholds, AQI standard selection, notification evaluation, and full data deletion.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Lucide React, Recharts, React Hook Form
- **Backend**: Next.js API Routes, Zod, Drizzle ORM, Supabase (PostgreSQL + Auth + RLS + pgvector)
- **AI & RAG**: Google Gemini API (`@google/generative-ai`), structured JSON validation, trusted environmental knowledge retrieval
- **External APIs (Free Tier)**: Open-Meteo Air Quality API, Open-Meteo Weather API, Open-Meteo Geocoding API, OpenStreetMap Nominatim

## Project Structure

```text
src/
  app/
    (marketing)/        # Landing page (/)
    (auth)/             # Login, Register, OAuth callback
    dashboard/          # Main AQI & Weather Dashboard
    home/               # My Home profile, onboarding & plant manager
    insights/           # Air Quality Insights & pollutant trends
    assistant/          # Conversational AI Assistant
    forecast/           # Pollution Forecast, Festivals & Seasonal Risks
    settings/           # Preferences, Alerts & Data Privacy
    api/                # Server-side API routes (air-quality, weather, chat, recommendations, profile, notifications, festivals, location)
  components/           # Modular UI, charts, dashboard, assistant, forecast, home-profile
  db/                   # Drizzle ORM schema & RLS/pgvector SQL migrations
  hooks/                # Client hooks (useLocation, useAirQuality, useWeather)
  lib/                  # AI, RAG, DB, Auth, Validation, Utilities
  services/             # Air quality, weather, location, festivals, historical-data, recommendations, notifications
  types/                # Shared TypeScript interfaces
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   - `GEMINI_API_KEY`: Required for AI recommendations and the AI Assistant chat.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`: Required for cloud persistence & Supabase Auth (the app also works in local browser storage mode without Supabase configured).

3. **Push database schema (when using Supabase)**:
   ```bash
   npx drizzle-kit push
   ```
   Apply Row Level Security and pgvector setup from `src/db/migrations/0001_rls_policies.sql` in the Supabase SQL Editor.

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Disclaimer

AeroPulse AI provides informational environmental guidance based on external air quality APIs and AI models. It does not replace official public health advisories or professional medical advice.
