import { signIn, signOut, useSession } from "next-auth/react"
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function RosewoodHeader() {
    const { data: session } = useSession();
    const [isTopBarVisible, setIsTopBarVisible] = useState(true);
    const lastScrollY = useRef(0);
    const googleSignIn = () => signIn("google");
    const isAdminUser =
        !!session?.user &&
        'role' in session.user &&
        (session.user as { role?: string }).role === 'admin';

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const delta = currentScrollY - lastScrollY.current;

                if (currentScrollY <= 12) {
                    setIsTopBarVisible(true);
                } else if (delta > 8) {
                    setIsTopBarVisible(false);
                } else if (delta < -8) {
                    setIsTopBarVisible(true);
                }

                lastScrollY.current = currentScrollY;
                ticking = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-[#FBFBF9] shadow-sm">
            {/* Top Bar - Minimalist with underlined links */}
            <div
                className={`overflow-hidden border-gray-200/20 transition-[max-height,opacity] duration-200 ease-out ${isTopBarVisible
                    ? 'max-h-12 border-b opacity-100'
                    : 'max-h-0 border-b-0 opacity-0'
                    }`}
            >
                <div className="flex justify-between items-center px-6 md:px-12 py-3 text-[11px] font-medium font-sans text-gray-900">
                    {/* Kept text-gray-900 for safety unless requested otherwise */}
                    <div className="flex gap-6">
                        <Link href="#" className="hover:opacity-70 transition-opacity">
                            Olivia International
                        </Link>
                    </div>
                    <div className="flex gap-6 items-center">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <span>Welcome, {session.user?.name}</span>
                                <button onClick={() => signOut()} className="hover:opacity-70 transition-opacity">
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => googleSignIn()} className="hover:opacity-70 transition-opacity">
                                Sign In
                            </button>
                        )}
                        {/* Admin Link */}
                        {isAdminUser && (
                            <Link href="/admin" className="hover:opacity-70 transition-opacity font-bold">
                                Admin Panel
                            </Link>
                        )}
                        <Link href="/membership" className="hover:opacity-70 transition-opacity">
                            Membership
                        </Link>
                        <button className="hover:opacity-70 transition-opacity">
                            English
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Bar - Rosewood Style */}
            <div className="flex justify-between items-center px-6 md:px-12 py-4">

                {/* Left: Brand Logo + Dropdown */}
                <div className="flex items-center gap-2 w-1/4">
                    <Link href="/" className="flex items-center group">
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight text-gray-900">Olivia</span>
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight text-gray-900 ml-2">Alleppey</span>
                    </Link>

                </div>

                {/* Center: Navigation Links (Serif, Elegant) */}
                <nav className="hidden xl:flex justify-center items-center gap-6 w-2/4">
                    {['Discover', 'Offers', 'Accommodation', 'Wedding', 'Dining', 'Wellness', 'Experiences', 'Conference & Events'].map((item) => (
                        <Link
                            key={item}
                            href={`/${item.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`}
                            className={`font-serif hover:opacity-70 transition-colors text-gray-600 hover:text-gray-900 ${item === 'Conference & Events'
                                ? 'text-base whitespace-nowrap'
                                : 'text-lg'
                                }`}
                        >
                            {item}
                        </Link>
                    ))}
                    <Link href="/shop" className="font-serif text-lg hover:opacity-70 transition-colors flex items-start gap-0.5 text-gray-600 hover:text-gray-900">
                        Shop
                        <span className="text-[10px] leading-none mt-1">↗</span>
                    </Link>
                </nav>

                {/* Right: Solid Reserve Button */}
                <div className="flex justify-end items-center w-1/4">
                    <Link
                        href="#booking-search"
                        className="hidden md:inline-block bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#15443B] transition-colors"
                    >
                        Reserve
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button className="xl:hidden p-2 text-gray-900">
                        <span className="sr-only">Menu</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
