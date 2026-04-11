import { ChevronDown } from 'lucide-react';
import { MembershipEnrollmentTrigger } from '@/components/membership/membership-enrollment-trigger';
import { getMembershipImages } from '@/app/admin/media/actions';

export const metadata = {
    title: 'Membership | Olivia Alleppey',
    description: 'The Olivia Lifestyle Membership — Exclusive access, priority privileges, and year-round benefits.',
};

const PRIVILEGES = [
    {
        id: 'wellness',
        number: '01',
        title: 'Everyday Access',
        category: 'Wellness & Facilities',
        description: 'Unlimited access to premium facilities designed for wellness, relaxation and comfort.',
        items: [
            'Unlimited access to the fully equipped gym',
            'Swimming pool access during designated hours',
            'Steam and sauna facilities',
            'Priority reservations across hotel facilities',
        ],
    },
    {
        id: 'dining',
        number: '02',
        title: 'Dining Privileges',
        category: 'Food & Beverage',
        description: 'Exclusive savings on food and beverages every time you dine at Olivia.',
        items: [
            '50% discount for 2 diners',
            '33% discount for 3 diners',
            '25% discount for 4 diners',
            '20% discount for 5 diners',
            '15% flat discount on beverages at restaurant & bars',
        ],
    },
    {
        id: 'stay',
        number: '03',
        title: 'Stay Privileges',
        category: 'Rooms & Suites',
        description: 'Make every stay at Olivia more rewarding with exclusive room benefits.',
        items: [
            'One complimentary room night (double occupancy)',
            '20% discount on room bookings across all seasons',
            '20% discount on in-room dining',
            '20% discount on laundry services',
            'Priority reservations subject to availability',
        ],
    },
    {
        id: 'spa',
        number: '04',
        title: 'Spa & Wellness',
        category: 'Treatments & Therapies',
        description: 'Indulge in relaxation with exclusive benefits on all wellness experiences.',
        items: [
            '25% discount on all spa therapies',
            'Spa vouchers worth ₹1,000 each (3 vouchers)',
        ],
    },
    {
        id: 'events',
        number: '05',
        title: 'Events & Celebrations',
        category: 'Banquets & Catering',
        description: 'Host your special occasions with exclusive member privileges.',
        items: [
            '20% discount on catering for 50–500 guests (2 vouchers)',
            '50% discount for the New Year Gala on 31st Dec. 2026',
        ],
    },
];

const TERMS = [
    'Valid only for active Olivia Lifestyle Members at Olivia, Alappuzha upon presentation of a valid membership card.',
    'Membership is non-transferable and non-refundable.',
    'Only one benefit or voucher may be used per invoice and cannot be combined with other offers.',
    'All benefits are subject to availability and prior reservation where applicable.',
    'Pool access is permitted only during designated operating hours along with the pool regulations.',
    'Management is not responsible for the loss or damage of personal belongings.',
    'Management reserves the right to modify facilities, access, or operating hours without prior notice for safety or operational reasons.',
    'Olivia management is committed to maintaining a safe and comfortable environment for all guests, including ensuring women\'s safety across the premises.',
    'Olivia management reserves the right to suspend or terminate membership in cases of misconduct or violation of premises rules.',
];

