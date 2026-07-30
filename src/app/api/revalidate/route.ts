import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { CACHE_TAGS } from '@/lib/cache';

/**
 * On-demand cache revalidation, called by the Optimizely CMS/Graph publish webhook.
 *
 * Our Graph reads are cached across requests (src/lib/cache.ts) with a short TTL, so
 * published changes otherwise only appear after that window. This endpoint drops the
 * cached content the moment something is published, making the site instant AND fresh
 * — so GRAPH_CACHE_SECONDS can be raised without authors waiting.
 *
 * Config in the CMS: add a publish/content webhook pointing at
 *   https://<host>/api/revalidate?secret=<REVALIDATE_SECRET>
 * (the secret can also travel as an `x-revalidate-secret` header). Optionally scope a
 * call with `?tag=cms-settings` to drop only settings; the default drops both content
 * and settings, which is the safe choice for an arbitrary publish.
 *
 * Auth: a shared secret, compared in constant time. If REVALIDATE_SECRET is unset the
 * endpoint refuses to run (fail closed) rather than allowing anonymous cache busting.
 */

const ALL_TAGS = Object.values(CACHE_TAGS);

function authorized(req: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false; // fail closed: no secret configured → no access
  const provided = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-revalidate-secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function revalidate(req: NextRequest) {
  const tagParam = req.nextUrl.searchParams.get('tag');
  const tags = tagParam
    ? tagParam.split(',').map((t) => t.trim()).filter((t) => (ALL_TAGS as string[]).includes(t))
    : ALL_TAGS;
  if (!tags.length) {
    return NextResponse.json({ revalidated: false, error: `unknown tag; valid: ${ALL_TAGS.join(', ')}` }, { status: 400 });
  }
  // 'max' purges ALL cached data for the tag regardless of cache-life profile — the
  // right choice for an arbitrary publish. (Next 16 requires this second argument;
  // omitting it is deprecated. updateTag isn't usable here — it's Server-Action-only.)
  for (const tag of tags) revalidateTag(tag, 'max');
  return NextResponse.json({ revalidated: true, tags });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ revalidated: false, error: 'unauthorized' }, { status: 401 });
  return revalidate(req);
}

// GET is allowed too, so the webhook works whether it sends GET or POST, and so a
// human can trigger a manual refresh. Still gated by the same secret.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ revalidated: false, error: 'unauthorized' }, { status: 401 });
  return revalidate(req);
}
