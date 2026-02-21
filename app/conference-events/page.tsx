import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';

const venues = [
    {
        name: 'Executive Boardroom',
        capacity: '20 guests',
        size: '600 sq ft',
        features: ['Video conferencing', 'Smart TV', 'Private restroom', 'Butler service'],
        ideal: 'Board meetings, Executive discussions',
    },
    {
        name: 'Conference Hall A',
        capacity: '100 guests',
        size: '2,000 sq ft',
        features: ['Projector & screen', 'Microphone system', 'Climate control'],
        ideal: 'Seminars, Training sessions',
    },
    {
        name: 'Conference Hall B',
        capacity: '150 guests',
        size: '3,000 sq ft',
        features: ['Multiple screens', 'Stage setup', 'Green room'],
        ideal: 'Large conferences, Annual meetings',
    },
    {
        name: 'Grand Ballroom',
        capacity: '500 guests',
        size: '8,000 sq ft',
        features: ['Divisible spaces', 'Premium AV', 'Dance floor'],
        ideal: 'Gala dinners, Conventions',
    },
];

const packages = [
    {
        name: 'Day Meeting',
        includes: ['Meeting room rental', 'Coffee breaks', 'Buffet lunch', 'Basic AV', 'WiFi'],
        price: '₹1,500',
        per: 'per person',
    },
    {
        name: 'Conference Package',
        includes: ['Multiple room access', 'All meals', 'Full AV setup', 'Event coordination', 'Accommodation options'],
        price: '₹3,500',
        per: 'per person/day',
        featured: true,
    },
    {
        name: 'Corporate Retreat',
        includes: ['Exclusive venue access', 'All meals & beverages', 'Team activities', 'Spa access', 'Airport transfers'],
        price: 'Custom',
        per: 'pricing',
    },
];

