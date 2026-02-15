'use client';

import RosewoodHeader from '@/components/layout/rosewood-header';
import HeroSection from '@/components/home/hero-section';
import CompactIntro from '@/components/home/compact-intro';
// import CompactFeatures from '@/components/home/compact-features'; // Removed in favor of detailed sections
import AmenitiesGallery from '@/components/home/amenities-gallery';
import RoomShowcase from '@/components/home/room-showcase';
import DiningHighlight from '@/components/home/dining-highlight';
import PhotoCarousel from '@/components/home/photo-carousel';
import RosewoodFooter from '@/components/layout/rosewood-footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FBFBF9] font-sans">
      <RosewoodHeader />

      {/* Cinematic Hero with Floating Search */}
      <HeroSection />

      {/* Compact Intro */}
      <CompactIntro />

      {/* Rooms Showcase */}
      <RoomShowcase />

      {/* Featured Amenities (Pool, Gym, Spa) */}
      <AmenitiesGallery />

      {/* Culinary Excellence */}
      <DiningHighlight />

      {/* Photo Grid (Soho House Style) */}
      <section className="bg-white py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-gray-900 tracking-wide">VISUAL STORIES</h2>
        </div>
        <PhotoCarousel />
      </section>

      {/* Footer */}
      <RosewoodFooter />
    </main>
  );
}
