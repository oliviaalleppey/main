'use client';

import React, { useState } from 'react';

interface FAQ {
    question: string;
    answer: string;
}

export default function RoomFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs: FAQ[] = [
        {
            question: "What's included in the room rate?",
            answer: "Your room rate includes complimentary WiFi, daily housekeeping, access to our fitness center and pool, in-room tea/coffee facilities, and a welcome amenity. Breakfast can be added for an additional charge."
        },
        {
            question: "Can I request early check-in or late check-out?",
            answer: "Early check-in (before 2:00 PM) and late check-out (after 11:00 AM) are subject to availability. Please contact us in advance, and we'll do our best to accommodate your request. Additional charges may apply."
        },
        {
            question: "Is the balcony private?",
            answer: "Yes, all our rooms with balconies feature private outdoor spaces exclusively for your use. Enjoy stunning lake or canal views in complete privacy and tranquility."
        },
        {
            question: "What view can I expect from this room?",
            answer: "Room views vary by availability and room type. Lake View rooms overlook the serene Vembanad Lake, while Canal View rooms offer peaceful vistas of the backwaters. Specific view requests can be noted during booking but cannot be guaranteed."
        },
        {
            question: "Are connecting rooms available?",
            answer: "Yes, we offer connecting rooms perfect for families or groups traveling together. Please request connecting rooms at the time of booking, and we'll do our best to accommodate based on availability."
        },
        {
            question: "Is smoking allowed in the rooms?",
            answer: "All our rooms are non-smoking to ensure the comfort of all guests. Designated smoking areas are available on the property. A cleaning fee will be charged if smoking is detected in the room."
        }
    ];

    return (
        <section className="relative py-20 px-6 md:px-12 bg-[#fafaf8] overflow-hidden">
            <div className="relative max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-[#B8956A] text-[10px] font-medium uppercase tracking-[0.4em] mb-6">
                        Frequently Asked
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl text-[#2c2c2c] font-light tracking-wide">
                        Questions & Answers
                    </h2>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="border border-[#2c2c2c]/10 rounded-sm overflow-hidden bg-white transition-all duration-300 hover:border-[#B8956A]/30"
                        >
                            {/* Question Button */}
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left group"
                            >
                                <span className="font-serif text-lg text-[#2c2c2c] pr-8 group-hover:text-[#B8956A] transition-colors">
                                    {faq.question}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-[#B8956A] flex-shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Answer */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-6 pb-6 pt-2">
                                    <p className="text-[#2c2c2c]/70 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-[#2c2c2c]/60 mb-4">
                        Have more questions?
                    </p>
                    <a
                        href="tel:+914772234567"
                        className="inline-flex items-center gap-2 text-[#B8956A] hover:text-[#8B6F47] transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Contact our concierge team
                    </a>
                </div>
            </div>
        </section>
    );
}
