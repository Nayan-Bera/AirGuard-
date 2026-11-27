import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleUnexpectedRouteError } from '@/lib/api/route-utils';
import { checkRateLimit } from '@/lib/api/rate-limit';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API error responses', () => {
  it('does not expose internal error messages to clients', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = handleUnexpectedRouteError(
      'POST /api/example',
      new Error('database password=private-value')
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.message).toBe('An unexpected server error occurred');
    expect(JSON.stringify(body)).not.toContain('private-value');
  });

  it('returns a safe upstream error response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = handleUnexpectedRouteError(
      'GET /api/example',
      new Error('External API error: private upstream detail')
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.message).toBe('An upstream service request failed');
    expect(JSON.stringify(body)).not.toContain('private upstream detail');
  });
});

describe('API rate limiting', () => {
  it('blocks requests after the configured limit', () => {
    const key = `test:${crypto.randomUUID()}`;

    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);

    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
