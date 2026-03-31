import Image from 'next/image';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import ScrollButton from '@/components/ui/scroll-button';

export const metadata = {
    title: 'Membership | Olivia Alleppey',
    description: 'The Olivia Lifestyle Membership - Exclusive access, priority privileges, and year-round benefits.',
};

const PRIVILEGES = [
    {
        id: 'everyday',
        title: 'Your Everyday Access at Olivia',
        description: 'Unlimited access to premium facilities designed for wellness, relaxation and comfort.',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop', // Gym / Pool vibe
        items: [
            'Unlimited access to the fully equipped gym',
            'Access to the swimming pool during designated hours',
            'Access to steam and sauna facilities',
            'Priority reservations across hotel facilities'
        ]
    },
    {
        id: 'dining',
        title: 'Dining Privileges',
        description: 'Enjoy exclusive savings on food and soft beverages every time you dine at Olivia.',
        image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1470&auto=format&fit=crop', // Restaurant vibe
        items: [
            '50% discount for 2 diners',
            '33% discount for 3 diners',
            '25% discount for 4 diners',
            '20% discount for 5 diners',
            '15% discount for single diner or groups above 5',
            '15% flat discount on alcoholic beverages in restaurant and bars (not valid in "The Oak Room")'
        ]
    },
    {
        id: 'stay',
        title: 'Stay Privileges',
        description: 'Make your stays at Olivia even more rewarding.',
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1470&auto=format&fit=crop', // Hotel Room
        items: [
            'One complimentary room night (double occupancy, standard room)',
            '20% discount on room bookings across all seasons',
            'Priority reservations subject to availability',
            '20% discount on in-room dining',
            '20% discount on laundry services'
        ]
    },
    {
        id: 'spa',
        title: 'Spa & Wellness Privileges',
        description: 'Indulge in relaxation with special benefits on wellness experiences.',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1470&auto=format&fit=crop', // Spa massage
        items: [
            '25% discount on spa therapies',
            'Spa vouchers worth INR 1,000 each (3 vouchers)'
        ]
    },
    {
        id: 'events',
        title: 'Event & Catering Privileges',
        description: 'Host your special occasions with exclusive member benefits.',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1469&auto=format&fit=crop', // Event / Champagne
        items: [
            '20% discount on catering events for 50–500 guests (2 vouchers)',
            '50% discount for the New Year Gala party on 31st Dec. 2026'
        ]
    }
];

const TERMS = [
    "Valid only for active Olivia Lifestyle Members at Olivia, Alappuzha upon presentation of a valid membership card.",
    "Membership is non-transferable and non-refundable.",
    "Only one benefit or voucher may be used per invoice and cannot be combined with other offers.",
    "All benefits are subject to availability and prior reservation where applicable.",
    "Pool access is permitted only during designated operating hours along with the pool regulations.",
    "Management is not responsible for the loss or damage of personal belongings.",
    "Management reserves the right to modify facilities, access, or operating hours without prior notice for safety or operational reasons.",
    "Olivia management is committed to maintaining a safe and comfortable environment for all guests, including ensuring women’s safety across the premises.",
    "Olivia management reserves the right to suspend or terminate membership without prior notice in cases of misconduct, violation of rules within the premises."
];

