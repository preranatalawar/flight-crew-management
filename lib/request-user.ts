import type { NextRequest } from 'next/server';

/** Set by `proxy.ts` when the `auth_token` cookie is valid. */
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}
