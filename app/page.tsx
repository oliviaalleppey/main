import type { Metadata } from "next";
import MasqueradeHero from '@/components/home/masquerade-hero';
import MasqueradeIntro from '@/components/home/masquerade-intro';
import MasqueradeHeaderToggle from '@/components/home/masquerade-header-toggle';
import HeroSection from '@/components/home/hero-section';
import CompactIntro from '@/components/home/compact-intro';
import AmenitiesGallery from '@/components/home/amenities-gallery';
import RoomShowcase from '@/components/home/room-showcase';
import DiningHighlight from '@/components/home/dining-highlight';
import ExperiencesStrip from '@/components/home/experiences-strip';
import BrandMarquee from '@/components/home/brand-marquee';
import EditorialStory from '@/components/home/editorial-story';
import { getHeroMedia, getHomeHeroImages } from '@/app/admin/media/actions';
import { altText, pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Olivia Alleppey - Luxury 5-Star Hotel in Alappuzha, Kerala",
  description:
    "Book a luxury stay at Olivia Alleppey, a 5-star backwater retreat in Alappuzha, Kerala. Lake-view rooms and suites, spa, fine dining and backwater cruises.",
  path: "/",
});

export default async function Home() {
  const [heroMedia, homeHeroImages] = await Promise.all([
    getHeroMedia(),
    getHomeHeroImages(),
  ]);
  const heroSlides = homeHeroImages.map(img => ({ url: img.imageUrl, alt: altText(img.title, 'Olivia Alleppey, luxury 5-star hotel on the Alappuzha backwaters') }));

  return (
    <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
      {/* Curtain-raiser, plays once per visit */}
      <MasqueradeIntro />

      {/* Header hidden while the opener is on screen */}
      <MasqueradeHeaderToggle />

      {/* The Grand Masquerade, 31 December: full-screen event opener */}
      <MasqueradeHero />

      {/* Cinematic Hero with Floating Search */}
      <HeroSection initialMedia={heroMedia} heroSlides={heroSlides} />

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
