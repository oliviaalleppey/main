'use client';

import React, { useState } from 'react';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import { formatCurrency } from '@/lib/services/payment';
import { notFound } from 'next/navigation';

// Mock data - will be replaced with database query
const roomTypesData: Record<string, any> = {
    'balcony-room': {
        name: 'Balcony Room',
        slug: 'balcony-room',
        description: 'Experience luxury with a view. Our Balcony Rooms feature a private balcony overlooking the serene landscapes of Alappuzha, perfect for your morning coffee or evening relaxation. Each room is thoughtfully designed with modern amenities while maintaining a warm, inviting ambiance.',
        shortDescription: 'Entry-level luxury with private balcony and stunning views',
        basePrice: 1500000,
        maxGuests: 2,
        size: 325,
        bedType: 'King or Queen Bed',
        amenities: [
            'Private Balcony',
            'Air Conditioning',
            'LED TV',
            'Mini Bar',
            'Tea/Coffee Maker',
            'Free Wi-Fi',
            'Room Service',
            'Premium Toiletries',
            'Safe Deposit Box',
        ],
    },
    'deluxe-room': {
        name: 'Deluxe Room',
        slug: 'deluxe-room',
        description: 'Indulge in spacious comfort. Our Deluxe Rooms offer enhanced amenities and a more generous layout, designed for guests who appreciate the finer details of luxury hospitality. Perfect for couples or small families seeking extra space and comfort.',
        shortDescription: 'Enhanced amenities with spacious layout and premium bedding',
        basePrice: 2000000,
        maxGuests: 3,
        size: 425,
        bedType: 'King Bed',
        amenities: [
            'Spacious Layout',
            'Premium Bedding',
            'Air Conditioning',
            'LED TV',
            'Mini Bar',
            'Tea/Coffee Maker',
            'Free Wi-Fi',
            'Room Service',
            'Premium Toiletries',
            'Safe Deposit Box',
            'Work Desk',
            'Seating Area',
        ],
    },
    'superior-deluxe-room': {
        name: 'Superior Deluxe Room',
        slug: 'superior-deluxe-room',
        description: 'Elevate your stay with premium furnishings and exclusive amenities. Our Superior Deluxe Rooms combine sophisticated design with exceptional comfort, featuring a separate sitting area and upgraded bathroom amenities for the discerning traveler.',
        shortDescription: 'Premium furnishings with sitting area and luxury amenities',
        basePrice: 2500000,
        maxGuests: 3,
        size: 525,
        bedType: 'King Bed',
        amenities: [
            'Premium Furnishings',
            'Sitting Area',
            'Air Conditioning',
            'LED TV',
            'Mini Bar',
            'Nespresso Machine',
            'Free Wi-Fi',
            '24/7 Room Service',
            'Luxury Toiletries',
            'Safe Deposit Box',
            'Work Desk',
            'Bathrobe & Slippers',
            'Complimentary Newspaper',
        ],
    },
    'suite-room': {
        name: 'Suite Room',
        slug: 'suite-room',
        description: 'The pinnacle of luxury accommodation. Our Suite Rooms feature a separate living area, master bedroom, and premium amenities including a jacuzzi. With butler service and exclusive privileges, experience the ultimate in comfort and sophistication.',
        shortDescription: 'Ultimate luxury with separate living area and butler service',
        basePrice: 3500000,
        maxGuests: 4,
        size: 750,
        bedType: 'King Bed + Sofa Bed',
        amenities: [
            'Separate Living Area',
            'Master Bedroom',
            'Premium Furnishings',
            'Air Conditioning',
            'LED TV (Multiple)',
            'Mini Bar',
            'Nespresso Machine',
            'Free Wi-Fi',
            '24/7 Butler Service',
            'Luxury Toiletries',
            'Safe Deposit Box',
            'Work Desk',
            'Bathrobe & Slippers',
            'Complimentary Newspaper',
            'Dining Area',
            'Jacuzzi',
        ],
    },
};

