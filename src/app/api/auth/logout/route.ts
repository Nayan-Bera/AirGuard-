import { NextResponse } from 'next/server';
import { getTokensFromCookies, verifyRefreshToken } from '@/lib/auth/jwt';
import { clearSessionCookies } from '@/lib/auth/session';
import { revokeRefreshToken } from '@/lib/auth/user-store';

export async function POST() {
  const { refreshToken } = await getTokensFromCookies();
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload?.jti) {
      await revokeRefreshToken(payload.jti);
    }
  }

  const response = NextResponse.json({ loggedOut: true }, { status: 200 });
  clearSessionCookies(response);
  return response;
}
