import { db } from '@/lib/db';
import { diningOutlets } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { Metadata } from 'next';
import { ArrowRight, Clock, MapPin, Sparkles, Users, Utensils } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

export const metadata: Metadata = {
    title: 'Dining | Olivia Alleppey',
    description: 'Discover refined culinary experiences at Olivia Alleppey, from all-day dining to our signature Brew & Bite culture.',
};

async function getDiningOutlets() {
    const outlets = await db
        .select()
        .from(diningOutlets)
        .where(eq(diningOutlets.isActive, true))
        .orderBy(asc(diningOutlets.sortOrder));

    return outlets;
}

const imageBySlug: Record<string, string> = {
    'finishing-point': '/images/dining/finishing-point.png',
    'brew-bar': '/images/dining/brew-bar.png',
    'kaayal': '/images/dining/kaayal.png',
    'in-room-dining': '/images/rooms/balcony-room-3.jpg',
    'aqua-pool-lounge': '/images/rooms/balcony-room-2.jpg',
    'club-9': '/images/rooms/balcony-room-4.jpg',
    'the-oak-room': '/images/rooms/balcony-room-1.jpg',
};

function getOutletImage(featuredImage: string | null, slug: string): string {
    return featuredImage || imageBySlug[slug] || '/images/dining/hero.jpg';
}

