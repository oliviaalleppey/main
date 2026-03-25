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
