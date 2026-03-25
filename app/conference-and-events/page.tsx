import { db } from '@/lib/db';
import { venues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import VenueCard from '@/components/venues/venue-card';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Users, Wifi, Coffee, Award, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

async function getVenues() {
    const allVenues = await db.select().from(venues).where(eq(venues.isActive, true)).orderBy(venues.sortOrder);
    return allVenues;
}

export default async function ConferenceEventsPage() {
    const allVenues = await getVenues();
    const featuredVenues = allVenues.filter(v => v.isFeatured);
    const ballrooms = allVenues.filter(v => v.venueType === 'ballroom');
    const meetingRooms = allVenues.filter(v => v.venueType === 'meeting_room');
    const outdoorVenues = allVenues.filter(v => v.venueType === 'outdoor');

    return (
        <main className="min-h-screen bg-[var(--surface-cream)]">
            <StickyBookButton />
            <WhatsAppWidget />

            {/* Hero Section - Rooms Style */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />

                {/* Hero Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="mb-4">
                        <span className="inline-block px-4 py-1 border border-[var(--gold-accent)]/50 text-[var(--gold-accent)] text-[10px] tracking-[0.3em] uppercase">Business Excellence</span>
                    </div>
                    <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight">
                        Exceptional Events<br />
                        <span className="text-[var(--gold-accent)] italic">Unforgettable Moments</span>
                    </h1>
                    <p className="text-white/80 text-sm md:text-base max-w-2xl mb-8 font-light leading-relaxed">
                        World-class venues, impeccable service, and meticulous attention to detail<br className="hidden md:block" />
                        for your most important gatherings
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/contact?type=corporate"
                            className="inline-flex items-center justify-center gap-2 bg-[var(--gold-accent)] hover:bg-[#D4B76A] text-[var(--text-dark)] px-8 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold transition-all duration-300"
                        >
                            Request Proposal
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link
                            href="#venues"
                            className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white hover:bg-white/10 px-8 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold transition-all duration-300"
                        >
                            Explore Venues
                        </Link>
                    </div>
                </div>
            </section>

            {/* Introduction Strip */}
            <section className="py-16 px-6 bg-white border-y border-[var(--gold-accent)]/10">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-[#403A35] text-base md:text-lg leading-relaxed font-light">
                        From intimate boardroom meetings to grand celebrations for 500 guests, Olivia Alleppey offers <span className="text-[var(--gold-accent-dark)] font-medium">8 distinctive venues</span> with state-of-the-art facilities,
                        award-winning catering, and a dedicated events team committed to flawless execution.
                    </p>
                </div>
            </section>


            {/* Featured Venues with Images */}
            {
                featuredVenues.length > 0 && (
                    <section className="py-24 px-6 bg-gradient-to-b from-white to-[#FBFBF9]">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-20">
                                <div className="flex items-center justify-center gap-4 mb-5">
                                    <Sparkles className="w-5 h-5 text-[var(--gold-accent-dark)]" />
                                    <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase">Featured Spaces</p>
                                    <Sparkles className="w-5 h-5 text-[var(--gold-accent-dark)]" />
                                </div>
                                <h2 className="font-serif text-5xl md:text-6xl text-[var(--text-dark)] mb-5 tracking-tight">Signature Venues</h2>
                                <p className="text-[#59544D] max-w-2xl mx-auto text-lg font-light">
                                    Our most sought-after spaces for extraordinary events
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {featuredVenues.map((venue) => (
                                    <VenueCard key={venue.id} venue={venue} />
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Grand Ballrooms */}
            {
                ballrooms.length > 0 && (
                    <section className="py-24 px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-20">
                                <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase mb-4">Elegant Spaces</p>
                                <h2 className="font-serif text-5xl md:text-6xl text-[var(--text-dark)] mb-5 tracking-tight">Grand Ballrooms</h2>
                                <p className="text-[#59544D] max-w-2xl mx-auto text-lg font-light">
                                    Majestic spaces for weddings, galas, and large-scale celebrations
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {ballrooms.map((venue) => (
                                    <VenueCard key={venue.id} venue={venue} />
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Meeting Rooms */}
            {
                meetingRooms.length > 0 && (
                    <section className="py-24 px-6 bg-white">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-20">
                                <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase mb-4">Professional Spaces</p>
                                <h2 className="font-serif text-5xl md:text-6xl text-[var(--text-dark)] mb-5 tracking-tight">Meeting Rooms</h2>
                                <p className="text-[#59544D] max-w-2xl mx-auto text-lg font-light">
                                    Intimate settings for productive business gatherings
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {meetingRooms.map((venue) => (
                                    <VenueCard key={venue.id} venue={venue} />
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Outdoor Venues with Image */}
            {
                outdoorVenues.length > 0 && (
                    <section className="py-24 px-6 bg-[var(--surface-cream)]">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-20">
                                <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase mb-4">Al Fresco Events</p>
                                <h2 className="font-serif text-5xl md:text-6xl text-[var(--text-dark)] mb-5 tracking-tight">Outdoor Venues</h2>
                                <p className="text-[#59544D] max-w-2xl mx-auto text-lg font-light">
                                    Breathtaking settings under the open sky
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {outdoorVenues.map((venue) => (
                                    <VenueCard key={venue.id} venue={venue} />
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Premium Amenities with Luxury Design */}
            <section className="py-28 px-6 bg-gradient-to-b from-white via-[#FBFBF9] to-white relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--gold-accent)]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--gold-accent)]/5 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <span className="w-12 h-[1px] bg-[var(--gold-accent)]" />
                            <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase">Premium Services</p>
                            <span className="w-12 h-[1px] bg-[var(--gold-accent)]" />
                        </div>
                        <h2 className="font-serif text-5xl md:text-6xl text-[var(--text-dark)] mb-5 tracking-tight">World-Class Amenities</h2>
                        <p className="text-[#59544D] max-w-2xl mx-auto text-lg font-light">
                            Every detail crafted for excellence
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Users, title: 'Expert Event Planning', desc: 'Dedicated coordinators for flawless execution' },
                            { icon: Wifi, title: 'High-Speed Connectivity', desc: 'Complimentary fiber-optic WiFi throughout' },
                            { icon: Coffee, title: 'Gourmet Catering', desc: 'Customized menus by award-winning chefs' },
                            { icon: Sparkles, title: 'Premium AV Technology', desc: 'State-of-the-art audio-visual equipment' },
                            { icon: Award, title: '5-Star Service', desc: 'Attentive staff ensuring every detail' },
                            { icon: Calendar, title: 'Flexible Packages', desc: 'Tailored solutions for every occasion' },
                        ].map((amenity) => (
                            <div key={amenity.title} className="group bg-white p-10 border border-[#C9A961]/10 hover:border-[#C9A961]/30 hover:shadow-xl transition-all duration-500">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#C9A961]/10 to-[#C9A961]/5 rounded-full flex items-center justify-center mb-6 group-hover:from-[#C9A961]/20 group-hover:to-[#C9A961]/10 transition-all duration-500">
                                    <amenity.icon className="w-8 h-8 text-[var(--gold-accent-dark)]" />
                                </div>
                                <h3 className="font-serif text-2xl text-[var(--text-dark)] mb-3 tracking-tight">{amenity.title}</h3>
                                <p className="text-[#59544D] leading-relaxed font-light">{amenity.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us - Split Section with Image */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Image Side */}
                        <div className="relative h-[500px] md:h-[600px] order-2 md:order-1 bg-[var(--surface-soft)]" />

                        {/* Content Side */}
                        <div className="order-1 md:order-2">
                            <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.4em] uppercase mb-4">Why Choose Us</p>
                            <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-dark)] mb-6 tracking-tight leading-tight">
                                Exceptional Service,<br />
                                <span className="text-[var(--gold-accent-dark)] italic">Flawless Execution</span>
                            </h2>
                            <p className="text-[#403A35] text-base leading-relaxed mb-8 font-light">
                                Our dedicated events team works closely with you to understand your objectives and create
                                bespoke experiences that exceed expectations. From initial consultation to final execution,
                                we ensure every moment is perfect.
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-6 mb-10">
                                {[
                                    { label: 'Unique Venues', value: '8' },
                                    { label: 'Max Capacity', value: '500' },
                                    { label: 'Events Annually', value: '200+' },
                                    { label: 'Client Satisfaction', value: '99%' },
                                ].map((stat) => (
                                    <div key={stat.label} className="border-l-2 border-[#C9A961] pl-4">
                                        <p className="text-4xl font-serif text-[var(--gold-accent-dark)] mb-1">{stat.value}</p>
                                        <p className="text-sm text-[#59544D] uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Features List */}
                            <div className="space-y-3">
                                {[
                                    'Personalized event coordination',
                                    'Flexible venue configurations',
                                    'Premium audio-visual equipment',
                                    'Award-winning culinary team',
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-[var(--gold-accent-dark)] flex-shrink-0" />
                                        <span className="text-[#403A35]">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Luxury CTA with Background Image */}
            <section className="relative py-32 px-6 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 bg-[var(--brand-primary)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-primary)]/95 via-[var(--brand-primary)]/90 to-[var(--brand-primary)]/95" />
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10 z-0">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-[var(--gold-accent)] rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-[var(--gold-accent)] rounded-full blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <span className="w-16 h-[1px] bg-[var(--gold-accent)]" />
                        <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.5em] uppercase">Get Started</p>
                        <span className="w-16 h-[1px] bg-[var(--gold-accent)]" />
                    </div>
                    <h2 className="font-serif text-4xl md:text-6xl text-white mb-6 tracking-tight leading-tight">
                        Ready to Plan Your<br />
                        <span className="text-[var(--gold-accent-dark)] italic">Perfect Event?</span>
                    </h2>
                    <p className="text-white/95 text-lg mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                        Let our expert team create a customized proposal tailored to your vision.<br />
                        Contact us today to begin planning your unforgettable event.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link
                            href="/contact?type=corporate"
                            className="group inline-flex items-center justify-center gap-3 bg-[var(--gold-accent)] hover:bg-[#D4B76A] text-[var(--text-dark)] px-12 py-5 text-[11px] tracking-[0.25em] uppercase font-semibold transition-all duration-300 shadow-2xl hover:shadow-[#C9A961]/30"
                        >
                            Request Proposal
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="tel:+911234567890"
                            className="inline-flex items-center justify-center gap-3 border-2 border-white/40 hover:border-white text-white hover:bg-white/10 px-12 py-5 text-[11px] tracking-[0.25em] uppercase font-semibold transition-all duration-300"
                        >
                            Call: +91-123-456-7890
                        </Link>
                    </div>
                </div>
            </section>
        </main >
    );
}
