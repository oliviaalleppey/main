'use client';

import React from 'react';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface RoomFeaturesProps {
    roomType?: string;
}

export default function RoomFeatures({ roomType }: RoomFeaturesProps) {
    const features: Feature[] = [
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                </svg>
            ),
            title: "Spacious Layout",
            description: "Thoughtfully designed with ample space for relaxation and work, featuring separate living and sleeping areas for ultimate comfort."
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <path d="M3 9v6h18V9M3 15v3M21 15v3M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
                </svg>
            ),
            title: "Premium Bedding",
            description: "Sink into luxury with our plush mattresses, 400-thread-count Egyptian cotton linens, and an array of premium pillows for perfect sleep."
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <path d="M4 4h16M4 4v2M20 4v2M8 6v12M12 6v12M16 6v12M6 20h12" />
                </svg>
            ),
            title: "Luxurious Bathroom",
            description: "Indulge in rainfall showers, premium bath amenities, plush towels, and elegant marble finishes that create a spa-like sanctuary."
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <rect x="2" y="7" width="20" height="15" rx="2" />
                    <polyline points="17 2 12 7 7 2" />
                </svg>
            ),
            title: "Smart Technology",
            description: "Stay connected with high-speed WiFi, smart TV with streaming services, USB charging ports, and intuitive climate control."
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <path d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z" />
                    <path d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z" />
                </svg>
            ),
            title: "Stunning Views",
            description: "Wake up to breathtaking vistas of Vembanad Lake or the serene canal, with private balconies perfect for morning coffee or sunset moments."
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <rect x="3" y="4" width="18" height="12" rx="1" />
                    <path d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M7 16v4M17 16v4" />
                </svg>
            ),
            title: "Work-Friendly Space",
            description: "Ergonomic workspace with a spacious desk, comfortable seating, ample lighting, and multiple power outlets for productive remote work."
        }
    ];

    return (
        <section className="relative py-20 px-6 md:px-12 bg-white overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, #B8956A 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-[#B8956A] text-[10px] font-medium uppercase tracking-[0.4em] mb-6">
                        Room Features
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl text-[#2c2c2c] font-light tracking-wide mb-4">
                        Designed for Your Comfort
                    </h2>
                    <p className="text-[#2c2c2c]/60 text-lg max-w-2xl mx-auto">
                        Every detail has been carefully considered to ensure your stay is nothing short of exceptional
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group relative"
                        >
                            {/* Icon */}
                            <div className="mb-6 text-[#B8956A] group-hover:text-[#8B6F47] transition-colors duration-500">
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3 className="font-serif text-xl text-[#2c2c2c] mb-3 tracking-wide">
                                {feature.title}
                            </h3>
                            <p className="text-[#2c2c2c]/70 leading-relaxed text-sm">
                                {feature.description}
                            </p>

                            {/* Decorative Line */}
                            <div className="absolute bottom-0 left-0 w-0 h-px bg-[#B8956A] group-hover:w-12 transition-all duration-500" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
