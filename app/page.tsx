'use client';

import HeroSection from '@/components/home/hero-section';
import CompactIntro from '@/components/home/compact-intro';
import AmenitiesGallery from '@/components/home/amenities-gallery';
import RoomShowcase from '@/components/home/room-showcase';
import DiningHighlight from '@/components/home/dining-highlight';
import PhotoCarousel from '@/components/home/photo-carousel';
import ExperiencesStrip from '@/components/home/experiences-strip';
import BrandMarquee from '@/components/home/brand-marquee';
import EditorialStory from '@/components/home/editorial-story';
import Testimonials from '@/components/home/testimonials';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FBFBF9] font-sans">
      {/* Cinematic Hero with Floating Search */}
      <HeroSection />

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

      {/* Guest Testimonials */}
      <Testimonials />

      {/* Photo Grid (Soho House Style) */}
      <section className="bg-white py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-gray-900 tracking-wide">VISUAL STORIES</h2>
        </div>
        <PhotoCarousel />
      </section>
    </main>
  );
}