export default function ConferenceEventsPage() {
    return (
        <>
            <main className="min-h-screen bg-[#FBFBF9]">
                {/* Hero Section - Compact */}
                <section className="relative h-[50vh] md:h-[55vh] w-full overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/rooms/balcony-room-5.jpg"
                            alt="Conference & Events"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-[#FBFBF9]" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                        <div className="flex items-center gap-4 mb-3">
                            <span className="w-8 h-[1px] bg-[#C9A961]" />
                            <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase font-light">Business Excellence</p>
                            <span className="w-8 h-[1px] bg-[#C9A961]" />
                        </div>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1C1C1C] mb-3 tracking-tight leading-none">
                            Conferences & Events
                        </h1>
                        <p className="text-[#1C1C1C]/60 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-6">
                            World-class venues and impeccable service for your corporate gatherings
                        </p>
                        <Link
                            href="/contact?type=corporate"
                            className="bg-[#0A332B] text-white px-8 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#15443B] transition-colors"
                        >
                            Request Proposal
                        </Link>
                    </div>
                </section>

                {/* Introduction - Compact */}
                <section className="py-10 px-6 md:px-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-[#1C1C1C] mb-4 tracking-wide">
                            Elevate Your Business Events
                        </h2>
                        <p className="text-[#1C1C1C]/60 leading-relaxed text-sm md:text-base">
                            From intimate board meetings to grand conferences, Olivia International Hotel provides the perfect setting.
                            Our dedicated team ensures every detail is handled with precision.
                        </p>
                    </div>
                </section>

                {/* Services Strip - Compact */}
                <section className="py-8 px-6 md:px-12 bg-white border-y border-gray-100">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {[
                                { title: 'Modern Venues', subtitle: 'Flexible spaces' },
                                { title: 'AV Equipment', subtitle: 'Latest technology' },
                                { title: 'High-Speed WiFi', subtitle: 'Complimentary' },
                                { title: 'Catering', subtitle: 'Customized menus' },
                                { title: 'Event Planning', subtitle: 'Dedicated team' },
                                { title: 'Team Building', subtitle: 'Curated activities' },
                            ].map((item) => (
                                <div key={item.title} className="text-center">
                                    <h3 className="text-sm font-medium text-[#1C1C1C] mb-1">{item.title}</h3>
                                    <p className="text-xs text-[#1C1C1C]/50">{item.subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Venues - Compact Grid */}
                <section className="py-12 px-6 md:px-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                            <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-2">Our Spaces</p>
                            <h2 className="font-serif text-3xl md:text-4xl text-[#1C1C1C] tracking-wide">Meeting Venues</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {venues.map((venue) => (
                                <div key={venue.name} className="bg-white border border-gray-100 p-5 hover:border-[#C9A961]/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-serif text-lg text-[#1C1C1C]">{venue.name}</h3>
                                        <span className="text-[#C9A961] text-xs font-medium">{venue.capacity}</span>
                                    </div>
                                    <p className="text-xs text-[#1C1C1C]/40 mb-3">{venue.size}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {venue.features.slice(0, 3).map((feature) => (
                                            <span
                                                key={feature}
                                                className="bg-[#FBFBF9] text-[#1C1C1C]/60 text-[10px] px-2 py-0.5"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[#1C1C1C]/50">
                                        <span className="font-medium text-[#1C1C1C]/70">Ideal:</span> {venue.ideal}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Packages - Luxury Design */}
                <section className="py-16 px-6 md:px-12 bg-gradient-to-b from-white to-[#FBFBF9]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <span className="w-12 h-[1px] bg-[#C9A961]" />
                                <p className="text-[#C9A961] text-[11px] tracking-[0.3em] uppercase font-medium">Tailored Solutions</p>
                                <span className="w-12 h-[1px] bg-[#C9A961]" />
                            </div>
                            <h2 className="font-serif text-4xl md:text-5xl text-[#1C1C1C] tracking-wide">Conference Packages</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            {/* Day Meeting Package */}
                            <div className="group relative bg-white border border-gray-100 p-8 hover:border-[#C9A961]/40 transition-all duration-500 hover:shadow-lg">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A961]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="mb-6">
                                    <h3 className="font-serif text-2xl text-[#1C1C1C] mb-2">Day Meeting</h3>
                                    <p className="text-xs text-[#1C1C1C]/50 tracking-wide">Perfect for single-day corporate gatherings</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Meeting room rental', 'Coffee breaks', 'Buffet lunch', 'Basic AV equipment', 'High-speed WiFi'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-[#1C1C1C]/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-xs text-[#1C1C1C]/40 mb-2 uppercase tracking-wider">Starting from</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-serif text-[#1C1C1C]">₹1,500</span>
                                        <span className="text-sm text-[#1C1C1C]/50">per person</span>
                                    </div>
                                </div>
                            </div>

                            {/* Conference Package - Featured */}
                            <div className="relative bg-[#0A332B] text-white p-8 lg:-mt-4 lg:mb-[-16px] shadow-xl">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-[#C9A961]" />
                                <div className="absolute top-4 right-4">
                                    <span className="bg-[#C9A961] text-[#1C1C1C] text-[10px] font-medium px-3 py-1 uppercase tracking-wider">Popular</span>
                                </div>
                                <div className="mb-6">
                                    <h3 className="font-serif text-2xl text-white mb-2">Conference Package</h3>
                                    <p className="text-xs text-white/50 tracking-wide">Complete solution for multi-day events</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Multiple room access', 'All meals included', 'Full AV setup', 'Event coordination', 'Accommodation options'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-6 border-t border-white/10">
                                    <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Starting from</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-serif text-[#C9A961]">₹3,500</span>
                                        <span className="text-sm text-white/50">per person/day</span>
                                    </div>
                                </div>
                            </div>

                            {/* Corporate Retreat Package */}
                            <div className="group relative bg-white border border-gray-100 p-8 hover:border-[#C9A961]/40 transition-all duration-500 hover:shadow-lg">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A961]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="mb-6">
                                    <h3 className="font-serif text-2xl text-[#1C1C1C] mb-2">Corporate Retreat</h3>
                                    <p className="text-xs text-[#1C1C1C]/50 tracking-wide">Exclusive experience for your team</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Exclusive venue access', 'All meals & beverages', 'Team building activities', 'Full spa access', 'Airport transfers'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-[#1C1C1C]/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-xs text-[#1C1C1C]/40 mb-2 uppercase tracking-wider">Custom Pricing</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-serif text-[#1C1C1C]">Tailored</span>
                                        <span className="text-sm text-[#1C1C1C]/50">to your needs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Split - Compact */}
                <section className="py-12 px-6 md:px-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-2">Why Choose Us</p>
                                <h2 className="font-serif text-3xl text-[#1C1C1C] mb-4 tracking-wide">Exceptional Service</h2>
                                <p className="text-[#1C1C1C]/60 text-sm leading-relaxed mb-6">
                                    Our dedicated events team works closely with you to understand your objectives and create
                                    bespoke experiences that exceed expectations.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Venues', value: '4+' },
                                        { label: 'Capacity', value: '500' },
                                        { label: 'Events/Year', value: '200+' },
                                        { label: 'Satisfaction', value: '99%' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="border-l-2 border-[#C9A961] pl-3">
                                            <p className="text-2xl font-serif text-[#1C1C1C]">{stat.value}</p>
                                            <p className="text-xs text-[#1C1C1C]/50">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative h-[300px] md:h-[350px]">
                                <Image
                                    src="/images/rooms/balcony-room-3.jpg"
                                    alt="Event Space"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Process - Compact Strip */}
                <section className="py-10 px-6 md:px-12 bg-white border-y border-gray-100">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-6">
                            <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-2">Simple Process</p>
                            <h2 className="font-serif text-2xl text-[#1C1C1C] tracking-wide">Plan Your Event</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { step: '01', title: 'Inquire', desc: 'Share your event requirements' },
                                { step: '02', title: 'Proposal', desc: 'Receive customized options' },
                                { step: '03', title: 'Confirm', desc: 'Finalize details & booking' },
                                { step: '04', title: 'Execute', desc: 'Enjoy a flawless event' },
                            ].map((item, idx) => (
                                <div key={item.step} className="flex items-start gap-3">
                                    <span className="text-[#C9A961] text-sm font-serif">{item.step}</span>
                                    <div>
                                        <h3 className="text-sm font-medium text-[#1C1C1C] mb-1">{item.title}</h3>
                                        <p className="text-xs text-[#1C1C1C]/50">{item.desc}</p>
                                    </div>
                                    {idx < 3 && (
                                        <span className="hidden md:block text-[#1C1C1C]/20 ml-auto">→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA - Compact */}
                <section className="py-12 px-6 md:px-12 bg-[#0A332B]">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-2xl md:text-3xl text-white mb-3 tracking-wide">
                            Ready to Plan Your Event?
                        </h2>
                        <p className="text-white/60 text-sm mb-6 max-w-lg mx-auto">
                            Let our team create a customized proposal tailored to your business needs
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/contact?type=corporate"
                                className="bg-[#C9A961] text-[#1C1C1C] px-8 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#D4B76A] transition-colors"
                            >
                                Request Proposal
                            </Link>
                            <Link
                                href="tel:+911234567890"
                                className="border border-white/30 text-white px-8 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
                            >
                                +91-1234-567890
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
