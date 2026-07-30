import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
