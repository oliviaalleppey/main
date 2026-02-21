'use client';

import React from 'react';

interface AmenitiesGridProps {
    features: {
        icon: string;
        title: string;
        description: string;
    }[];
}

// Comprehensive Icon Library for All 20 Amenities
const iconMap: Record<string, React.JSX.Element> = {
    // 1. Private Balcony
    'privatebalcony': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M4 18h16M4 18V9l8-6 8 6v9M9 21v-8h6v8" />
        </svg>
    ),
    // 2. Bathtub
    'bathtub': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6L9 3M20 9L3 9M3 9L3 13C3 15.8284 3 17.2426 3.87868 18.1213C4.75736 19 6.17157 19 9 19L15 19C17.8284 19 19.2426 19 20.1213 18.1213C21 17.2426 21 15.8284 21 13L21 9" />
            <circle cx="7" cy="16" r="1" />
            <circle cx="17" cy="16" r="1" />
        </svg>
    ),
    // 3. Wake-up Call
    'wakeupcall': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="7" />
            <polyline points="12 10 12 13 15 15" />
            <path d="M5 3L2 6M22 6l-3-3M6 19l-2 2M18 19l2 2" />
        </svg>
    ),
    // 4. 24 Hrs Security
    '24hrssecurity': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4M12 16h.01" />
        </svg>
    ),
    // 5. 24 Hrs Laundry Service
    '24hrslaundryservice': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="2" width="18" height="20" rx="2" />
            <circle cx="12" cy="14" r="5" />
            <path d="M7 6h.01M11 6h.01" />
        </svg>
    ),
    // 6. Turn-Down Service (Housekeeping)
    'turndownservice': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
            <path d="M12 11v2" />
        </svg>
    ),
    'housekeeping': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
            <path d="M12 11v2" />
        </svg>
    ),
    // 7. WiFi
    'wifi': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
    ),
    // 8. 24 Hrs In Room Dining
    '24hrsinroomdining': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    ),
    'inroomdining': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    ),
    // 9. Mini Bar
    'minibar': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 6h14M5 12h14M5 18h14M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        </svg>
    ),
    // 10. Safe Locker
    'safelocker': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
            <circle cx="12" cy="14" r="3" />
            <path d="M7 7V5a5 5 0 0 1 10 0v2" />
        </svg>
    ),
    'safe': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
            <circle cx="12" cy="14" r="3" />
            <path d="M7 7V5a5 5 0 0 1 10 0v2" />
        </svg>
    ),
    // 11. In Room Tea Coffee Maker
    'inroomteacoffeemaker': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    'coffeemaker': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    // 12. Smart TV
    'smarttv': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
        </svg>
    ),
    'entertainment': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
        </svg>
    ),
    // 13. Bathroom Cubicle
    'bathroomcubicle': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2v20M15 2v20M2 9h20M2 15h20M2 5h20M2 19h20" />
        </svg>
    ),
    'bathroom': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6L9 3M20 9L3 9M3 9L3 13C3 15.8284 3 17.2426 3.87868 18.1213C4.75736 19 6.17157 19 9 19L15 19C17.8284 19 19.2426 19 20.1213 18.1213C21 17.2426 21 15.8284 21 13L21 9" />
        </svg>
    ),
    // 14. Iron Box & Table
    'ironboxtable': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M5 6h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 14l1.5 6h15l1.5-6" />
        </svg>
    ),
    'iron': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M5 6h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 14l1.5 6h15l1.5-6" />
        </svg>
    ),
    // 15. Access Controlled Elevators
    'accesscontrolledelevators': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 6v12M9 9l3-3 3 3M15 15l-3 3-3-3" />
        </svg>
    ),
    'elevator': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 6v12M9 9l3-3 3 3M15 15l-3 3-3-3" />
        </svg>
    ),
    // 16. Doctor On Call
    'doctoroncall': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M8 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
        </svg>
    ),
    // 17. Hair Dryer
    'hairdryer': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="7" />
            <path d="M14.5 14.5L21 21M9 6v6M6 9h6" />
        </svg>
    ),
    'hairdrier': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="7" />
            <path d="M14.5 14.5L21 21M9 6v6M6 9h6" />
        </svg>
    ),
    // 18. Vanity Mirror
    'vanitymirror': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="8" />
            <path d="M12 18v4M8 22h8" />
        </svg>
    ),
    'mirror': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="8" />
            <path d="M12 18v4M8 22h8" />
        </svg>
    ),
    // 19. Express Check-in
    'expresscheckin': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    'checkin': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    // 20. Online Reservation Facility
    'onlinereservationfacility': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
    ),
    'reservation': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    // Additional common amenities
    'airconditioning': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h18M3 16h18M12 3v18M8 8l-4 4M16 8l4 4M8 16l-4-4M16 16l4-4" />
        </svg>
    ),
    'view': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z" />
            <path d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z" />
        </svg>
    ),
    'bedding': (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        </svg>
    ),
};

function getIconComponent(iconKey: string): React.JSX.Element {
    const normalizedKey = iconKey.toLowerCase().replace(/[^a-z]/g, '');
    return iconMap[normalizedKey] || iconMap['bedding'];
}

export default function AmenitiesGrid({ features }: AmenitiesGridProps) {
    return (
        <section className="relative py-20 px-6 md:px-12 bg-[#fafaf8] overflow-hidden">
            <div className="relative max-w-7xl mx-auto">
                {/* Minimalist Section Header */}
                <div className="text-center mb-16">
                    <p className="text-[#B8956A] text-[10px] font-medium uppercase tracking-[0.4em] mb-6">
                        In-Room Amenities
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl text-[#2c2c2c] font-light tracking-wide">
                        Refined Comforts
                    </h2>
                </div>

                {/* Icon-Only Grid - No Borders, Just Icons */}
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-8 md:gap-10 max-w-6xl mx-auto">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group relative"
                            title={feature.title} // Tooltip on hover for accessibility
                        >
                            {/* Icon Only - No Box, No Border */}
                            <div className="relative aspect-square flex items-center justify-center">
                                <div className="text-[#B8956A] group-hover:text-[#8B6F47] transition-all duration-500 group-hover:scale-125">
                                    {getIconComponent(feature.title)}
                                </div>
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2c2c2c] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                                {feature.title}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2c2c2c]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
