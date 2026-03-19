'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Rooms & Suites', href: '/rooms' },
    { name: 'Dining', href: '/dining' },
    { name: 'Experiences', href: '/experiences' },
    { name: 'Events & Weddings', href: '/events' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
];

export default function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY > 50 && !isScrolled) {
                setIsScrolled(true);
            } else if (scrollY < 40 && isScrolled) {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isScrolled]);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-luxury ${isScrolled ? 'glass shadow-luxury' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex flex-col items-start select-none">
                        <span className={`font-sans text-xl font-bold tracking-[0.3em] uppercase leading-none transition-luxury ${isScrolled ? 'text-teal-deep' : 'text-white'
                            }`}>
                            Olivia
                        </span>
                        <span className={`font-sans text-[0.6rem] font-bold tracking-[0.35em] uppercase leading-none transition-luxury ml-[2px] mt-1 ${isScrolled ? 'text-teal-deep' : 'text-white'
                            }`}>
                            Alleppey
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-sm font-medium transition-luxury ${pathname === item.href
                                    ? isScrolled
                                        ? 'text-teal-deep'
                                        : 'text-white'
                                    : isScrolled
                                        ? 'text-charcoal/70 hover:text-teal-deep'
                                        : 'text-white/95 hover:text-white'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <a
                            href="tel:+918075416514"
                            className="bg-gold hover:bg-gold/90 text-off-black px-4 py-2 rounded-lg font-semibold text-sm transition-luxury shadow-gold flex items-center gap-2"
                            title="Call to Book Instantly"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call
                        </a>
                        <Link
                            href="/book"
                            className="bg-gold hover:bg-gold/90 text-off-black px-6 py-2 rounded-lg font-semibold text-sm transition-luxury shadow-gold"
                        >
                            Book Now
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`lg:hidden p-2 rounded-lg transition-luxury ${isScrolled ? 'text-teal-deep' : 'text-white'
                            }`}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden glass border-t border-white/10">
                    <div className="px-4 py-4 space-y-3">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block py-2 text-sm font-medium transition-luxury ${pathname === item.href
                                    ? 'text-teal-deep'
                                    : 'text-charcoal/70 hover:text-teal-deep'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <a
                            href="tel:+918075416514"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block w-full bg-gold hover:bg-gold/90 text-off-black px-6 py-3 rounded-lg font-semibold text-sm text-center transition-luxury shadow-gold flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Now
                        </a>
                        <Link
                            href="/book"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block w-full bg-gold hover:bg-gold/90 text-off-black px-6 py-3 rounded-lg font-semibold text-sm text-center transition-luxury shadow-gold"
                        >
                            Book Now
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
