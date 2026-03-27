import type { Metadata } from "next";
import HeroSection from '@/components/home/hero-section';
import CompactIntro from '@/components/home/compact-intro';
import AmenitiesGallery from '@/components/home/amenities-gallery';
import RoomShowcase from '@/components/home/room-showcase';
import DiningHighlight from '@/components/home/dining-highlight';
import ExperiencesStrip from '@/components/home/experiences-strip';
import BrandMarquee from '@/components/home/brand-marquee';
import EditorialStory from '@/components/home/editorial-story';
import { getHeroMedia } from '@/app/admin/media/actions';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha, Kerala",
  description: "Book your luxury stay at Olivia International Hotel, a 5-star lakeside retreat in Alappuzha, Kerala. Premium rooms, spa, fine dining & backwater experiences.",
  openGraph: {
    title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha",
    description: "Book your luxury stay at Olivia International Hotel, a 5-star lakeside retreat in Alappuzha, Kerala. Premium rooms, spa, fine dining & backwater experiences.",
    type: "website",
    url: "https://oliviaalleppey.com",
    siteName: "Olivia International Hotel",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Olivia International Hotel - Luxury in Alappuzha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha",
    description: "Book your luxury stay at Olivia International Hotel.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://oliviaalleppey.com",
  },
};

export default async function Home() {
  const heroMedia = await getHeroMedia();

  return (
    <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
      {/* Cinematic Hero with Floating Search */}
      <HeroSection initialMedia={heroMedia} />

      {/* Compact Intro */}
      <CompactIntro />

      {/* Rooms Showcase */}
      <RoomShowcase />

      {/* Kerala Experiences — horizontal scroll cards */}
      <ExperiencesStrip />

      {/* Featured Amenities (Pool, Gym, Spa) */}
      <AmenitiesGallery />

      {/* Brand Stats + Gold Ticker */}
      <BrandMarquee />

      {/* Culinary Excellence */}
      <DiningHighlight />

      {/* Editorial Story */}
      <EditorialStory />

    </main>
  );
}
