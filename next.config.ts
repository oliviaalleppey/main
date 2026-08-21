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
      // /experiences was linked from the main nav, the footer and the homepage
      // but never built, so every page carried links to a 404. /discover covers
      // the same ground. Note fragments are client-side, so /experiences#yoga
      // lands on /discover#yoga — those anchors do not exist there yet.
      { source: '/experiences', destination: '/discover', permanent: true },
      { source: '/book', destination: '/book/search', permanent: false },
      // The printed menu is handed out as oliviaalleppey.com/menu (QR codes,
      // WhatsApp replies), but only /menu.pdf existed, so the short form 404'd.
      // Temporary so we can later swap it for a real HTML page at /menu.
      { source: '/menu', destination: '/menu.pdf', permanent: false },
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
