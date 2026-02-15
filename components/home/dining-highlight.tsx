'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DiningHighlight() {
    return (
        <section className="py-24 bg-[#F5F5F0]"> {/* Matches Rooms section bg */}
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side - Overlapping Images */}
                    <div className="relative order-2 lg:order-1 h-[600px] w-full">
                        {/* Main Image */}
                        <div className="absolute top-0 left-0 w-[80%] h-[500px] overflow-hidden bg-gray-200">
                            <Image
                                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1920&auto=format&fit=crop"
                                alt="Fine Dining Experience"
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Secondary Image - Overlapping */}
                        <div className="absolute bottom-0 right-0 w-[60%] h-[350px] overflow-hidden border-8 border-[#F5F5F0] shadow-2xl">
                            <Image
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2874&auto=format&fit=crop"
                                alt="Dining Atmosphere"
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Decorative Label */}
                        <div className="absolute top-10 right-4 bg-white/90 backdrop-blur px-6 py-4 shadow-lg hidden md:block">
                            <span className="block text-2xl font-serif text-[#1C1C1C]">4.9</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#8C7A5C]">Guest Rating</span>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="order-1 lg:order-2 flex flex-col justify-center lg:pl-12">
                        <span className="text-[#8C7A5C] text-xs uppercase tracking-[0.3em] font-medium mb-6">
                            Culinary Excellence
                        </span>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1C1C1C] mb-8 leading-tight">
                            Flavors of the<br />Coast
                        </h2>

                        <p className="text-[#1C1C1C]/70 text-base leading-relaxed mb-6 font-light">
                            Experience a culinary journey that celebrates the rich heritage of Kerala through a modern lens.
                            Our chefs curate daily menus using the freshest catch from local fishermen and organic produce from our gardens.
                        </p>

                        <p className="text-[#1C1C1C]/70 text-base leading-relaxed mb-10 font-light hidden md:block">
                            From intimate candlelit dinners by the backwaters to vibrant family brunches, every meal at Olivia is a celebration of taste and tradition.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <Link
                                href="/dining"
                                className="group flex items-center gap-4 text-sm uppercase tracking-widest text-[#1C1C1C] font-semibold hover:text-[#C5A572] transition-colors"
                            >
                                View Menus
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/book"
                                className="group flex items-center gap-4 text-sm uppercase tracking-widest text-[#1C1C1C] font-semibold hover:text-[#C5A572] transition-colors"
                            >
                                Reserve a Table
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
