import type { Metadata } from "next";
import HeroSection from '@/components/home/hero-section';
import CompactIntro from '@/components/home/compact-intro';
import AmenitiesGallery from '@/components/home/amenities-gallery';
import RoomShowcase from '@/components/home/room-showcase';
import DiningHighlight from '@/components/home/dining-highlight';
import ExperiencesStrip from '@/components/home/experiences-strip';
import BrandMarquee from '@/components/home/brand-marquee';
import EditorialStory from '@/components/home/editorial-story';
import { getHeroMedia, getHomeHeroImages } from '@/app/admin/media/actions';
import NewYearPopup from '@/components/home/new-year-popup';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import { PARTY_END } from '@/lib/config/party-popup';
import { altText, pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Olivia Alleppey - Luxury 5-Star Hotel in Alappuzha, Kerala",
  description:
    "Book a luxury stay at Olivia Alleppey, a 5-star backwater retreat in Alappuzha, Kerala. Lake-view rooms and suites, spa, fine dining and backwater cruises.",
  path: "/",
});

export default async function Home() {
  const [heroMedia, homeHeroImages, partyPopup] = await Promise.all([
    getHeroMedia(),
    getHomeHeroImages(),
    getPartyPopup(),
  ]);
  const showPartyPopup = partyPopup.enabled && Date.now() < new Date(PARTY_END).getTime();
  const heroSlides = homeHeroImages.map(img => ({ url: img.imageUrl, alt: altText(img.title, 'Olivia Alleppey, luxury 5-star hotel on the Alappuzha backwaters') }));

  return (
    <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
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

      {showPartyPopup && (
        <NewYearPopup content={partyPopup} />
      )}

    </main>
  );
}
