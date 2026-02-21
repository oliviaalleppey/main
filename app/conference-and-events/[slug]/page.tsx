import { db } from '@/lib/db';
import { venues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SeatingDiagram from '@/components/venues/seating-diagram';
import { MapPin, Maximize2, Users, Wifi, Video, Coffee, Check, Download, Phone, Mail } from 'lucide-react';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const venue = await db
        .select()
        .from(venues)
        .where(eq(venues.slug, params.slug))
        .limit(1);

    if (!venue[0]) {
        return {
            title: 'Venue Not Found',
        };
    }

    return {
        title: `${venue[0].name} | Conference & Events | Olivia Alleppey`,
        description: venue[0].shortDescription || venue[0].description || '',
    };
}

async function getVenue(slug: string) {
    const venue = await db
        .select()
        .from(venues)
        .where(eq(venues.slug, slug))
        .limit(1);

    return venue[0];
}

export default async function VenuePage({ params }: Props) {
    const venue = await getVenue(params.slug);

    if (!venue) {
        notFound();
    }

    const equipment = venue.equipment as string[] || [];
    const amenities = venue.amenities as string[] || [];
    const suitableFor = venue.suitableFor as string[] || [];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-end overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <div className="absolute inset-0 bg-cream-100">
                    {venue.featuredImage ? (
                        <Image
                            src={venue.featuredImage}
                            alt={venue.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-32 h-32 text-cream-300" />
                        </div>
                    )}
                </div>
                <div className="relative z-20 w-full px-4 pb-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-4 capitalize">
                            {venue.venueType.replace('_', ' ')}
                        </div>
                        <h1 className="font-display text-5xl md:text-7xl text-white mb-4">
                            {venue.name}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
                            {venue.shortDescription}
                        </p>
                    </div>
                </div>
            </section>

            {/* Quick Info Bar */}
            <section className="bg-cream-50 border-b border-cream-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {venue.area && (
                            <div className="flex items-center gap-3">
                                <Maximize2 className="w-5 h-5 text-gold-500" />
                                <div>
                                    <div className="text-xs text-cream-600 uppercase tracking-wide">Area</div>
                                    <div className="text-sm font-medium text-cream-900">{venue.area} sqft</div>
                                </div>
                            </div>
                        )}
                        {venue.capacityTheatre && (
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gold-500" />
                                <div>
                                    <div className="text-xs text-cream-600 uppercase tracking-wide">Max Capacity</div>
                                    <div className="text-sm font-medium text-cream-900">{venue.capacityTheatre} guests</div>
                                </div>
                            </div>
                        )}
                        {venue.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gold-500" />
                                <div>
                                    <div className="text-xs text-cream-600 uppercase tracking-wide">Location</div>
                                    <div className="text-sm font-medium text-cream-900">{venue.location}</div>
                                </div>
                            </div>
                        )}
                        {venue.isDivisible && (
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-gold-500" />
                                <div>
                                    <div className="text-xs text-cream-600 uppercase tracking-wide">Flexibility</div>
                                    <div className="text-sm font-medium text-cream-900">Divisible Space</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Description */}
                        <div className="lg:col-span-2 space-y-12">
                            <div>
                                <h2 className="font-display text-3xl text-cream-900 mb-6">
                                    About {venue.name}
                                </h2>
                                <div className="prose prose-lg max-w-none text-cream-700">
                                    <p>{venue.description}</p>
                                </div>
                            </div>

                            {/* Seating Diagram */}
                            <div>
                                <SeatingDiagram
                                    venueName={venue.name}
                                    capacities={{
                                        theatre: venue.capacityTheatre,
                                        cluster: venue.capacityCluster,
                                        classroom: venue.capacityClassroom,
                                        uShape: venue.capacityUShape,
                                        boardroom: venue.capacityBoardroom,
                                        banquet: venue.capacityBanquet,
                                        cocktail: venue.capacityCocktail,
                                    }}
                                />
                            </div>

                            {/* Equipment & Amenities */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {equipment.length > 0 && (
                                    <div>
                                        <h3 className="font-display text-2xl text-cream-900 mb-4 flex items-center gap-2">
                                            <Video className="w-6 h-6 text-gold-500" />
                                            Equipment
                                        </h3>
                                        <ul className="space-y-2">
                                            {equipment.map((item, index) => (
                                                <li key={index} className="flex items-center gap-2 text-cream-700">
                                                    <Check className="w-4 h-4 text-gold-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {amenities.length > 0 && (
                                    <div>
                                        <h3 className="font-display text-2xl text-cream-900 mb-4 flex items-center gap-2">
                                            <Coffee className="w-6 h-6 text-gold-500" />
                                            Amenities
                                        </h3>
                                        <ul className="space-y-2">
                                            {amenities.map((item, index) => (
                                                <li key={index} className="flex items-center gap-2 text-cream-700">
                                                    <Check className="w-4 h-4 text-gold-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Suitable For */}
                            {suitableFor.length > 0 && (
                                <div>
                                    <h3 className="font-display text-2xl text-cream-900 mb-4">
                                        Perfect For
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {suitableFor.map((item, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-gold-50 text-gold-900 rounded-full border border-gold-200 font-medium"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-cream-50 rounded-lg p-8 sticky top-24 space-y-6">
                                <h3 className="font-display text-2xl text-cream-900">
                                    Plan Your Event
                                </h3>

                                {/* Dimensions */}
                                {(venue.length || venue.width || venue.height) && (
                                    <div>
                                        <div className="text-sm font-medium uppercase tracking-wide text-cream-600 mb-3">
                                            Dimensions
                                        </div>
                                        <div className="space-y-1 text-cream-900">
                                            {venue.length && <p>Length: {venue.length} ft</p>}
                                            {venue.width && <p>Width: {venue.width} ft</p>}
                                            {venue.height && <p>Height: {venue.height} ft</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Floor Plan Download */}
                                {venue.floorPlan && (
                                    <a
                                        href={venue.floorPlan}
                                        download
                                        className="flex items-center justify-center gap-2 w-full bg-white hover:bg-cream-100 text-cream-900 py-3 rounded-lg border border-cream-200 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Floor Plan
                                    </a>
                                )}

                                {/* Contact */}
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-wide text-cream-600 mb-3">
                                        Contact Events Team
                                    </div>
                                    <div className="space-y-2">
                                        <a
                                            href="tel:+914772266600"
                                            className="flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>+91 477 226 6600</span>
                                        </a>
                                        <a
                                            href="mailto:events@oliviaalleppey.com"
                                            className="flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>events@oliviaalleppey.com</span>
                                        </a>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Link
                                    href="/contact"
                                    className="block w-full bg-gold-500 hover:bg-gold-600 text-white text-center py-3 rounded-lg font-medium transition-colors"
                                >
                                    Request Proposal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Back to Venues */}
            <section className="py-12 px-4 bg-cream-50">
                <div className="max-w-7xl mx-auto text-center">
                    <Link
                        href="/conference-and-events"
                        className="inline-flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to All Venues</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