export default function MembershipPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] text-[#F4F5F0] selection:bg-[#E95D20] selection:text-white pb-24 overflow-hidden relative">
            {/* FLOATING CENTERED CTA */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-max">
                <a href="tel:+916238160231" className="inline-flex items-center justify-center gap-3 bg-[#E95D20] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[13px] hover:bg-white hover:text-[#E95D20] transition-all group scale-100 hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(233,93,32,0.4)]">
                    Enroll Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
            </div>

            {/* HERO - Dynamic full height */}
            <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1C2822] via-[#0A0A0A] to-[#2A1A0F]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#E95D20_0%,_transparent_50%)] opacity-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#8C7A6B_0%,_transparent_50%)] opacity-10" />

                <div className="relative z-10 text-center px-4 max-w-[95vw] md:max-w-7xl mx-auto mt-0 md:mt-12">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 md:py-3 border border-white/20 rounded-full bg-black/30 backdrop-blur-md mb-10 md:mb-16 -mt-10 md:-mt-20">
                        <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#E95D20] animate-pulse"></span>
                        <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-white/90">Exclusive Access</span>
                    </div>
                    <h1 className="text-5xl md:text-[5rem] lg:text-[6.5rem] xl:text-[7rem] font-serif text-white leading-[1.1] md:leading-none mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] opacity-100 tracking-tight flex flex-col items-center">
                        <span className="md:whitespace-nowrap">Olivia Lifestyle Membership</span>
                        <span className="text-4xl md:text-6xl lg:text-[4.5rem] text-transparent bg-clip-text bg-gradient-to-r from-[#DCE2D1] to-[#8C7A6B]  font-normal block mt-4 md:-mt-2 tracking-normal drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                            For a Select Few...
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                        An extension of our refined hospitality, offering unparalleled privileges, year-round benefits, and seamless access across dining, stays, wellness, and events.
                    </p>
                    <div className="flex flex-col items-center gap-6 mt-8 md:mt-12 pb-16">
                        <ScrollButton targetId="intro" />
                    </div>
                </div>
            </section>

            {/* INTRO PHILOSOPHY SECTION */}
            <section id="intro" className="py-24 md:py-32 px-6 relative border-y border-white/10 bg-[#0A0A0A] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                <div className="max-w-4xl mx-auto text-center space-y-10 md:space-y-14">
                    <p className="text-2xl md:text-4xl lg:text-5xl font-serif leading-[1.4] text-white/90">
                        Nestled in the serene surroundings of Alappuzha, <span className="text-[#E95D20]">Olivia</span> is more than a luxury hotel. It is a destination where <span className="text-white">refined hospitality</span>, thoughtful wellness, and contemporary comforts come together to create memorable experiences.
                    </p>
                    <p className="text-lg md:text-xl text-white/60 font-sans leading-relaxed max-w-2xl mx-auto">
                        From rejuvenating wellness facilities and curated dining to elegant stays and personalised service, every detail at Olivia is designed to help you slow down, unwind, and indulge in life&apos;s finer moments.
                    </p>
                </div>
            </section>

            {/* PRIVILEGES: ENERGETIC GRID */}
            <section className="py-24 px-4 md:px-8 max-w-[1600px] mx-auto">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">Membership Privileges</h2>
                    <p className="text-white/50 tracking-widest uppercase text-sm font-bold">Crafted for your lifestyle</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
                    {PRIVILEGES.map((privilege, index) => {
                        // Create a dynamic asymmetric grid
                        let colSpan = "lg:col-span-6";
                        if (index === 0) colSpan = "lg:col-span-7"; // Everyday Access wider
                        if (index === 1) colSpan = "lg:col-span-5"; // Dining slightly smaller width
                        if (index === 2) colSpan = "lg:col-span-4"; // Stay narrow
                        if (index === 3) colSpan = "lg:col-span-8"; // Spa wide
                        if (index === 4) colSpan = "lg:col-span-12"; // Events full width

                        return (
                            <div
                                key={privilege.id}
                                className={`group relative overflow-hidden rounded-3xl min-h-[450px] md:min-h-[500px] flex flex-col justify-end ${colSpan} border border-white/10 bg-[#121212] transition-colors hover:border-[#E95D20]/50`}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                                    <Image
                                        src={privilege.image}
                                        alt={privilege.title}
                                        fill
                                        className="object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col justify-end transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                    <div className="mb-auto">
                                        <div className="w-12 h-1 bg-[#E95D20] mb-6 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100" />
                                        <h3 className="text-3xl md:text-4xl font-serif text-white mb-3 shadow-black drop-shadow-lg">{privilege.title}</h3>
                                        <p className="text-[#DCE2D1] text-sm md:text-base font-medium max-w-sm mb-6 drop-shadow-md">
                                            {privilege.description}
                                        </p>
                                    </div>

                                    {/* The List (Fades in slightly up on hover) */}
                                    <ul className="space-y-3 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                        {privilege.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-white/80 text-sm md:text-base">
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#E95D20] mt-0.5" />
                                                <span className="leading-snug">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#E95D20]/10 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">Experience it firsthand.</h2>
                    <a href="tel:+916238160231" className="inline-flex items-center justify-center gap-3 bg-[#E95D20] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[13px] hover:bg-white hover:text-black transition-all group scale-100 hover:scale-105 active:scale-95 shadow-xl shadow-[#E95D20]/20">
                        Enroll Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </section>

            {/* TERMS & CONDITIONS (Accordion-style clean look) */}
            <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/10 mt-10">
                <details className="group marker:content-['']">
                    <summary className="flex items-center justify-between cursor-pointer list-none transition-colors">
                        <h4 className="text-lg md:text-xl font-bold uppercase tracking-[0.1em] text-white">Terms & Conditions</h4>
                        <ChevronDown className="w-6 h-6 transform group-open:rotate-180 transition-transform duration-300 text-white" />
                    </summary>
                    <div className="mt-8 text-white text-sm md:text-base space-y-4">
                        <ul className="list-disc pl-5 space-y-3">
                            {TERMS.map((term, i) => (
                                <li key={i} className="leading-relaxed tracking-wide text-[#F4F5F0]">{term}</li>
                            ))}
                        </ul>
                    </div>
                </details>
            </section>

        </main>
    );
}
