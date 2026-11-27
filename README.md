# AeroPulse AI

An AI-assisted urban air-quality companion that turns environmental data into practical guidance for daily decisions at home and outdoors.

## Challenge vertical and persona

- **Vertical:** Urban air quality, household wellness, and environmental decision support.
- **Primary persona:** A city resident or household making everyday choices about outdoor activity, commuting, ventilation, and indoor air. The app can also consider household details such as children, older adults, respiratory concerns, home ventilation, cooking fuel, and plants when the user provides them.
- **Problem:** AQI values and forecasts can be difficult to translate into timely, location-aware actions. AeroPulse brings readings, forecasts, household context, and plain-language guidance into one place.

## How the solution works

1. The user selects a location or grants browser geolocation. The app can also start with New Delhi as its default location.
2. Server-side services request current and forecast air-quality and weather data from Open-Meteo. Location search uses Open-Meteo Geocoding; reverse geocoding uses Nominatim.
3. The app calculates an India CPCB AQI from PM2.5 and PM10 concentrations, identifies the dominant pollutant, and displays pollutant readings, freshness, weather, and forecast trends.
4. The user can add a household profile, plants, and saved locations. Authenticated account and profile data are stored in PostgreSQL using Drizzle ORM and the server-side `DATABASE_URL`.
5. The assistant combines the question with available environmental context and relevant entries from a small, curated environmental guidance knowledge base. The recommendations service asks Gemini for structured suggestions and validates the response with Zod.
6. The dashboard, insights, forecast, home profile, assistant, and settings pages present the information and let the user manage saved preferences and locations.

## GenAI services

- **Google Gemini API** (default model: `gemini-2.0-flash`) powers the conversational assistant and personalized recommendation generation.
- The assistant can use current AQI, weather, location, seasonal, and festival context, along with relevant retrieved guidance from the bundled knowledge base. It returns source information for retrieved guidance.
- The recommendations endpoint requests structured suggestions for outdoor safety, indoor air, plants, lifestyle, family context, and products. Zod validates the generated structure before it is returned.
- When Gemini is unavailable, the chat endpoint has a rule-based fallback for common air-quality questions. AI features require a configured `GEMINI_API_KEY`.

## Features

- Current AQI, pollutant concentrations, and weather
- Location search, saved locations, and browser geolocation
- Household onboarding, ventilation and lifestyle profile, and plant management
- Gemini-powered chat and personalized environmental recommendations
- AQI and weather forecasts, seasonal risk, and festival warnings
- Interactive pollutant and historical trend visualizations
- Alert preferences, account controls, and saved profile data
- Responsive interface with account sign-in and registration

## Technology

- **Application:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, Base UI/shadcn components, Framer Motion, Recharts, Lucide
- **Server and validation:** Next.js route handlers, Zod
- **Database:** PostgreSQL, Drizzle ORM, SQL migrations
- **Authentication:** Email/password API, scrypt password hashes, signed JWT cookies, refresh-session records in PostgreSQL
- **Generative AI:** Google Gemini via `@google/generative-ai`
- **Environmental data:** Open-Meteo and OpenStreetMap Nominatim

## Run locally

### Requirements

- Node.js compatible with the installed Next.js version
- npm
- A PostgreSQL database for server-side account and profile persistence
- A Google Gemini API key for live AI chat and recommendations

### Install and configure

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the values:

   ```sh
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`.

3. Set these required server environment variables:

   - `DATABASE_URL`: PostgreSQL connection string.
   - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: two different, random secrets of at least 32 characters.
   - `GEMINI_API_KEY`: required for Gemini features.

   `NEXT_PUBLIC_APP_URL` should be set to the app's origin in each deployment environment. `GEMINI_MODEL` is optional and defaults to `gemini-2.0-flash`. Keep private keys and the database URL out of `NEXT_PUBLIC_*` variables and out of source control.

4. Apply database migrations:

   ```sh
   npm run db:migrate
   ```

5. Start the development server:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

Add `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `GEMINI_API_KEY` to the Vercel project's environment variables for Production (and Preview if needed). Set `NEXT_PUBLIC_APP_URL` to the deployed origin, apply database migrations to the same database referenced by `DATABASE_URL`, then redeploy. The repository's `vercel.json` redirects dashboard requests to sign-in when both session cookies are absent; Next.js handles the application routes.

## Validation commands

```sh
npm run lint
npm test
npm run build
```

## Assumptions and limitations

- Open-Meteo air-quality results are modelled estimates, not readings from a physical monitor at the user's exact location. Data availability, spatial resolution, and freshness can vary.
- New Delhi is the initial fallback location until the user chooses another location or shares geolocation.
- CPCB AQI values are calculated from available PM2.5 and PM10 data; missing upstream values can affect the result.
- Personalized guidance depends on the environmental data and household information available for the request. Users may leave household details incomplete.
- Gemini output is generated content and may be incomplete or incorrect. Guidance is for general environmental awareness, not diagnosis or treatment; users should follow local authorities and qualified health professionals.
- Open-Meteo endpoints do not require an API key for the configured use. Gemini features require a valid API key.
- The project uses PostgreSQL for server-side account/profile storage. A correctly configured database URL and applied migrations are required; local browser storage is not a replacement for the account database.

## Security and privacy notes

- Passwords are stored as scrypt-derived hashes; session cookies are HTTP-only and use secure transport in production.
- Validate and keep database credentials, JWT secrets, and Gemini keys private. Never commit `.env.local`.
- Authentication and profile endpoints validate request payloads and apply application-level rate limits. The current in-memory rate limiter is per running server instance and is not a shared distributed rate-limit store.
- Users can delete their account and associated persisted data from settings.

## Repository structure

```text
src/
  app/                    Next.js pages and API route handlers
  components/             Dashboard, assistant, charts, profile, and UI
  db/                     Drizzle schema and SQL migrations
  hooks/                  Browser location and environmental data hooks
  lib/                    AI, auth, database, validation, RAG, and state
  services/               Air quality, weather, location, and forecast logic
  types/                  Shared TypeScript types
```

## Challenge submission checklist

- [ ] Set the GitHub repository visibility to public.
- [ ] Keep a single branch for the submission.
- [ ] Confirm the repository is under the challenge's 10 MB limit.
- [ ] Include the public repository URL and deployed application URL in the submission.
- [ ] Describe the selected vertical, persona, approach, logic, and assumptions in the submission form.
- [ ] Publish the required LinkedIn post and paste its URL into the form.

## Disclaimer

AeroPulse AI provides informational environmental estimates and AI-generated guidance. It is not a medical device and does not replace official air-quality advisories or professional medical advice.
