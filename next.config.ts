import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async redirects() {
    return [
      // Consolidate the three overlapping events routes onto /conference-events
      // so link equity and crawl budget land on a single canonical hub.
      { source: '/conference-and-events', destination: '/conference-events', permanent: true },
      { source: '/conference-and-events/:slug', destination: '/conference-events/:slug', permanent: true },
      { source: '/events', destination: '/conference-events', permanent: true },
      // These were soft redirects in page components; make them real 301s so
      // crawlers see the permanent move rather than a 200 that bounces.
      { source: '/accommodation', destination: '/rooms', permanent: true },
      { source: '/policies', destination: '/refund-policy', permanent: true },
      { source: '/book', destination: '/book/search', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
