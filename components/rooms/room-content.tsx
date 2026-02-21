import { ReactNode } from 'react';

interface RoomContentProps {
    title: string;
    tagline: string;
    description: string;
    details: {
        label: string;
        value: string | number | ReactNode;
    }[];
    amenities?: {
        icon: string;
        title: string;
        description: string;
    }[];
}

// Comprehensive Icon mapping for all common amenities
const iconMap: Record<string, React.JSX.Element> = {
    // Views
    'lakeviews': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z" />
            <path d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z" />
        </svg>
    ),
    'view': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z" />
            <path d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z" />
        </svg>
    ),
    // Beds
    'twinbeds': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="10" width="9" height="8" rx="1" />
            <rect x="13" y="10" width="9" height="8" rx="1" />
            <path d="M2 18v2M11 18v2M13 18v2M22 18v2" />
        </svg>
    ),
    'kingbed': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        </svg>
    ),
    'bedding': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        </svg>
    ),
    // Work
    'workdesk': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="1" />
            <path d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M7 16v4M17 16v4" />
        </svg>
    ),
    'desk': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="1" />
            <path d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M7 16v4M17 16v4" />
        </svg>
    ),
    // Shower
    'rainshower': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16M4 4v2M20 4v2M8 6v12M12 6v12M16 6v12M6 20h12" />
            <path d="M8 20v2M12 20v2M16 20v2" />
        </svg>
    ),
    'shower': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16M4 4v2M20 4v2M8 6v12M12 6v12M16 6v12M6 20h12" />
        </svg>
    ),
    // Bathtub
    'bathtub': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6L9 3M20 9L3 9M3 9L3 13C3 15.8284 3 17.2426 3.87868 18.1213C4.75736 19 6.17157 19 9 19L15 19C17.8284 19 19.2426 19 20.1213 18.1213C21 17.2426 21 15.8284 21 13L21 9" />
            <circle cx="7" cy="16" r="1" />
            <circle cx="17" cy="16" r="1" />
        </svg>
    ),
    // WiFi
    'freewifi': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
    ),
    'wifi': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
    ),
    // Air Conditioning
    'airconditioning': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h18M3 16h18M12 3v18M8 8l-4 4M16 8l4 4M8 16l-4-4M16 16l4-4" />
        </svg>
    ),
    // Balcony
    'privatebalcony': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M4 18h16M4 18V9l8-6 8 6v9M9 21v-8h6v8" />
        </svg>
    ),
    'balcony': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M4 18h16M4 18V9l8-6 8 6v9M9 21v-8h6v8" />
        </svg>
    ),
    // Mini Bar
    'minibar': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 6h14M5 12h14M5 18h14M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        </svg>
    ),
    // Coffee/Tea
    'coffeemaker': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    'tea': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    // TV
    'smarttv': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
        </svg>
    ),
    'tv': (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
        </svg>
    ),
};

function getIconComponent(iconKey: string): React.JSX.Element {
    const normalizedKey = iconKey.toLowerCase().replace(/[^a-z]/g, '');
    return iconMap[normalizedKey] || iconMap['bedding'];
}

export default function RoomContent({ title, tagline, description, details, amenities }: RoomContentProps) {
    return (
        <section className="bg-[#FBFBF9] text-[#1C1C1C] pt-0 pb-8 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Title Section */}
                {title && (
                    <div className="mb-8">
                        <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight text-[#1C1C1C]">
                            {title}
                        </h1>
                    </div>
                )}

                {/* Two Column Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
                    {/* Left: Description */}
                    <div className="md:col-span-7">
                        <p className="text-xl md:text-2xl text-[#1C1C1C]/90 font-light leading-relaxed mb-8">
                            {tagline}
                        </p>
                        <p className="text-[#1C1C1C]/60 leading-relaxed text-lg mb-12">
                            {description}
                        </p>

                        {/* Elegant Logo Divider */}
                        <div className="flex items-center justify-center gap-6 my-12">
                            {/* Left Decorative Line */}
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#B8956A]/30 to-[#B8956A]/50" />

                            {/* Hotel Logo */}
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-16 h-16 md:w-20 md:h-20 text-[#B8956A] opacity-40 hover:opacity-70 transition-opacity duration-500"
                                    viewBox="0 0 100 100"
                                    fill="currentColor"
                                >
                                    {/* Elegant "O" monogram for Olivia */}
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <text
                                        x="50"
                                        y="50"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize="32"
                                        fontFamily="serif"
                                        fontWeight="300"
                                    >
                                        O
                                    </text>
                                </svg>
                            </div>

                            {/* Right Decorative Line */}
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#B8956A]/30 to-[#B8956A]/50" />
                        </div>

                        {/* Amenities Icons - Below Monogram */}
                        {amenities && amenities.length > 0 && (
                            <div className="mt-8">
                                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                                    {amenities.map((amenity, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative"
                                            title={amenity.title}
                                        >
                                            <div className="text-[#B8956A] group-hover:text-[#8B6F47] transition-all duration-500 group-hover:scale-125">
                                                {getIconComponent(amenity.title)}
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2c2c2c] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                                                {amenity.title}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2c2c2c]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Details List */}
                    <div className="md:col-span-5">
                        <h3 className="text-[#C9A961] text-xs font-bold uppercase tracking-widest mb-8">
                            Details:
                        </h3>
                        <ul className="space-y-4">
                            {details.map((detail, idx) => (
                                <li key={idx} className="flex items-start gap-4 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1C1C1C] mt-2 flex-shrink-0" />
                                    <span className="text-[#1C1C1C]/80 leading-relaxed font-light">
                                        <strong className="font-medium text-[#1C1C1C] mr-2">{detail.label}</strong>
                                        {detail.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
