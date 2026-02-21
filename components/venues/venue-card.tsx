import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Users, Maximize2, Sparkles } from 'lucide-react';

interface VenueCardProps {
    venue: {
        id: string;
        name: string;
        slug: string;
        shortDescription: string | null;
        venueType: string;
        area: number | null;
        capacityTheatre: number | null;
        capacityBanquet: number | null;
        featuredImage: string | null;
        location: string | null;
        isFeatured: boolean | null;
    };
}

export default function VenueCard({ venue }: VenueCardProps) {
    const maxCapacity = Math.max(
        venue.capacityTheatre || 0,
        venue.capacityBanquet || 0
    );

    // Use placeholder images if no featured image
    const getPlaceholderImage = () => {
        if (venue.venueType === 'ballroom') return '/images/rooms/balcony-room-5.jpg';
        if (venue.venueType === 'meeting_room') return '/images/rooms/balcony-room-3.jpg';
        if (venue.venueType === 'outdoor') return '/images/rooms/balcony-room-4.jpg';
        return '/images/rooms/balcony-room-1.jpg';
    };

    const imageUrl = venue.featuredImage || getPlaceholderImage();

    return (
        <Link href={`/conference-and-events/${venue.slug}`} className="group block">
            <div className="bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={venue.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A332B]/90 via-[#0A332B]/40 to-transparent z-10" />

                    {/* Featured Badge */}
                    {venue.isFeatured && (
                        <div className="absolute top-6 right-6 z-20 bg-[#C9A961] text-[#1C1C1C] px-4 py-2 shadow-xl">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                <span className="text-xs font-medium tracking-[0.15em] uppercase">Featured</span>
                            </div>
                        </div>
                    )}

                    {/* Venue Type Badge */}
                    <div className="absolute top-6 left-6 z-20">
                        <span className="inline-block px-4 py-2 bg-white/95 backdrop-blur-sm text-[#1C1C1C] text-xs font-medium uppercase tracking-wider">
                            {venue.venueType.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
                        <h3 className="font-serif text-3xl text-white mb-3 tracking-tight group-hover:text-[#C9A961] transition-colors duration-300">
                            {venue.name}
                        </h3>
                        <p className="text-white/80 text-sm mb-4 line-clamp-2 font-light">
                            {venue.shortDescription}
                        </p>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-4 text-sm text-white/90">
                            {maxCapacity > 0 && (
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#C9A961]" />
                                    <span className="font-light">Up to {maxCapacity}</span>
                                </div>
                            )}
                            {venue.area && (
                                <div className="flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-[#C9A961]" />
                                    <span className="font-light">{venue.area} sqft</span>
                                </div>
                            )}
                            {venue.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#C9A961]" />
                                    <span className="font-light">{venue.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* View Details Bar */}
                <div className="bg-[#0A332B] px-8 py-4 group-hover:bg-[#15443B] transition-colors duration-300">
                    <div className="flex items-center justify-between text-white">
                        <span className="text-xs tracking-[0.2em] uppercase font-medium">View Details</span>
                        <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
