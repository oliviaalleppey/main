'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function EditorialSplit() {
    return (
        <section className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">

                {/* Visual Side (Left) */}
                <div className="relative h-[60vh] md:h-auto overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2940&auto=format&fit=crop"
                        alt="Lobby Interior"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Content Side (Right) */}
                <div className="flex flex-col justify-center px-8 md:px-20 py-24 bg-white">
                    <div className="max-w-xl">
                        <span className="text-xs uppercase tracking-[0.3em] text-[#8C7A5C] mb-6 block font-medium">
                            The Olivia Experience
                        </span>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1C1C1C] leading-[1.1] mb-8">
                            A sanctuary of<br />modern luxury.
                        </h2>

                        <p className="text-[#1C1C1C]/70 text-base md:text-lg leading-relaxed font-light mb-10 tracking-wide">
                            Nestled in the heart of Alappuzha, Olivia International represents a new era of hospitality.
                            Where heritage architecture meets contemporary elegance, creating a stay defined by personalized service and breathtaking views.
                        </p>

                        <div className="flex items-center gap-8">
                            <Link
                                href="/about"
                                className="group flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-[#1C1C1C] hover:text-[#C5A572] transition-colors"
                            >
                                Read Our Story
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
