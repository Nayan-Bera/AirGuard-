import { NextResponse } from 'next/server';
import { getTokensFromCookies } from '@/lib/auth/jwt';
import { clearSessionCookies, rotateRefreshSession } from '@/lib/auth/session';
import { createErrorResponse, handleUnexpectedRouteError } from '@/lib/api/route-utils';

export async function POST() {
  try {
    const { refreshToken } = await getTokensFromCookies();
    if (!refreshToken) {
      return createErrorResponse(401, 'NO_REFRESH_TOKEN', 'Refresh token is missing.');
    }

    const response = NextResponse.json({ refreshed: true }, { status: 200 });
    const user = await rotateRefreshSession(refreshToken, response);

    if (!user) {
      const failResponse = createErrorResponse(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.');
      clearSessionCookies(failResponse);
      return failResponse;
    }

    return NextResponse.json(
      { refreshed: true, user },
      { status: 200, headers: response.headers }
    );
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/auth/refresh', error);
  }
}
