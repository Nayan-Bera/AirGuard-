import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/jwt';
import { findUserByEmail } from '@/lib/auth/user-store';
import { issueSessionCookies } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { parseJsonBody, createErrorResponse, handleUnexpectedRouteError } from '@/lib/api/route-utils';

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'local';
    const rl = checkRateLimit(`auth:login:${ip}`, 15, 60_000);
    if (!rl.allowed) {
      return createErrorResponse(429, 'RATE_LIMITED', 'Too many login attempts. Please wait a minute.');
    }

    const bodyResult = await parseJsonBody(request, loginSchema);
    if (!bodyResult.success) return bodyResult.response;

    const { email, password } = bodyResult.data;
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const response = NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 }
    );

    await issueSessionCookies(response, {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return response;
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/auth/login', error);
  }
}
