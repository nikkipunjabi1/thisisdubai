'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSession,
  isValidAdminPassword,
  verifyAdminSession,
} from '@/lib/admin-session';
import { signShareToken, DEFAULT_TTL_SECONDS } from '@/lib/preview-token';
import { isLocale, DEFAULT_LOCALE, splitLocale } from '@/lib/i18n';

/**
 * Server actions behind the preview-link admin UI (Phase 4).
 *
 * These replace the Phase 2/3 curl flow. The `/api/preview/share` route stays as the
 * machine-facing entry point (CI, scripts); this is the human one.
 *
 * Every action re-checks the session cookie itself. A server action is a POST endpoint
 * like any other, so "the page wouldn't render the form without a session" is not
 * access control.
 */

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  if (!password) return { error: 'Enter the admin secret.' };

  if (!process.env.PREVIEW_ADMIN_SECRET || !process.env.PREVIEW_SIGNING_SECRET) {
    return { error: 'Server is missing PREVIEW_ADMIN_SECRET / PREVIEW_SIGNING_SECRET.' };
  }
  // One generic message for a wrong secret: never confirm whether a guess was close,
  // long enough, or whether the account "exists".
  if (!isValidAdminPassword(password)) return { error: 'That secret is not correct.' };

  (await cookies()).set(ADMIN_SESSION_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // an admin tool is never reached by cross-site navigation
    path: '/admin',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  revalidatePath('/admin/preview');
  return {};
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: ADMIN_SESSION_COOKIE, path: '/admin' });
  revalidatePath('/admin/preview');
}

export type GenerateState = {
  url?: string;
  expiresAt?: string;
  label?: string;
  error?: string;
};

/** TTL choices offered in the UI, in seconds. Anything else is rejected. */
const TTL_CHOICES = new Set([
  24 * 60 * 60,
  7 * 24 * 60 * 60,
  30 * 24 * 60 * 60,
]);

export async function generateLink(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(session)) return { error: 'Your session expired. Sign in again.' };

  const key = String(formData.get('key') ?? '').trim();
  if (!key) return { error: 'A content key is required.' };

  const rawLocale = String(formData.get('locale') ?? '').trim();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // `url.default` is the CMS path, which already carries the `/ar` prefix for non-default
  // locales. The share token wants the LOCALE-NEUTRAL path, because the consuming route
  // re-applies the prefix from the token's locale — passing `/ar/x` through unchanged
  // would redirect to `/ar/ar/x`.
  const rawPath = String(formData.get('path') ?? '').trim();
  const path = rawPath ? splitLocale(rawPath).path : undefined;

  const version = String(formData.get('version') ?? 'latest').trim() || 'latest';

  const ttlRaw = Number(formData.get('ttl'));
  const ttl = TTL_CHOICES.has(ttlRaw) ? ttlRaw : DEFAULT_TTL_SECONDS;

  let token: string;
  try {
    token = signShareToken({ key, locale, version, path }, ttl);
  } catch {
    return { error: 'PREVIEW_SIGNING_SECRET is not configured, so links cannot be signed.' };
  }

  // Prefer the deployed host so a link generated locally is still shareable; fall back to
  // the request's own origin.
  const configured = process.env.APPLICATION_HOST?.replace(/\/$/, '');
  const h = await headers();
  const origin = configured || `https://${h.get('host') ?? 'localhost:3000'}`;

  return {
    url: `${origin}/preview/share?token=${encodeURIComponent(token)}`,
    expiresAt: new Date((Math.floor(Date.now() / 1000) + ttl) * 1000).toISOString(),
    label: String(formData.get('label') ?? '').trim() || path || key,
  };
}
