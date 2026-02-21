'use client';

import { useState } from 'react';
import { Users, Calendar, Search } from 'lucide-react';

interface Venue {
    id: string;
    name: string;
    slug: string;
    area: number | null;
    capacityTheatre: number | null;
    capacityCluster: string | null;
    capacityClassroom: number | null;
    capacityUShape: number | null;
    capacityBoardroom: number | null;
    capacityBanquet: number | null;
    capacityCocktail: number | null;
    venueType: string;
}

interface CapacityCalculatorProps {
    venues: Venue[];
}

const eventTypes = [
    { id: 'conference', label: 'Conference', style: 'theatre' },
    { id: 'wedding', label: 'Wedding', style: 'banquet' },
    { id: 'meeting', label: 'Business Meeting', style: 'boardroom' },
    { id: 'training', label: 'Training/Workshop', style: 'classroom' },
    { id: 'cocktail', label: 'Cocktail Reception', style: 'cocktail' },
    { id: 'gala', label: 'Gala Dinner', style: 'banquet' },
];

export default function CapacityCalculator({ venues }: CapacityCalculatorProps) {
    const [eventType, setEventType] = useState('conference');
    const [guestCount, setGuestCount] = useState(100);
    const [showResults, setShowResults] = useState(false);

    const selectedEventType = eventTypes.find(t => t.id === eventType);
    const seatingStyle = selectedEventType?.style || 'theatre';

    const getVenueCapacity = (venue: Venue, style: string): number => {
        switch (style) {
            case 'theatre':
                return venue.capacityTheatre || 0;
            case 'banquet':
                return venue.capacityBanquet || 0;
            case 'boardroom':
                return venue.capacityBoardroom || 0;
            case 'classroom':
                return venue.capacityClassroom || 0;
            case 'cocktail':
                return venue.capacityCocktail || 0;
            default:
                return 0;
        }
    };

    const recommendedVenues = venues
        .map(venue => ({
            ...venue,
            capacity: getVenueCapacity(venue, seatingStyle),
            match: getVenueCapacity(venue, seatingStyle) >= guestCount ? 100 :
                Math.round((getVenueCapacity(venue, seatingStyle) / guestCount) * 100)
        }))
        .filter(v => v.capacity > 0)
        .sort((a, b) => {
            // Perfect matches first
            if (a.capacity >= guestCount && b.capacity < guestCount) return -1;
            if (b.capacity >= guestCount && a.capacity < guestCount) return 1;
            // Then by closest to guest count
            return Math.abs(a.capacity - guestCount) - Math.abs(b.capacity - guestCount);
        })
        .slice(0, 3);

    const handleCalculate = () => {
        setShowResults(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-[#C9A961]/10">
            {/* Calculator Form */}
            <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-cream-700 mb-3">
                            <Calendar className="inline w-4 h-4 mr-2" />
                            Event Type
                        </label>
                        <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-cream-200 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                        >
                            {eventTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Guest Count */}
                    <div>
                        <label className="block text-sm font-medium text-cream-700 mb-3">
                            <Users className="inline w-4 h-4 mr-2" />
                            Number of Guests
                        </label>
                        <input
                            type="number"
                            value={guestCount}
                            onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                            min="1"
                            max="1000"
                            className="w-full px-4 py-3 border-2 border-cream-200 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                            placeholder="Enter guest count"
                        />
                    </div>
                </div>

                {/* Calculate Button */}
                <button
                    onClick={handleCalculate}
                    className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                >
                    <Search className="w-5 h-5" />
                    Find Perfect Venues
                </button>

                {/* Results */}
                {showResults && (
                    <div className="mt-8 space-y-4 animate-fadeIn">
                        <h4 className="font-display text-2xl text-cream-900 mb-4">
                            Recommended Venues
                        </h4>

                        {recommendedVenues.length === 0 ? (
                            <div className="text-center py-8 text-cream-600">
                                <p>No venues found for {guestCount} guests in {selectedEventType?.label} style.</p>
                                <p className="text-sm mt-2">Try adjusting your guest count or event type.</p>
                            </div>
                        ) : (
                            recommendedVenues.map((venue, index) => (
                                <div
                                    key={venue.id}
                                    className="bg-white border-2 border-cream-200 rounded-lg p-6 hover:border-gold-400 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-gold-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <h5 className="font-display text-xl text-cream-900">
                                                    {venue.name}
                                                </h5>
                                            </div>
                                            <div className="ml-11 space-y-2">
                                                <div className="flex items-center gap-4 text-sm text-cream-600">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        Capacity: <strong className="text-cream-900">{venue.capacity}</strong> guests
                                                    </span>
                                                    {venue.area && (
                                                        <span>
                                                            Area: <strong className="text-cream-900">{venue.area}</strong> sqft
                                                        </span>
                                                    )}
                                                </div>
                                                {venue.capacity >= guestCount ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                        Perfect Match
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                                        {venue.match}% Capacity
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={`/conference-and-events/${venue.slug}`}
                                            className="px-4 py-2 bg-cream-100 hover:bg-gold-500 hover:text-white text-cream-700 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            View Details
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
