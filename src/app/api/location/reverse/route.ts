import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/services/location';
import {
  parseCoordinatesFromQuery,
  handleUnexpectedRouteError,
} from '@/lib/api/route-utils';
import type { LocationInfo } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const coordsResult = parseCoordinatesFromQuery(request.nextUrl.searchParams);
    if (!coordsResult.success) {
      return coordsResult.response;
    }

    const location: LocationInfo = await reverseGeocode(coordsResult.data);

    return NextResponse.json(location, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/location/reverse', error);
  }
}
