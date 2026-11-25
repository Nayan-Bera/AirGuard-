import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/jwt';
import { createUser, findUserByEmail } from '@/lib/auth/user-store';
import { issueSessionCookies } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { parseJsonBody, createErrorResponse, handleUnexpectedRouteError } from '@/lib/api/route-utils';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Valid email is required').max(160),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'local';
    const rl = checkRateLimit(`auth:register:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return createErrorResponse(429, 'RATE_LIMITED', 'Too many registration attempts. Please try again later.');
    }

    const bodyResult = await parseJsonBody(request, registerSchema);
    if (!bodyResult.success) return bodyResult.response;

    const { name, email, password } = bodyResult.data;
    const existing = await findUserByEmail(email);
    if (existing) {
      return createErrorResponse(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    const user = await createUser({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );

    await issueSessionCookies(response, {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return response;
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/auth/register', error);
  }
}
