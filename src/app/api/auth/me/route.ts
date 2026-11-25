import { NextResponse } from 'next/server';
import { getTokensFromCookies } from '@/lib/auth/jwt';
import { getAuthenticatedUser, rotateRefreshSession } from '@/lib/auth/session';
import { handleUnexpectedRouteError } from '@/lib/api/route-utils';

export async function GET() {
  try {
    const { user, refreshed } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const response = NextResponse.json({ authenticated: true, user }, { status: 200 });

    if (refreshed) {
      const { refreshToken } = await getTokensFromCookies();
      if (refreshToken) {
        await rotateRefreshSession(refreshToken, response);
      }
    }

    return response;
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/auth/me', error);
  }
}
