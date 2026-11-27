import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCookies } from '@/lib/auth/jwt';
import { clearSessionCookies, getAuthenticatedUser, rotateRefreshSession } from '@/lib/auth/session';
import { handleUnexpectedRouteError } from '@/lib/api/route-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, refreshed } = await getAuthenticatedUser(request);
    if (!user) {
      const response = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
      const { accessToken, refreshToken } = await getTokensFromCookies(request);
      if (accessToken || refreshToken) clearSessionCookies(response);
      return response;
    }

    const response = NextResponse.json({ authenticated: true, user }, { status: 200 });

    if (refreshed) {
      const { refreshToken } = await getTokensFromCookies(request);
      if (refreshToken) {
        await rotateRefreshSession(refreshToken, response);
      }
    }

    return response;
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/auth/me', error);
  }
}
