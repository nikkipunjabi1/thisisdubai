import type { NextConfig } from 'next';

// Who may embed this app in an <iframe>. The Optimizely CMS editor iframes our `/preview`
// route for live / on-page editing, so it must be allowed; everyone else is denied, which
// closes the clickjacking gap flagged against the official live-preview guidance.
//
// `*.optimizely.com` covers the editor across environments (prod + cmstest); we also add the
// exact configured CMS origin in case it's ever a custom domain. We deliberately do NOT send
// `X-Frame-Options: SAMEORIGIN` — the CMS is a different origin, so SAMEORIGIN would BREAK the
// editor preview, and X-Frame-Options can't express "self + another origin". Modern browsers
// honour CSP `frame-ancestors`, which can.
const cmsOrigin = (() => {
  try {
    return process.env.OPTIMIZELY_CMS_URL ? new URL(process.env.OPTIMIZELY_CMS_URL).origin : '';
  } catch {
    return '';
  }
})();
const frameAncestors = ["'self'", 'https://*.optimizely.com', cmsOrigin]
  .filter((v, i, a) => v && a.indexOf(v) === i)
  .join(' ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route: the public site should never be framed by third parties,
        // and the CMS editor frames our preview URLs.
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` },
        ],
      },
    ];
  },
  images: {
    // Prefer AVIF (~20–30% smaller than WebP), fall back to WebP. Next serves the
    // best format the browser's Accept header allows and caches the result, so the
    // extra AVIF encode cost is paid once per size, not per request.
    formats: ['image/avif', 'image/webp'],
    // Freshness for DAM images. CMP URLs are keyed on the ASSET ID, so an in-place
    // crop/edit in CMP reuses the SAME URL — and Next's optimizer would otherwise
    // serve its cached variant for the DEFAULT 4h (14400s), ignoring that CMP sends
    // `Cache-Control: no-store` + a changing ETag. 60s means an edited image is
    // re-fetched within a minute; because Next revalidates against CMP's ETag it only
    // RE-ENCODES when the image actually changed, so this is cheap for unchanged ones.
    // (For instant pickup instead, publish the crop as a NEW asset → new URL.)
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.optimizely.com', // or add cms.optimizely.com, cmp.optimizely.com, *.cmstest.optimizely.com
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
