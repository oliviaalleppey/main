'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingWidget() {
    const router = useRouter();
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);

    const handleSearch = () => {
        router.push(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    };

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shadow-2xl max-w-5xl mx-auto -mt-24 relative z-20 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Check-in */}
                <div className="bg-white rounded-xl p-3 relative group transition-all hover:shadow-lg">
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 ml-1">Check In</label>
                    <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full bg-transparent font-medium text-gray-900 border-none focus:ring-0 p-0 cursor-pointer"
                    />
                </div>

                {/* Check-out */}
                <div className="bg-white rounded-xl p-3 relative group transition-all hover:shadow-lg">
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 ml-1">Check Out</label>
                    <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full bg-transparent font-medium text-gray-900 border-none focus:ring-0 p-0 cursor-pointer"
                    />
                </div>

                {/* Guests */}
                <div className="bg-white rounded-xl p-3 relative group transition-all hover:shadow-lg">
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 ml-1">Guests</label>
                    <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full bg-transparent font-medium text-gray-900 border-none focus:ring-0 p-0 cursor-pointer"
                    >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                    </select>
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    className="bg-teal-deep hover:bg-teal-900 text-white font-serif text-lg rounded-xl transition-all shadow-lg hover:shadow-teal-deep/30 flex items-center justify-center gap-2 group"
                >
                    <span>Check Availability</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