export default async function MembershipPage() {
    const membershipImages = await getMembershipImages();

    return (
        <main className="min-h-screen bg-[#FDFAF5] text-[#2A2420]">

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative w-full min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#FDFAF5]">
                {/* Subtle warm radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(188,160,111,0.10)_0%,rgba(253,250,245,0)_70%)]" />
                {/* Top ornamental line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,transparent,#BCA06F,transparent)]" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-5 mb-8">
                        <span className="w-16 h-[1px] bg-[#BCA06F]" />
                        <span className="text-[#BCA06F] text-[10px] tracking-[0.45em] uppercase font-medium">Olivia Alleppey</span>
                        <span className="w-16 h-[1px] bg-[#BCA06F]" />
                    </div>

                    <h1 className="font-serif leading-none tracking-tight mb-4">
                        <span className="block text-[4rem] sm:text-[5.5rem] md:text-[7.5rem] lg:text-[9rem] text-[#1C3A2A] leading-none">Olivia</span>
                        <span className="block text-[2.8rem] sm:text-[3.8rem] md:text-[5rem] lg:text-[6rem] italic text-[#BCA06F] leading-none mt-1">Lifestyle</span>
                        <span className="block text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.6rem] text-[#2D3933] tracking-[0.12em] uppercase font-light mt-3">Membership</span>
                    </h1>

                    <div className="flex items-center justify-center gap-5 my-9">
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                        <span className="text-[#BCA06F] text-base">✦</span>
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                    </div>

                    <p className="text-[#5D5450] text-lg md:text-xl leading-[1.85] font-light max-w-2xl mx-auto mb-12">
                        An extension of our refined hospitality — offering unparalleled privileges, year-round benefits, and seamless access across dining, stays, wellness, and events.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <MembershipEnrollmentTrigger className="bg-[#1C3A2A] text-white px-10 py-4 text-[11px] tracking-[0.28em] uppercase font-medium hover:bg-[#2A4F3C] transition-colors shadow-[0_8px_32px_rgba(28,58,42,0.18)]" />
                        <a href="#privileges" className="border border-[#BCA06F] text-[#BCA06F] px-10 py-4 text-[11px] tracking-[0.28em] uppercase font-medium hover:bg-[#BCA06F] hover:text-white transition-colors">
                            Explore Benefits
                        </a>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFAF5] to-transparent" />
            </section>

            {/* ── Philosophy Quote ─────────────────────────────────────────── */}
            <section className="bg-white border-y border-[#EEE5D5] py-16 md:py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="font-serif italic text-[#BCA06F] text-6xl leading-none block mb-4">"</span>
                    <p className="font-serif text-[1.45rem] md:text-[1.85rem] text-[#1C3A2A] leading-[1.6] tracking-tight">
                        Nestled in the serene surroundings of Alappuzha, Olivia is more than a luxury hotel.
                        It is a destination where refined hospitality and thoughtful wellness create experiences
                        that stay with you long after your visit.
                    </p>
                    <div className="flex items-center justify-center gap-5 mt-8">
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                        <span className="text-[#BCA06F] text-sm">✦</span>
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                    </div>
                </div>
            </section>

            {/* ── Stats Bar ────────────────────────────────────────────────── */}
            <section className="bg-[#FDFAF5] border-b border-[#EEE5D5]">
                <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { value: '5', label: 'Privilege Categories' },
                        { value: '50%', label: 'Max Dining Discount' },
                        { value: '₹1,000', label: 'Spa Vouchers (×3)' },
                        { value: '1', label: 'Complimentary Stay Night' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center border border-[#EEE5D5] bg-white px-4 py-6">
                            <p className="font-serif text-3xl md:text-4xl text-[#BCA06F] mb-2">{value}</p>
                            <p className="text-[10px] tracking-[0.22em] uppercase text-[#8A8279]">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Privileges ───────────────────────────────────────────────── */}
            <section id="privileges" className="bg-[#FDFAF5] scroll-mt-20 py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-6 md:px-10">

                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <p className="text-[#BCA06F] text-[10px] tracking-[0.38em] uppercase mb-5">Crafted for your lifestyle</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-[#1C3A2A] tracking-tight">Membership Privileges</h2>
                        <div className="flex items-center justify-center gap-4 mt-7">
                            <span className="w-16 h-[1px] bg-[#E0D4BE]" />
                            <span className="text-[#BCA06F] text-xs">✦</span>
                            <span className="w-16 h-[1px] bg-[#E0D4BE]" />
                        </div>
                    </div>

                    {/* Privilege Cards — alternating image side */}
                    <div className="space-y-8">
                        {PRIVILEGES.map((p, i) => {
                            const imageUrl = membershipImages[p.id];
                            const isReversed = i % 2 === 1;
                            return (
                                <div
                                    key={p.id}
                                    className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white border border-[#EEE5D5] overflow-hidden`}
                                >
                                    {/* Portrait Image */}
                                    <div className="relative w-full md:w-[38%] aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-[#EDE6DA] flex-shrink-0 overflow-hidden">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={p.title}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                <span className="font-serif text-[6rem] leading-none text-[#D4C8B4] select-none">{p.number}</span>
                                                <span className="text-[9px] tracking-[0.3em] uppercase text-[#BCA06F]">{p.category}</span>
                                            </div>
                                        )}
                                        {/* Gold corner accent */}
                                        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#BCA06F]/60" />
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#BCA06F]/60" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-10 md:py-14">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="font-serif text-[3rem] leading-none text-[#EEE5D5] select-none">{p.number}</span>
                                            <span className="text-[9px] tracking-[0.3em] uppercase text-[#BCA06F] border border-[#BCA06F]/30 px-3 py-1 bg-[#BCA06F]/5">{p.category}</span>
                                        </div>
                                        <h3 className="font-serif text-3xl md:text-4xl text-[#1C3A2A] mb-4 leading-tight">{p.title}</h3>
                                        <p className="text-[#7A6F5E] text-sm leading-relaxed font-light mb-7 max-w-lg">{p.description}</p>
                                        <div className="w-8 h-[1.5px] bg-[#BCA06F] mb-7" />
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                            {p.items.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-[#4A4238] text-sm">
                                                    <span className="text-[#BCA06F] mt-[3px] flex-shrink-0 text-[10px]">✦</span>
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Why Membership ───────────────────────────────────────────── */}
            <section className="bg-[#F7F2E8] border-y border-[#EEE5D5] py-20 md:py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="inline-block w-10 h-[1px] bg-[#BCA06F] mb-6" />
                        <h2 className="font-serif text-3xl md:text-4xl text-[#1C3A2A]">Why Join?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            {
                                title: 'Year-Round Value',
                                body: 'Your membership pays for itself. From complimentary stays to dining discounts, every visit becomes more rewarding.',
                            },
                            {
                                title: 'Priority Access',
                                body: 'Skip the queue. Members enjoy first access to reservations, wellness facilities, and exclusive hotel events.',
                            },
                            {
                                title: 'Personalised Hospitality',
                                body: 'Our team knows you by name. Expect preferences remembered, requests anticipated, and every detail attended to.',
                            },
                        ].map(({ title, body }) => (
                            <div key={title} className="text-center">
                                <div className="w-10 h-[1px] bg-[#BCA06F] mx-auto mb-6" />
                                <h3 className="font-serif text-xl text-[#1C3A2A] mb-4">{title}</h3>
                                <p className="text-[#6B6158] text-sm leading-relaxed font-light">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <section className="relative py-24 md:py-32 px-6 overflow-hidden bg-[#FDFAF5]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(188,160,111,0.09)_0%,transparent_70%)]" />
                <div className="relative z-10 max-w-xl mx-auto text-center">
                    <span className="inline-block w-10 h-[1px] bg-[#BCA06F] mb-8" />
                    <h2 className="font-serif text-4xl md:text-5xl text-[#1C3A2A] mb-4 leading-tight">
                        Join a Circle<br />of Distinction
                    </h2>
                    <p className="text-[#7A6F5E] text-base md:text-lg leading-relaxed font-light mb-10 max-w-sm mx-auto">
                        Membership is limited and by application. Secure your place in the Olivia Lifestyle today.
                    </p>
                    <MembershipEnrollmentTrigger className="bg-[#BCA06F] text-white px-12 py-4 text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-[#A8893A] transition-colors shadow-[0_8px_32px_rgba(188,160,111,0.3)]" />
                    <div className="flex items-center justify-center gap-5 mt-10">
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                        <span className="text-[#BCA06F] text-sm">✦</span>
                        <span className="w-10 h-[1px] bg-[#E0D4BE]" />
                    </div>
                </div>
            </section>

            {/* ── Terms & Conditions ───────────────────────────────────────── */}
            <section id="terms" className="max-w-3xl mx-auto px-6 py-14 border-t border-[#EEE5D5]">
                <details className="group marker:content-['']">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-4">
                            <span className="w-6 h-[1px] bg-[#BCA06F]" />
                            <h4 className="text-sm tracking-[0.22em] uppercase text-[#5D5450] font-medium">Terms &amp; Conditions</h4>
                        </div>
                        <ChevronDown className="w-5 h-5 text-[#BCA06F] transform group-open:rotate-180 transition-transform duration-300 flex-shrink-0" />
                    </summary>
                    <div className="mt-8 pl-10">
                        <ul className="space-y-3">
                            {TERMS.map((term, i) => (
                                <li key={i} className="flex items-start gap-3 text-[#7A6F5E] text-sm leading-relaxed">
                                    <span className="text-[#BCA06F] flex-shrink-0 mt-0.5 text-xs">✦</span>
                                    {term}
                                </li>
                            ))}
                        </ul>
                    </div>
                </details>
            </section>

        </main>
    );
}
