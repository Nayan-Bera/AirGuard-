import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUpcomingFestivals,
  getFestivalWarnings,
  getSeasonalRisk,
} from '@/services/festivals';
import {
  createValidationErrorResponse,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import type { FestivalEvent } from '@/types';

const festivalsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(60),
  region: z.string().trim().min(1).max(50).optional(),
});

export interface FestivalsApiResponse {
  festivals: FestivalEvent[];
  warnings: ReturnType<typeof getFestivalWarnings>;
  seasonalRisk: ReturnType<typeof getSeasonalRisk>;
  days: number;
  fetchedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawDays = searchParams.get('days');
    const rawRegion = searchParams.get('region');

    const parsed = festivalsQuerySchema.safeParse({
      days: rawDays ?? undefined,
      region: rawRegion?.trim() ? rawRegion : undefined,
    });

    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error, 'Invalid query parameters');
    }

    const { days, region } = parsed.data;
    const currentMonth = new Date().getMonth() + 1;

    const festivals = getUpcomingFestivals(days, region);
    const warnings = getFestivalWarnings(days);
    const seasonalRisk = getSeasonalRisk(currentMonth);

    const payload: FestivalsApiResponse = {
      festivals,
      warnings,
      seasonalRisk,
      days,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/festivals', error);
  }
}
