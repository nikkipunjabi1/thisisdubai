'use server';

import { headers } from 'next/headers';
import { verifyCmsPreviewToken } from '@/lib/cms-preview-token';
import { signShareToken, DEFAULT_TTL_SECONDS } from '@/lib/preview-token';
import { isLocale, DEFAULT_LOCALE, splitLocale } from '@/lib/i18n';

/**
 * Mint a stakeholder share link from inside the CMS editor.
 *
 * Authenticated by the CMS's own `preview_token`, which the editor already put in the
 * iframe URL. That is the entire point: the author is already signed into the CMS, so
 * they should not have to sign into anything of ours. There is no admin page and no
 * shared password in this path.
 *
 * `/api/preview/share` remains the machine-facing route for CI and scripts, guarded by
 * PREVIEW_ADMIN_SECRET.
 */

export type ShareLinkState = {
  url?: string;
  expiresAt?: string;
  error?: string;
};

/** Lifetimes offered in the panel, in seconds. Anything else falls back to the default. */
const TTL_CHOICES = new Set([24 * 60 * 60, 7 * 24 * 60 * 60, 30 * 24 * 60 * 60]);

export async function createShareLink(
  _prev: ShareLinkState,
  formData: FormData,
): Promise<ShareLinkState> {
  const previewToken = String(formData.get('previewToken') ?? '');
  if (!(await verifyCmsPreviewToken(previewToken))) {
    return {
      error:
        'The CMS preview session has expired. Save or reload the page in the editor, then try again.',
    };
  }

  const key = String(formData.get('key') ?? '').trim();
  if (!key) return { error: 'This content has no key to share.' };

  const rawLocale = String(formData.get('locale') ?? '').trim();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // The CMS path already carries the `/ar` segment for non-default locales, and the
  // consuming route re-applies it from the token's locale, so strip it here or the
  // reviewer lands on `/ar/ar/...`.
  const rawPath = String(formData.get('path') ?? '').trim();
  const path = rawPath ? splitLocale(rawPath).path : undefined;

  // 'latest' keeps tracking edits made after the link is sent, which is what authors
  // actually want; a pinned version is the frozen-snapshot case.
  const version = String(formData.get('version') ?? 'latest').trim() || 'latest';

  const ttlRaw = Number(formData.get('ttl'));
  const ttl = TTL_CHOICES.has(ttlRaw) ? ttlRaw : DEFAULT_TTL_SECONDS;

  let token: string;
  try {
    token = signShareToken({ key, locale, version, path }, ttl);
  } catch {
    return { error: 'PREVIEW_SIGNING_SECRET is not configured, so links cannot be signed.' };
  }

  // Prefer the deployed host: a link minted while the editor points at a local dev server
  // is useless to a reviewer otherwise.
  const configured = process.env.APPLICATION_HOST?.replace(/\/$/, '');
  const h = await headers();
  const origin = configured || `https://${h.get('host') ?? 'localhost:3000'}`;

  return {
    url: `${origin}/preview/share?token=${encodeURIComponent(token)}`,
    expiresAt: new Date((Math.floor(Date.now() / 1000) + ttl) * 1000).toISOString(),
  };
}
