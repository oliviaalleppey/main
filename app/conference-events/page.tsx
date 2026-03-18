import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';
import EventInquiryForm from '@/components/conference/event-inquiry-form';
import {
    ArrowRight,
    Building2,
    CalendarClock,
    Clapperboard,
    Download,
    LayoutGrid,
    MapPin,
    Mic2,
    Paintbrush,
    PhoneCall,
    Presentation,
    Projector,
    Ruler,
    Sparkles,
    Users,
    Utensils,
    Wifi,
} from 'lucide-react';

type VenueLayout = {
    theatre: string;
    cluster: string;
    classroom: string;
    uShape: string;
    boardroom: string;
};

type Venue = {
    name: string;
    slug: string;
    image: string;
    description: string;
    bestFor: string;
    dimensions: {
        length: string;
        width: string;
        height: string;
    };
    area: string;
    layout: VenueLayout;
};

const venues: Venue[] = [
    {
        name: 'Grand BallRoom',
        slug: 'grand-ballroom',
        image: '',
        description: 'Pillarless flagship venue designed for high-impact conferences and celebration-scale events.',
        bestFor: 'Conferences, weddings, gala evenings',
        dimensions: { length: '95', width: '53', height: '13' },
        area: '5035',
        layout: {
            theatre: '500',
            cluster: '180-200',
            classroom: '120-130',
            uShape: '60',
            boardroom: '66',
        },
    },
    {
        name: 'Grand BallRoom 1',
        slug: 'grand-ballroom-1',
        image: '',
        description: 'Divisible section of the ballroom for focused sessions and medium-format gatherings.',
        bestFor: 'Meetings, seminars, corporate sessions',
        dimensions: { length: '53', width: '33', height: '13' },
        area: '1749',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '24',
        },
    },
    {
        name: 'Grand BallRoom 2',
        slug: 'grand-ballroom-2',
        image: '',
        description: 'Balanced format venue suitable for workshops, leadership meets, and conference tracks.',
        bestFor: 'Conferences, workshops, breakouts',
        dimensions: { length: '53', width: '35', height: '13' },
        area: '1855',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '24',
        },
    },
    {
        name: 'Grand BallRoom 3',
        slug: 'grand-ballroom-3',
        image: '',
        description: 'Flexible ballroom section built for training batches and presentation-led sessions.',
        bestFor: 'Training sessions, presentations',
        dimensions: { length: '53', width: '27', height: '13' },
        area: '1431',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '24',
        },
    },
    {
        name: 'Forum',
        slug: 'forum',
        image: '',
        description: 'Mid-scale conference venue that balances capacity with focused business interaction.',
        bestFor: 'Mid-size conferences, strategy meets',
        dimensions: { length: '61', width: '33', height: '9' },
        area: '2013',
        layout: {
            theatre: '120',
            cluster: '48',
            classroom: '36',
            uShape: '34',
            boardroom: '40',
        },
    },
    {
        name: 'Forum 1',
        slug: 'forum-1',
        image: '',
        description: 'Compact breakout venue for private workshops and internal planning sessions.',
        bestFor: 'Workshops, meetings',
        dimensions: { length: '33', width: '20', height: '9' },
        area: '660',
        layout: {
            theatre: '40',
            cluster: '24',
            classroom: '28',
            uShape: '18',
            boardroom: '22',
        },
    },
    {
        name: 'Forum 2',
        slug: 'forum-2',
        image: '',
        description: 'Breakout-focused space with straightforward layouts for productive work sessions.',
        bestFor: 'Breakouts, committee meetings',
        dimensions: { length: '33', width: '20', height: '9' },
        area: '660',
        layout: {
            theatre: '40',
            cluster: '24',
            classroom: '28',
            uShape: '18',
            boardroom: '22',
        },
    },
    {
        name: 'Forum 3',
        slug: 'forum-3',
        image: '',
        description: 'Private-format meeting room suited for decision rooms and leadership briefings.',
        bestFor: 'Leadership meetings, workshops',
        dimensions: { length: '42', width: '21', height: '9' },
        area: '882',
        layout: {
            theatre: '40',
            cluster: '24',
            classroom: '28',
            uShape: '18',
            boardroom: '22',
        },
    },
    {
        name: 'Poolside',
        slug: 'poolside',
        image: '',
        description: 'Outdoor venue for social evenings, celebrations, and curated hospitality-led events.',
        bestFor: 'Outdoor celebrations, dinners, networking',
        dimensions: { length: '—', width: '—', height: '—' },
        area: 'As per event needs',
        layout: {
            theatre: 'As per event needs',
            cluster: 'As per event needs',
            classroom: 'As per event needs',
            uShape: 'As per event needs',
            boardroom: 'As per event needs',
        },
    },
];

