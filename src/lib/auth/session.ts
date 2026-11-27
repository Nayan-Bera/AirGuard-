import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAuthCookieOptions,
  getTokensFromCookies,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';
import {
  findRefreshToken,
  findUserById,
  revokeRefreshToken,
  saveRefreshToken,
} from '@/lib/auth/user-store';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const ACCESS_MAX_AGE_SEC = 15 * 60; // 15 minutes
const REFRESH_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

export async function issueSessionCookies(
  response: NextResponse,
  user: AuthUser
): Promise<void> {
  const jti = crypto.randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user.id, jti),
  ]);

  await saveRefreshToken({
    jti,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_MAX_AGE_SEC * 1000,
  });

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, getAuthCookieOptions(ACCESS_MAX_AGE_SEC));
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getAuthCookieOptions(REFRESH_MAX_AGE_SEC));
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', getAuthCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', getAuthCookieOptions(0));
}

/**
 * Resolves the current authenticated user from the access token cookie.
 * If the access token is missing/expired, attempts validation via refresh token.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<{
  user: AuthUser | null;
  refreshed: boolean;
}> {
  const { accessToken, refreshToken } = await getTokensFromCookies(request);

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        },
        refreshed: false,
      };
    }
  }

  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      const storedToken = await findRefreshToken(refreshPayload.jti);
      if (storedToken && storedToken.userId === refreshPayload.sub) {
        const user = await findUserById(refreshPayload.sub);
        if (user) {
          return {
            user: { id: user.id, email: user.email, name: user.name },
            refreshed: true,
          };
        }
      }
    }
  }

  return { user: null, refreshed: false };
}

export async function rotateRefreshSession(
  oldRefreshToken: string,
  response: NextResponse
): Promise<AuthUser | null> {
  const payload = await verifyRefreshToken(oldRefreshToken);
  if (!payload) return null;

  const stored = await findRefreshToken(payload.jti);
  if (!stored || stored.userId !== payload.sub) return null;

  const user = await findUserById(payload.sub);
  if (!user) return null;

  await revokeRefreshToken(payload.jti);
  const authUser: AuthUser = { id: user.id, email: user.email, name: user.name };
  await issueSessionCookies(response, authUser);
  return authUser;
}
