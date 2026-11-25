import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { appConfig } from '@/lib/config/env';

export const ACCESS_TOKEN_COOKIE = 'uaqa_access_token';
export const REFRESH_TOKEN_COOKIE = 'uaqa_refresh_token';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  type: 'access';
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

function getSecretKey(secret: string, label: string): Uint8Array {
  if (!secret || secret.length < 16) {
    throw new Error(`${label} is not configured. Set it in .env.local`);
  }
  return new TextEncoder().encode(secret);
}

// --- Password Hashing (scrypt + timingSafeEqual) ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(keyBuf, derivedBuf);
}

// --- JWT Sign & Verify ---

export async function signAccessToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const key = getSecretKey(appConfig.auth.accessSecret, 'JWT_ACCESS_SECRET');
  return new SignJWT({
    email: user.email,
    name: user.name,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(appConfig.auth.accessExpiresIn)
    .sign(key);
}

export async function signRefreshToken(userId: string, jti: string): Promise<string> {
  const key = getSecretKey(appConfig.auth.refreshSecret, 'JWT_REFRESH_SECRET');
  return new SignJWT({
    jti,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(appConfig.auth.refreshExpiresIn)
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const key = getSecretKey(appConfig.auth.accessSecret, 'JWT_ACCESS_SECRET');
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== 'access' || !payload.sub) return null;
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const key = getSecretKey(appConfig.auth.refreshSecret, 'JWT_REFRESH_SECRET');
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== 'refresh' || !payload.sub || !payload.jti) return null;
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// --- Cookie Helpers ---

export function getAuthCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function getTokensFromCookies(): Promise<{
  accessToken: string | undefined;
  refreshToken: string | undefined;
}> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}
