import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Prefer AVIF (~20–30% smaller than WebP), fall back to WebP. Next serves the
    // best format the browser's Accept header allows and caches the result, so the
    // extra AVIF encode cost is paid once per size, not per request.
    formats: ['image/avif', 'image/webp'],
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
