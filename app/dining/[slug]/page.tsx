import { db } from '@/lib/db';
import { diningOutlets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Users, Utensils, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const outlet = await db
        .select()
        .from(diningOutlets)
        .where(eq(diningOutlets.slug, params.slug))
        .limit(1);

    if (!outlet[0]) {
        return {
            title: 'Dining Outlet Not Found',
        };
    }

    return {
        title: `${outlet[0].name} | Dining | Olivia Alleppey`,
        description: outlet[0].shortDescription || outlet[0].description || '',
    };
}

async function getOutlet(slug: string) {
    const outlet = await db
        .select()
        .from(diningOutlets)
        .where(eq(diningOutlets.slug, slug))
        .limit(1);

    return outlet[0];
}

export default async function OutletPage({ params }: Props) {
    const outlet = await getOutlet(params.slug);

    if (!outlet) {
        notFound();
    }

    const features = outlet.specialFeatures as string[] || [];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-end overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <div className="absolute inset-0 bg-cream-100">
                    {outlet.featuredImage ? (
                        <Image
                            src={outlet.featuredImage}
                            alt={outlet.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-32 h-32 text-cream-300" />
                        </div>
                    )}
                </div>
                <div className="relative z-20 w-full px-4 pb-16">
                    <div className="max-w-7xl mx-auto">
                        {outlet.status === 'upcoming' && (
                            <div className="inline-block bg-gold-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                                Opening Soon
                            </div>
                        )}
                        <h1 className="font-display text-5xl md:text-7xl text-white mb-4">
                            {outlet.name}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
                            {outlet.shortDescription}
                        </p>
                    </div>
                </div>
            </section>

            {/* Quick Info Bar */}
            <section className="bg-cream-50 border-b border-cream-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <Utensils className="w-5 h-5 text-gold-500" />
                            <div>
                                <div className="text-xs text-cream-600 uppercase tracking-wide">Cuisine</div>
                                <div className="text-sm font-medium text-cream-900">{outlet.cuisineType}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gold-500" />
                            <div>
                                <div className="text-xs text-cream-600 uppercase tracking-wide">Hours</div>
                                <div className="text-sm font-medium text-cream-900">{outlet.operatingHours}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gold-500" />
                            <div>
                                <div className="text-xs text-cream-600 uppercase tracking-wide">Location</div>
                                <div className="text-sm font-medium text-cream-900">{outlet.location}</div>
                            </div>
                        </div>
                        {outlet.capacity && (
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gold-500" />
                                <div>
                                    <div className="text-xs text-cream-600 uppercase tracking-wide">Capacity</div>
                                    <div className="text-sm font-medium text-cream-900">{outlet.capacity} Seats</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Description */}
                        <div className="lg:col-span-2">
                            <h2 className="font-display text-3xl text-cream-900 mb-6">
                                About {outlet.name}
                            </h2>
                            <div className="prose prose-lg max-w-none text-cream-700">
                                <p>{outlet.description}</p>
                            </div>

                            {/* Special Features */}
                            {features.length > 0 && (
                                <div className="mt-12">
                                    <h3 className="font-display text-2xl text-cream-900 mb-6">
                                        Highlights
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-gold-500 rounded-full" />
                                                <span className="text-cream-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-cream-50 rounded-lg p-8 sticky top-24">
                                <h3 className="font-display text-2xl text-cream-900 mb-6">
                                    Visit Us
                                </h3>

                                <div className="space-y-6">
                                    {/* Operating Hours */}
                                    <div>
                                        <div className="flex items-center gap-2 text-cream-600 mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm font-medium uppercase tracking-wide">Hours</span>
                                        </div>
                                        <p className="text-cream-900">{outlet.operatingHours}</p>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <div className="flex items-center gap-2 text-cream-600 mb-2">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm font-medium uppercase tracking-wide">Location</span>
                                        </div>
                                        <p className="text-cream-900">{outlet.location}</p>
                                    </div>

                                    {/* Contact */}
                                    {(outlet.phone || outlet.email) && (
                                        <div>
                                            <div className="text-sm font-medium uppercase tracking-wide text-cream-600 mb-3">
                                                Contact
                                            </div>
                                            <div className="space-y-2">
                                                {outlet.phone && (
                                                    <a
                                                        href={`tel:${outlet.phone}`}
                                                        className="flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        <span>{outlet.phone}</span>
                                                    </a>
                                                )}
                                                {outlet.email && (
                                                    <a
                                                        href={`mailto:${outlet.email}`}
                                                        className="flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        <span>{outlet.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reservation Button */}
                                    {outlet.status === 'operational' && (
                                        <Link
                                            href="/contact"
                                            className="block w-full bg-gold-500 hover:bg-gold-600 text-white text-center py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Make a Reservation
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Back to Dining */}
            <section className="py-12 px-4 bg-cream-50">
                <div className="max-w-7xl mx-auto text-center">
                    <Link
                        href="/dining"
                        className="inline-flex items-center gap-2 text-cream-700 hover:text-gold-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to All Dining Options</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