const eventTypes = [
    { label: 'Corporate Conferences', icon: Presentation },
    { label: 'Seminars & Workshops', icon: Building2 },
    { label: 'Destination Weddings', icon: Sparkles },
    { label: 'Private Celebrations', icon: CalendarClock },
    { label: 'Product Launches', icon: Clapperboard },
    { label: 'Networking Events', icon: Users },
];

const facilities = [
    { label: 'High-Speed WiFi', icon: Wifi },
    { label: 'Projector & AV System', icon: Projector },
    { label: 'Stage Setup', icon: Mic2 },
    { label: 'Banquet Catering', icon: Utensils },
    { label: 'Coffee Break Service', icon: CalendarClock },
    { label: 'Event Planning Support', icon: LayoutGrid },
    { label: 'Custom Seating Layouts', icon: Ruler },
    { label: 'Decor & Lighting', icon: Paintbrush },
];

const eventPackages = [
    {
        name: 'Corporate Package',
        includes: ['Meeting hall allocation', 'Projector and screen setup', 'Buffet lunch service', 'Coffee break arrangement'],
    },
    {
        name: 'Conference Package',
        includes: ['Venue zoning by session type', 'Stage and audio coordination', 'Foyer tea/coffee setup', 'Event flow support from team'],
    },
    {
        name: 'Wedding Celebration Package',
        includes: ['BallRoom or Poolside setup', 'Decor planning support', 'Banquet execution coordination', 'Stage and lighting alignment'],
    },
];

const galleryItems = [
    { title: 'Grand BallRoom - Theatre Setup', image: '' },
    { title: 'Forum - Classroom Setup', image: '' },
    { title: 'Wedding Celebration Layout', image: '' },
    { title: 'Poolside Evening Dinner', image: '' },
    { title: 'Conference Stage Arrangement', image: '' },
];

function formatArea(area: string) {
    return /^\d+$/.test(area) ? `${Number(area).toLocaleString('en-IN')} sq ft` : area;
}

function formatGuestLabel(theatre: string) {
    if (/^\d+$/.test(theatre)) return `Up to ${theatre} Guests`;
    return theatre;
}