export default async function DiningPage() {
    const outlets = await getDiningOutlets();
    const operational = outlets.filter(o => o.status === 'operational');
    const upcoming = outlets.filter(o => o.status === 'upcoming');
    const brewAndBite = operational.find(o => o.slug === 'brew-bar');
    const signatureOutlet = operational.find(o => o.slug === 'finishing-point') || operational[0];

    return (
        <main className="min-h-screen bg-[#FAF8F3] text-[#25332D]">
            <StickyBookButton />
            <WhatsAppWidget />

            <section className="relative overflow-hidden border-b border-[#E7DFD0]">
                <div className="relative h-[68vh] md:h-[74vh]">
                    <Image
                        src="/images/dining/hero.jpg"
                        alt="Dining by the backwaters at Olivia Alleppey"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1D2622]/60 via-[#1D2622]/25 to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 w-full">
                        <div className="max-w-3xl">
                            <p className="text-[#E6CF9E] text-[11px] tracking-[0.35em] uppercase mb-4">
                                Culinary Program
                            </p>
                            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#F8F5EE] leading-[1.06] mb-4">
                                Dining That Feels Warm, Refined, and Unmistakably Local
                            </h1>
                            <p className="text-[#F3EEE2]/90 text-base md:text-lg leading-relaxed mb-7 max-w-2xl">
                                From sunrise coffee rituals to late evening plates, our kitchens are built around thoughtful service,
                                regional produce, and a relaxed luxury approach to hospitality.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href="#brew-and-bite"
                                    className="inline-flex items-center justify-center bg-[#E7D4AD] text-[#2A332F] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#E0C894] transition-colors"
                                >
                                    Explore Brew &amp; Bite
                                </a>
                                <a
                                    href="#dining-collection"
                                    className="inline-flex items-center justify-center border border-[#F2E9D8]/70 text-[#F8F5EE] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
                                >
                                    View All Outlets
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-[#E7DFD0] bg-[#F6F1E7]">
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Operational Outlets" value={`${operational.length}`} />
                    <StatCard label="Signature Program" value="Brew & Bite" />
                    <StatCard label="Opening Cadence" value="Sunrise to Late Night" />
                    <StatCard label="Cuisine Direction" value="Kerala + Global" />
                </div>
            </section>

            {brewAndBite && (
                <section id="brew-and-bite" className="py-12 md:py-14">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-7 lg:gap-10 items-stretch">
                        <div className="relative min-h-[340px] md:min-h-[430px] overflow-hidden">
                            <Image
                                src={getOutletImage(brewAndBite.featuredImage, brewAndBite.slug)}
                                alt={brewAndBite.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121815]/50 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 border border-[#E8D7B7]/55 bg-[#FCF8EF]/92 px-4 py-2">
                                <p className="text-[10px] tracking-[0.22em] uppercase text-[#8D7141]">
                                    Signature Concept
                                </p>
                                <p className="font-serif text-xl text-[#26322D]">Brew &amp; Bite</p>
                            </div>
                        </div>

                        <div className="border border-[#E4D9C7] bg-[#FCFAF5] p-6 md:p-7 flex flex-col justify-between">
                            <div>
                                <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                                    Featured At Olivia
                                </p>
                                <h2 className="font-serif text-3xl md:text-4xl text-[#1F2925] leading-tight mb-4">
                                    {brewAndBite.name}: The House Brew &amp; Bite Experience
                                </h2>
                                <p className="text-[#3E4D46]/85 leading-relaxed mb-5">
                                    {brewAndBite.description || brewAndBite.shortDescription}
                                </p>

                                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                                    <InfoPill icon={<Clock className="w-4 h-4" />} value={brewAndBite.operatingHours || 'All day service'} />
                                    <InfoPill icon={<MapPin className="w-4 h-4" />} value={brewAndBite.location || 'Lobby level'} />
                                    <InfoPill icon={<Utensils className="w-4 h-4" />} value={brewAndBite.cuisineType || 'Coffee and short bites'} />
                                    <InfoPill icon={<Users className="w-4 h-4" />} value={brewAndBite.capacity ? `${brewAndBite.capacity} seats` : 'Comfort seating'} />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(brewAndBite.specialFeatures || []).slice(0, 5).map((feature) => (
                                        <span
                                            key={feature}
                                            className="border border-[#E5DCCB] bg-[#FAF6ED] px-3 py-1.5 text-xs text-[#405149]"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link
                                    href={`/dining/${brewAndBite.slug}`}
                                    className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-[#2A3732] hover:text-[#8D7141] transition-colors"
                                >
                                    View Brew &amp; Bite Details
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section id="dining-collection" className="py-10 md:py-12 border-y border-[#E7DFD0] bg-[#FCFAF5]">
                <div className="max-w-6xl mx-auto px-6 md:px-10">
                    <div className="mb-8">
                        <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-2">
                            Dining Collection
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-3">
                            Every Outlet, One Cohesive Hospitality Standard
                        </h2>
                        <p className="text-[#415049]/80 max-w-3xl">
                            Choose a full meal, a quick coffee, or private room dining. Each outlet follows the same promise:
                            thoughtful food, clean execution, and service that stays personal.
                        </p>
                    </div>

                    <div className="space-y-7 md:space-y-8">
                        {operational.map((outlet, index) => (
                            <Link
                                key={outlet.id}
                                href={`/dining/${outlet.slug}`}
                                className="group block border border-[#E5DCCB] bg-white"
                            >
                                <article className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                                    <div className="relative h-60 md:h-72 lg:h-[320px] overflow-hidden">
                                        <Image
                                            src={getOutletImage(outlet.featuredImage, outlet.slug)}
                                            alt={outlet.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                        />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {outlet.isFeatured && (
                                                <span className="bg-[#E7D4AD] text-[#3B3020] px-3 py-1 text-[10px] tracking-[0.16em] uppercase">
                                                    Featured
                                                </span>
                                            )}
                                            {signatureOutlet && outlet.slug === signatureOutlet.slug && (
                                                <span className="bg-[#FAF6ED]/90 border border-[#DDCCAC] text-[#8A6C3C] px-3 py-1 text-[10px] tracking-[0.16em] uppercase">
                                                    Signature
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6 lg:p-7 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[10px] tracking-[0.24em] uppercase text-[#9A7C49] mb-2">
                                                {outlet.outletType || 'dining outlet'}
                                            </p>
                                            <h3 className="font-serif text-3xl text-[#1F2925] mb-3">
                                                {outlet.name}
                                            </h3>
                                            <p className="text-[#3F4F47]/85 mb-4 leading-relaxed">
                                                {outlet.shortDescription || outlet.description}
                                            </p>

                                            <div className="grid sm:grid-cols-2 gap-2.5 text-sm text-[#3D4B44] mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Utensils className="w-4 h-4 text-[#A78651]" />
                                                    <span>{outlet.cuisineType || 'Chef curated menu'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-[#A78651]" />
                                                    <span>{outlet.operatingHours || 'As per service hours'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[#A78651]" />
                                                    <span>{outlet.location || 'Hotel premises'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#A78651]" />
                                                    <span>{outlet.capacity ? `${outlet.capacity} seats` : 'Limited seating'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {(outlet.specialFeatures || []).slice(0, 4).map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="border border-[#E6DDCD] bg-[#FBF8F1] px-2.5 py-1 text-xs text-[#425149]"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-5">
                                            <span className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-[#2A3632] group-hover:text-[#8B6F42] transition-colors">
                                                Explore Outlet
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {upcoming.length > 0 && (
                <section className="py-10 md:py-12 bg-[#F6F1E7] border-y border-[#E7DFD0]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10">
                        <div className="mb-6">
                            <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-2">
                                Opening Soon
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl text-[#1F2925]">
                                Upcoming Culinary Concepts
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcoming.map((outlet) => (
                                <article key={outlet.id} className="border border-[#E4D9C7] bg-[#FCFAF5] overflow-hidden">
                                    <div className="relative h-48">
                                        <Image
                                            src={getOutletImage(outlet.featuredImage, outlet.slug)}
                                            alt={outlet.name}
                                            fill
                                            className="object-cover grayscale-[0.25]"
                                        />
                                        <div className="absolute top-3 right-3 bg-[#2F3B35]/90 text-[#F6F1E7] px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase">
                                            Soon
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-serif text-2xl text-[#1F2925] mb-2">{outlet.name}</h3>
                                        <p className="text-sm text-[#43534B] mb-3">
                                            {outlet.shortDescription || outlet.description}
                                        </p>
                                        <p className="text-sm text-[#405148] mb-1">{outlet.cuisineType || 'New concept'}</p>
                                        <p className="text-sm text-[#405148]">{outlet.location || 'Olivia Alleppey'}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="py-12 md:py-14">
                <div className="max-w-5xl mx-auto px-6 md:px-10 border border-[#E5DCCB] bg-[#FCFAF5] p-7 md:p-10 text-center">
                    <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                        Reserve Your Table
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-4">
                        Let Us Curate Your Next Meal At Olivia
                    </h2>
                    <p className="text-[#46544D] max-w-2xl mx-auto mb-7">
                        Planning a long breakfast, an evening coffee meeting, or a family dinner by the water?
                        Our team will help you choose the right outlet and timing.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/contact?type=dining"
                            className="inline-flex items-center justify-center bg-[#2A3430] text-[#F7F4EC] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#39443F] transition-colors"
                        >
                            Request Dining Reservation
                        </Link>
                        <Link
                            href={brewAndBite ? `/dining/${brewAndBite.slug}` : '/dining'}
                            className="inline-flex items-center justify-center border border-[#CAB38A] text-[#384740] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#F2EADB] transition-colors"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            View Brew &amp; Bite
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-[#E7DDCC] bg-[#FCFAF5] px-4 py-3">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8F7750] mb-1">{label}</p>
            <p className="text-sm md:text-base text-[#2D3933]">{value}</p>
        </div>
    );
}

function InfoPill({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <div className="flex items-center gap-2 border border-[#E5DCCB] bg-[#FAF6ED] px-3 py-2 text-sm text-[#3C4C44]">
            <span className="text-[#A78651]">{icon}</span>
            <span>{value}</span>
        </div>
    );
}
