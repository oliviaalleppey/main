'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CompactFeatures() {
    const features = [
        {
            title: "Luxurious Accommodations",
            description: "Experience unparalleled comfort in our meticulously designed suites, featuring panoramic city views.",
            image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2940&auto=format&fit=crop",
            link: "/rooms"
        },
        {
            title: "Exquisite Dining",
            description: "Savor culinary masterpieces crafted by world-class chefs in our award-winning restaurants.",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2940&auto=format&fit=crop",
            link: "/dining"
        },
        {
            title: "Wellness & Spa",
            description: "Rejuvenate your senses with bespoke treatments in our tranquil sanctuary of wellness.",
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2940&auto=format&fit=crop",
            link: "/wellness"
        }
    ];

    return (
        <section className="py-20 bg-[#FBFBF9]">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4 tracking-wide">CURATED EXPERIENCES</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light tracking-wide">
                        Immerse yourself in a collection of unique moments designed to inspire and delight.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="group cursor-pointer">
                            <div className="relative h-[300px] w-full overflow-hidden mb-6">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-[#8C7A5C] transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4 font-light">
                                {feature.description}
                            </p>
                            <Link href={feature.link} className="inline-block text-xs uppercase tracking-[0.2em] border-b border-gray-300 pb-1 group-hover:border-[#8C7A5C] transition-colors">
                                Discover More
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
