import 'server-only';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cloudflare Access -> Supabase identity bridge.
 *
 * Reads the Cf-Access-Jwt-Assertion header set by Cloudflare Access at the
 * edge, validates it (in production), extracts the email, and ensures a
 * matching Supabase user exists.
 *
 * In local dev (LOCAL_DEV=1), Access is bypassed and we rely on Supabase Auth
 * sign-in directly.
 *
 * Implementation sketch only - JWT verification using @cloudflare/workers-types
 * or jose to be wired before production.
 */

export interface AccessIdentity {
  email: string;
  sub: string;
}

export async function getAccessIdentity(): Promise<AccessIdentity | null> {
  if (process.env.LOCAL_DEV === '1' && process.env.NODE_ENV !== 'production') {
    return null;
  }

  const h = await headers();
  const jwt = h.get('cf-access-jwt-assertion');
  if (!jwt) return null;

  // TODO: verify JWT against Cloudflare Access JWKS (https://${TEAM_DOMAIN}/cdn-cgi/access/certs)
  //       and the expected audience (CF_ACCESS_AUD).
  //       Reject if verification fails. Do not trust unverified claims.

  // Once verified, return claims:
  // return { email: claims.email, sub: claims.sub };
  return null;
}

/**
 * Ensure a Supabase user exists for the given Access identity.
 * Called on first visit after Access sign-in.
 */
export async function ensureSupabaseUser(identity: AccessIdentity) {
  const admin = createAdminClient();

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === identity.email);
  if (found) return found;

  const { data, error } = await admin.auth.admin.createUser({
    email: identity.email,
    email_confirm: true,
    app_metadata: { provider: 'cloudflare_access' },
  });
  if (error) throw error;
  return data.user;
}