export default function ConferenceEventsPage() {
    const featuredVenue = venues[0];

    return (
        <>
            <main className="min-h-screen bg-[#F8F6F1] text-[#1D1D1D]">
                <section className="relative min-h-[62vh] md:min-h-[72vh] overflow-hidden">
                    {/* Placeholder background (image to be added later) */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C2622_0%,#2B3A34_38%,#1B2421_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#121A17]/78 via-[#1A211E]/58 to-[#121A17]/45" />

                    <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-16 md:pt-20 md:pb-20">
                        <p className="text-[#D6B27A] text-[10px] tracking-[0.34em] uppercase mb-4">Conference & Events</p>
                        <h1 className="font-serif text-[2.4rem] md:text-[4rem] leading-[1.05] text-white max-w-4xl tracking-tight">
                            Conferences & Events at Olivia Alleppey
                        </h1>
                        <p className="mt-5 text-white/85 text-sm md:text-lg max-w-3xl leading-relaxed">
                            Elegant venues for meetings, conferences, weddings and celebrations in the heart of Alleppey.
                        </p>

                        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 max-w-4xl">
                            {[
                                { icon: Users, label: 'Up to 500 Guests' },
                                { icon: LayoutGrid, label: `${venues.length} Event Spaces` },
                                { icon: Ruler, label: '5,035 sq ft Ballroom' },
                                { icon: Building2, label: 'Indoor & Poolside venues' },
                            ].map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="rounded-lg border border-white/25 bg-black/20 backdrop-blur-sm px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-[#E4C28D]" />
                                            <span className="text-white text-[11px] md:text-xs tracking-wide">{stat.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-7 flex flex-col sm:flex-row gap-3">
                            <Link
                                href="#event-form"
                                className="inline-flex items-center justify-center gap-2 bg-[#B68A4A] text-white px-7 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#A57D44] transition-colors"
                            >
                                Plan Your Event
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact?asset=venue-brochure"
                                className="inline-flex items-center justify-center gap-2 border border-white/45 text-white px-7 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
                            >
                                Download Venue Brochure
                                <Download className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Venue Overview</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm md:text-base max-w-3xl">
                            Explore each space by capacity and event fit before moving into detailed layout planning.
                        </p>

                        <div className="mt-7 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0">
                            {venues.map((venue) => (
                                <article
                                    key={venue.slug}
                                    className="group min-w-[84%] snap-start rounded-xl overflow-hidden border border-[#E6DECf] bg-white shadow-[0_18px_40px_-34px_rgba(20,20,20,0.55)] md:min-w-0"
                                >
                                    <div className={`relative h-52 overflow-hidden ${venue.image ? '' : 'bg-[#E8E2D9]'}`}>
                                        {venue.image ? (
                                            <Image
                                                src={venue.image}
                                                alt={venue.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="p-4 md:p-5">
                                        <h3 className="font-serif text-2xl text-[#1C1C1C] leading-tight">{venue.name}</h3>
                                        <p className="mt-1 text-[#B17D3E] text-sm font-medium">{formatGuestLabel(venue.layout.theatre)}</p>
                                        <p className="text-sm text-[#6B6861] mt-1">{formatArea(venue.area)}</p>
                                        <p className="mt-3 text-sm text-[#4F4D48] leading-relaxed">{venue.bestFor}</p>
                                        <Link
                                            href={`#${venue.slug}`}
                                            className="mt-4 inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#A47436] hover:text-[#8E5F22]"
                                        >
                                            View Details
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10 bg-white border-y border-[#ECE5D8]">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-7 md:gap-10 items-center">
                        <div className={`relative h-[320px] md:h-[460px] rounded-xl overflow-hidden ${featuredVenue.image ? '' : 'bg-[#E8E2D9]'}`}>
                            {featuredVenue.image ? (
                                <Image
                                    src={featuredVenue.image}
                                    alt={featuredVenue.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : null}
                        </div>

                        <div>
                            <p className="text-[#B68A4A] text-[10px] tracking-[0.34em] uppercase mb-2">Featured Venue</p>
                            <h2 className="font-serif text-3xl md:text-5xl text-[#1D1D1D] tracking-tight">{featuredVenue.name}</h2>
                            <p className="mt-3 text-[#4F4B43] text-base leading-relaxed max-w-xl">
                                {formatArea(featuredVenue.area)} pillarless ballroom with up to {featuredVenue.layout.theatre} theatre-style seating.
                                Ideal for weddings, corporate summits, annual conferences and gala dining experiences.
                            </p>

                            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'Theatre', value: featuredVenue.layout.theatre },
                                    { label: 'Cluster', value: featuredVenue.layout.cluster },
                                    { label: 'Classroom', value: featuredVenue.layout.classroom },
                                    { label: 'U-Shape', value: featuredVenue.layout.uShape },
                                    { label: 'Boardroom', value: featuredVenue.layout.boardroom },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-[#E8E0D1] bg-[#FBF9F4] px-3 py-2.5">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A756A]">{item.label}</p>
                                        <p className="font-serif text-2xl text-[#1D1C19] leading-none mt-1">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="#event-form"
                                className="mt-7 inline-flex items-center gap-2 bg-[#0A332B] text-white px-7 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#15443B] transition-colors"
                            >
                                Check Availability
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Interactive Venue Gallery</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm md:text-base max-w-3xl">
                            Scroll through setup inspirations for theatre, classroom, wedding, and social event formats.
                        </p>

                        <div className="mt-7 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
                            {galleryItems.map((item, index) => (
                                <div
                                    key={item.title}
                                    className={`group relative min-w-[84%] snap-start overflow-hidden rounded-xl border border-[#E6DECf] h-[250px] md:min-w-0 ${index === 0 ? 'md:col-span-2 md:row-span-2 md:h-[500px]' : 'md:h-[240px]'} ${item.image ? '' : 'bg-[#E8E2D9]'}`}
                                >
                                    {item.image ? (
                                        <>
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                                        </>
                                    ) : null}
                                    <div className="absolute left-4 right-4 bottom-4 text-white">
                                        <p className="text-sm md:text-base font-medium">{item.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="venue-compare" className="py-12 md:py-16 px-6 md:px-10 bg-white border-y border-[#ECE5D8]">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Venue Comparison</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm md:text-base max-w-3xl">
                            Expand each venue card for complete dimensions and seating layout capacity.
                        </p>

                        <div className="mt-7 space-y-3">
                            {venues.map((venue) => (
                                <details id={venue.slug} key={venue.slug} className="group rounded-xl border border-[#E6DECf] bg-[#FCFBF8] open:bg-white">
                                    <summary className="list-none cursor-pointer px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-serif text-2xl text-[#1C1C1C]">{venue.name}</h3>
                                            <p className="text-sm text-[#6C6860]">Size: {formatArea(venue.area)} | Theatre: {venue.layout.theatre}</p>
                                        </div>
                                        <span className="text-[#A47436] text-xs tracking-[0.2em] uppercase group-open:hidden">Expand</span>
                                        <span className="text-[#A47436] text-xs tracking-[0.2em] uppercase hidden group-open:inline">Collapse</span>
                                    </summary>

                                    <div className="px-4 md:px-6 pb-5 md:pb-6 border-t border-[#F0E9DB]">
                                        <div className="pt-4 grid md:grid-cols-3 gap-4 md:gap-5">
                                            <div className="rounded-lg border border-[#EDE5D8] bg-[#FAF8F2] p-3.5">
                                                <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A756A]">Dimensions (ft)</p>
                                                <p className="mt-2 text-sm text-[#3C3A35]">L: {venue.dimensions.length} | W: {venue.dimensions.width} | H: {venue.dimensions.height}</p>
                                                <p className="mt-1 text-sm text-[#3C3A35]">Area: {formatArea(venue.area)}</p>
                                            </div>

                                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                                                {[
                                                    { label: 'Theatre', value: venue.layout.theatre },
                                                    { label: 'Cluster', value: venue.layout.cluster },
                                                    { label: 'Classroom', value: venue.layout.classroom },
                                                    { label: 'U-Shape', value: venue.layout.uShape },
                                                    { label: 'Boardroom', value: venue.layout.boardroom },
                                                ].map((layoutItem) => (
                                                    <div key={layoutItem.label} className="rounded-lg border border-[#EDE5D8] bg-white px-3 py-2.5">
                                                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A756A]">{layoutItem.label}</p>
                                                        <p className="mt-1 text-lg font-serif text-[#1D1C19] leading-none">{layoutItem.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Event Types</h2>
                        <div className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {eventTypes.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.label}
                                        href="#event-form"
                                        className="rounded-xl border border-[#E8E0D1] bg-white p-4 md:p-5 text-center hover:border-[#C9A961] transition-colors"
                                    >
                                        <Icon className="w-7 h-7 mx-auto text-[#B17D3E]" />
                                        <p className="mt-2.5 text-sm text-[#2A2A2A] leading-snug">{item.label}</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10 bg-white border-y border-[#ECE5D8]">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Services & Facilities</h2>
                        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {facilities.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="rounded-xl border border-[#E8E0D1] bg-[#FCFBF7] p-4 md:p-5">
                                        <Icon className="w-6 h-6 text-[#B17D3E]" />
                                        <p className="mt-2.5 text-sm text-[#2A2A2A]">{item.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight">Event Packages</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm md:text-base max-w-3xl">
                            Choose a structure and our team will tailor execution details around your event format.
                        </p>

                        <div className="mt-7 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0">
                            {eventPackages.map((pkg) => (
                                <article key={pkg.name} className="min-w-[84%] snap-start rounded-xl border border-[#E8E0D1] bg-white p-5 md:min-w-0 md:p-6">
                                    <h3 className="font-serif text-2xl text-[#1D1D1D]">{pkg.name}</h3>
                                    <ul className="mt-4 space-y-2">
                                        {pkg.includes.map((item) => (
                                            <li key={item} className="text-sm text-[#4F4B43] flex items-start gap-2">
                                                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#B17D3E]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="#event-form"
                                        className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#A47436] hover:text-[#8E5F22]"
                                    >
                                        Request Proposal
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="event-form" className="py-12 md:py-16 px-6 md:px-10 bg-white border-y border-[#ECE5D8]">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1E1D1A] tracking-tight text-center">Plan Your Event</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm md:text-base text-center max-w-3xl mx-auto">
                            Share your event brief and our team will suggest the right venue, layout and service plan.
                        </p>
                        <EventInquiryForm />
                    </div>
                </section>

                <section className="py-12 md:py-16 px-6 md:px-10">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
                        <div className="rounded-xl overflow-hidden border border-[#E6DECf] min-h-[320px]">
                            <iframe
                                title="Olivia Alleppey map"
                                src="https://maps.google.com/maps?q=Olivia%20Alleppey&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                className="w-full h-full min-h-[320px]"
                                loading="lazy"
                            />
                        </div>

                        <div className="rounded-xl border border-[#E6DECf] bg-white p-6 md:p-8">
                            <p className="text-[#B68A4A] text-[10px] tracking-[0.34em] uppercase mb-2">Location & Contact</p>
                            <h2 className="font-serif text-3xl md:text-4xl text-[#1E1D1A] tracking-tight">Event Coordination Desk</h2>

                            <div className="mt-5 space-y-3.5 text-sm text-[#46433D]">
                                <p className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 mt-0.5 text-[#B17D3E]" />
                                    <span>Olivia International, Finishing Point, Punnamada, Alappuzha, Kerala - 688013, India.</span>
                                </p>
                                <p className="flex items-center gap-2.5">
                                    <PhoneCall className="w-4 h-4 text-[#B17D3E]" />
                                    <span>
                                        +91/0 477225088, +91/0 4772250800 |{' '}
                                        <a href="tel:+918075416514" className="hover:text-[#8E5F22]">+91 8075 416 514</a>
                                    </span>
                                </p>
                                <p className="flex items-center gap-2.5">
                                    <CalendarClock className="w-4 h-4 text-[#B17D3E]" />
                                    <span>Reservations: 09:00 - 18:00 | Front Desk: 24/7 hrs</span>
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="#event-form"
                                    className="inline-flex items-center justify-center gap-2 bg-[#B68A4A] text-white px-7 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#A57D44] transition-colors"
                                >
                                    Send Event Brief
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="mailto:reservation@oliviaalleppey.com"
                                    className="inline-flex items-center justify-center gap-2 border border-[#CDBA98] text-[#7E5A2A] px-7 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#FBF7EE] transition-colors"
                                >
                                    Email Events Team
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