export default function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const room = roomTypesData[slug];
    const [selectedImage, setSelectedImage] = useState(0);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);

    if (!room) {
        notFound();
    }

    // Mock images - in production these would come from database
    const images = [
        { id: 1, alt: 'Main room view' },
        { id: 2, alt: 'Bathroom' },
        { id: 3, alt: 'Balcony view' },
        { id: 4, alt: 'Room amenities' },
    ];

    // Get other room types for "Similar Rooms" section
    const otherRooms = Object.entries(roomTypesData)
        .filter(([roomSlug]) => roomSlug !== slug)
        .map(([slug, data]) => ({ slug, ...data }))
        .slice(0, 3);

    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-white pt-20">
                {/* Breadcrumb */}
                <div className="max-w-7xl mx-auto px-4 py-6 border-b border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                        <Link href="/" className="hover:text-teal-deep transition-colors">Home</Link>
                        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href="/rooms" className="hover:text-teal-deep transition-colors">Rooms</Link>
                        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900 font-medium">{room.name}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Title & Rating */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                            <h1 className="font-serif text-3xl md:text-4xl text-gray-900">
                                {room.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-teal-deep text-white px-3 py-1 rounded-lg">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-sm font-semibold">4.8</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600">{room.shortDescription}</p>
                    </div>

                    {/* Image Gallery */}
                    <div className="grid grid-cols-4 gap-2 mb-8">
                        {images.map((img, idx) => (
                            <button
                                key={img.id}
                                onClick={() => setSelectedImage(idx)}
                                className={`relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden transition-all ${selectedImage === idx
                                    ? 'ring-2 ring-teal-deep'
                                    : 'hover:opacity-80'
                                    } ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Room Stats */}
                            <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>{room.maxGuests} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <span>{room.size} sq ft</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span>{room.bedType}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this room</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    {room.description}
                                </p>
                            </div>

                            {/* Amenities */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {room.amenities.map((amenity: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2 text-gray-700">
                                            <svg className="w-5 h-5 text-teal-deep flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Policies */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-teal-deep flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Check-in: 2:00 PM | Check-out: 11:00 AM</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-teal-deep flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Free cancellation up to 24 hours before check-in</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-teal-deep flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>No smoking in rooms</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-bold text-gray-900">{formatCurrency(room.basePrice)}</span>
                                        <span className="text-gray-500">/night</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Excluding taxes & fees</p>
                                </div>

                                {/* Booking Form */}
                                <div className="space-y-4 mb-6">
                                    {/* Check-in */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-in
                                        </label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent"
                                        />
                                    </div>

                                    {/* Check-out */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-out
                                        </label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent"
                                        />
                                    </div>

                                    {/* Guests */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Guests
                                        </label>
                                        <select
                                            value={guests}
                                            onChange={(e) => setGuests(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent"
                                        >
                                            {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((num) => (
                                                <option key={num} value={num}>
                                                    {num} {num === 1 ? 'Guest' : 'Guests'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Book Button */}
                                <Link
                                    href={`/book?room=${room.slug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                                    className="block w-full bg-teal-deep hover:bg-teal-deep/90 text-white text-center py-3 rounded-lg font-semibold transition-colors mb-3"
                                >
                                    Check Availability
                                </Link>

                                {/* Contact Button */}
                                <Link
                                    href="/contact"
                                    className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-center py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Contact Us
                                </Link>

                                {/* Trust Indicators */}
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-teal-deep" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Free cancellation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-teal-deep" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Best price guarantee</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-teal-deep" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Instant confirmation</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Similar Rooms */}
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Other room types
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {otherRooms.map((otherRoom: any) => (
                                <Link
                                    key={otherRoom.slug}
                                    href={`/rooms/${otherRoom.slug}`}
                                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 bg-gray-100">
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-teal-deep transition-colors">
                                            {otherRoom.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {otherRoom.shortDescription}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-gray-900">{formatCurrency(otherRoom.basePrice)}</span>
                                            <span className="text-sm text-gray-500">/night</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
