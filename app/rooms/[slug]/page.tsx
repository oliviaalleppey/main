// 'use client'; removed to allow generateMetadata and async component

import React from 'react';

import RoomHero from '@/components/rooms/room-hero';
import StickyBookingBar from '@/components/rooms/sticky-booking-bar';
import RoomContent from '@/components/rooms/room-content';
import RoomFeatures from '@/components/rooms/room-features';
import RoomFAQ from '@/components/rooms/room-faq';
import BookingCTA from '@/components/rooms/booking-cta';
import OffersCarousel from '@/components/rooms/offers-carousel';
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    await ensureRoomTypeMinOccupancyColumn();

    const { slug } = await params;
    const room = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.slug, slug),
    });

    if (!room) return { title: 'Room Not Found' };

    return {
        title: `${room.name} | Olivia Hotel`,
        description: room.description || `Experience luxury in our ${room.name}.`,
    };
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    await ensureRoomTypeMinOccupancyColumn();

    const { slug } = await params;

    const room = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.slug, slug),
    });

    if (!room) {
        notFound();
    }

    // Dynamic images from DB
    const roomImages = room.images && room.images.length > 0
        ? room.images.map((src, index) => ({ id: index + 1, alt: `${room.name} view ${index + 1}`, src }))
        : [
            { id: 1, alt: 'Main room view', src: `/images/rooms/${slug}-1.jpg` },
            { id: 2, alt: 'Bathroom', src: `/images/rooms/${slug}-2.jpg` },
            { id: 3, alt: 'Balcony view', src: `/images/rooms/${slug}-3.jpg` },
            { id: 4, alt: 'Room amenities', src: `/images/rooms/${slug}-4.jpg` },
            { id: 5, alt: 'Room detail', src: `/images/rooms/${slug}-5.jpg` },
        ];

    const details = [
        { label: 'Size', value: `${room.size} sq ft` },
        { label: 'Occupancy', value: `${room.maxGuests} Guests` },
        { label: 'Bed', value: room.bedType || 'King Bed' },
        { label: 'View', value: 'Lake View' }, // Defaulting since view is not in DB schema yet
        { label: 'Check-in', value: '2:00 PM' },
        { label: 'Check-out', value: '11:00 AM' },
    ];

    // Map amenities to features structure expected by AmenitiesGrid
    const features = (room.amenities || []).map(amenity => ({
        icon: '✨', // Default icon
        title: amenity,
        description: 'Premium amenity included'
    }));

    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans selection:bg-[#1C1C1C] selection:text-white pb-40 pt-8">

            {/* Sticky Booking Search Bar */}
            <StickyBookingBar basePrice={room.basePrice} />

            {/* Title Section (Above Grid) */}
            <section className="pt-2 pb-1 px-6 md:px-12 max-w-[1400px] mx-auto">
                <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-[#1C1C1C] mb-1">
                    {room.name}
                </h1>
                <p className="text-lg text-[#1C1C1C]/60 font-light">
                    {room.shortDescription || 'Experience luxury in the heart of Alappuzha'}
                </p>
            </section>

            {/* Hero Grid - Fixed variable name */}
            <RoomHero images={roomImages} />

            {/* Content Blocks */}
            <RoomContent
                title="" // Title is now above grid
                tagline="" // Tagline above grid
                description={room.description || ''}
                details={details}
                amenities={features}
            />

            {/* Room Features Showcase */}
            <RoomFeatures roomType={room.name} />

            {/* Offers Carousel */}
            <OffersCarousel />

            {/* FAQ Section */}
            <RoomFAQ />

            {/* Final Booking CTA */}
            <BookingCTA
                roomName={room.name}
                basePrice={room.basePrice}
                roomSlug={slug}
            />
        </main>
    );
}
