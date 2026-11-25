import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { locationSchema } from '@/lib/validation/schemas';
import type { GeoCoordinates } from '@/types';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
    timestamp: string;
  };
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Array<{ path: string; message: string }>
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

export function createValidationErrorResponse(
  error: z.ZodError,
  message = 'Invalid request parameters'
): NextResponse<ApiErrorBody> {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));
  return createErrorResponse(400, 'VALIDATION_ERROR', message, details);
}

export function parseCoordinatesFromQuery(
  searchParams: URLSearchParams
): { success: true; data: GeoCoordinates } | { success: false; response: NextResponse<ApiErrorBody> } {
  const latRaw = searchParams.get('lat');
  const lonRaw = searchParams.get('lon');

  if (!latRaw?.trim() || !lonRaw?.trim()) {
    return {
      success: false,
      response: createErrorResponse(
        400,
        'MISSING_COORDINATES',
        'Both "lat" and "lon" query parameters are required'
      ),
    };
  }

  const parsed = locationSchema.safeParse({
    latitude: Number(latRaw),
    longitude: Number(lonRaw),
  });

  if (!parsed.success) {
    return {
      success: false,
      response: createValidationErrorResponse(parsed.error, 'Invalid latitude or longitude query parameters'),
    };
  }

  return {
    success: true,
    data: {
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    },
  };
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiErrorBody> }> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      success: false,
      response: createErrorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON'),
    };
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      success: false,
      response: createValidationErrorResponse(parsed.error, 'Invalid request body'),
    };
  }

  return { success: true, data: parsed.data };
}

export function handleUnexpectedRouteError(
  context: string,
  error: unknown
): NextResponse<ApiErrorBody> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    (error as { digest?: string }).digest === 'NEXT_PRERENDER_INTERRUPTED'
  ) {
    throw error;
  }

  console.error(`[API Error] ${context}:`, error);

  if (error instanceof z.ZodError) {
    return createErrorResponse(502, 'UPSTREAM_VALIDATION_ERROR', 'Upstream response failed validation');
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  if (message.includes('GEMINI_API_KEY')) {
    return createErrorResponse(503, 'SERVICE_UNAVAILABLE', 'AI service is not configured');
  }

  if (message.includes('API error:')) {
    return createErrorResponse(502, 'UPSTREAM_ERROR', message);
  }

  return createErrorResponse(500, 'INTERNAL_ERROR', message);
}
