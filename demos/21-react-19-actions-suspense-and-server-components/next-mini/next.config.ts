import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // DummyJSON serves the product thumbnails. next/image refuses remote hosts it
  // has not been told about — on purpose, so a content editor cannot turn your
  // image optimiser into an open proxy.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.dummyjson.com' }],
  },
};

export default nextConfig;
