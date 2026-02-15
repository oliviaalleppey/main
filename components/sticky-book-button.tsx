'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function StickyBookButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show button after scrolling 300px
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Mobile Button (Bottom Right) */}
            <Link
                href="/book"
                className="fixed bottom-6 right-6 z-40 md:hidden bg-gold hover:bg-gold/90 text-off-black px-6 py-3 rounded-full font-semibold shadow-gold transition-luxury animate-scale-in flex items-center space-x-2"
            >
                <span>Book Now</span>
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </Link>

            {/* Desktop Button (Right Side) */}
            <Link
                href="/book"
                className="fixed top-1/2 right-0 -translate-y-1/2 z-40 hidden md:block bg-gold hover:bg-gold/90 text-off-black px-4 py-8 rounded-l-lg font-semibold shadow-gold transition-luxury animate-slide-up"
                style={{ writingMode: 'vertical-rl' }}
            >
                BOOK YOUR STAY
            </Link>
        </>
    );
}
