import { db } from '@/lib/db';
import { diningOutlets } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { Metadata } from 'next';
import { Clock, MapPin, Users, Utensils } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'Dining | Olivia Alleppey',
    description: 'Discover our exceptional dining experiences featuring local Kerala cuisine and international flavors',
};

async function getDiningOutlets() {
    const outlets = await db
        .select()
        .from(diningOutlets)
        .where(eq(diningOutlets.isActive, true))
        .orderBy(asc(diningOutlets.sortOrder));

    return outlets;
}

export default async function DiningPage() {
    const outlets = await getDiningOutlets();
    const operational = outlets.filter(o => o.status === 'operational');
    const upcoming = outlets.filter(o => o.status === 'upcoming');

    return (
        <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cream-900/20 to-gold-900/20 z-10" />
                <div className="absolute inset-0 bg-[url('/images/dining/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-20 text-center text-white px-4">
                    <h1 className="font-display text-5xl md:text-7xl mb-6">
                        Culinary Excellence
                    </h1>
                    <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light">
                        A symphony of flavors celebrating Kerala's rich culinary heritage
                    </p>
                </div>
            </section>

            {/* Operational Outlets */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-5xl text-cream-900 mb-4">
                            Our Dining Venues
                        </h2>
                        <p className="text-lg text-cream-700 max-w-2xl mx-auto">
                            From lakeside dining to intimate bars, each venue offers a unique culinary journey
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {operational.map((outlet) => (
                            <Link
                                key={outlet.id}
                                href={`/dining/${outlet.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                    {/* Image */}
                                    <div className="relative h-64 overflow-hidden bg-cream-100">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                        {outlet.featuredImage ? (
                                            <Image
                                                src={outlet.featuredImage}
                                                alt={outlet.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Utensils className="w-16 h-16 text-cream-300" />
                                            </div>
                                        )}
                                        {outlet.isFeatured && (
                                            <div className="absolute top-4 right-4 z-20 bg-gold-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                Featured
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-display text-2xl text-cream-900 mb-2 group-hover:text-gold-600 transition-colors">
                                            {outlet.name}
                                        </h3>
                                        <p className="text-cream-600 text-sm mb-4">
                                            {outlet.shortDescription}
                                        </p>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-cream-700">
                                            <div className="flex items-center gap-2">
                                                <Utensils className="w-4 h-4 text-gold-500" />
                                                <span>{outlet.cuisineType}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gold-500" />
                                                <span>{outlet.operatingHours}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gold-500" />
                                                <span>{outlet.location}</span>
                                            </div>
                                            {outlet.capacity && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gold-500" />
                                                    <span>Seats {outlet.capacity}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Upcoming Outlets */}
            {upcoming.length > 0 && (
                <section className="py-20 px-4 bg-cream-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="font-display text-4xl md:text-5xl text-cream-900 mb-4">
                                Coming Soon
                            </h2>
                            <p className="text-lg text-cream-700 max-w-2xl mx-auto">
                                Exciting new dining experiences on the horizon
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {upcoming.map((outlet) => (
                                <div
                                    key={outlet.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-lg opacity-90"
                                >
                                    {/* Image */}
                                    <div className="relative h-64 overflow-hidden bg-cream-100">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                        {outlet.featuredImage ? (
                                            <Image
                                                src={outlet.featuredImage}
                                                alt={outlet.name}
                                                fill
                                                className="object-cover grayscale"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Utensils className="w-16 h-16 text-cream-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 z-20 bg-cream-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Opening Soon
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-display text-2xl text-cream-900 mb-2">
                                            {outlet.name}
                                        </h3>
                                        <p className="text-cream-600 text-sm mb-4">
                                            {outlet.shortDescription}
                                        </p>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-cream-700">
                                            <div className="flex items-center gap-2">
                                                <Utensils className="w-4 h-4 text-gold-500" />
                                                <span>{outlet.cuisineType}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gold-500" />
                                                <span>{outlet.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
