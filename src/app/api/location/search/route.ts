import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchLocations } from '@/services/location';
import {
  createValidationErrorResponse,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import type { GeoCoordinates } from '@/types';

const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query "q" is required')
    .max(100, 'Search query must be 100 characters or fewer'),
});

export interface LocationSearchResultItem {
  name: string;
  state: string;
  country: string;
  coordinates: GeoCoordinates;
}

export interface LocationSearchApiResponse {
  query: string;
  results: LocationSearchResultItem[];
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get('q') ?? '';
    const parsed = searchQuerySchema.safeParse({ q: rawQuery });

    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error, 'Invalid search query');
    }

    const results = await searchLocations(parsed.data.q);

    const payload: LocationSearchApiResponse = {
      query: parsed.data.q,
      results,
      count: results.length,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/location/search', error);
  }
}
