'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    'Discover',
    'Accommodation',
    'Wedding',
    'Dining',
    'Wellness',
    'Experiences',
    'Conference & Events',
];

const toNavHref = (item: string) => `/${item.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`;

export default function RosewoodHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isTopBarVisible, setIsTopBarVisible] = useState(true);
    const [enableTopBarAnimation, setEnableTopBarAnimation] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const lastScrollY = useRef(0);
    const topBarVisibleRef = useRef(true);
    const headerRef = useRef<HTMLElement | null>(null);
    const googleSignIn = () => signIn('google');
    const isAdminUser =
        !!session?.user &&
        'role' in session.user &&
        (session.user as { role?: string }).role === 'admin';

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    useLayoutEffect(() => {
        const setTopBarVisible = (visible: boolean) => {
            if (topBarVisibleRef.current === visible) return;
            topBarVisibleRef.current = visible;
            setIsTopBarVisible(visible);
        };

        const initialScrollY = window.scrollY;
        lastScrollY.current = initialScrollY;
        setTopBarVisible(initialScrollY <= 120);

        const transitionFrame = window.requestAnimationFrame(() => {
            setEnableTopBarAnimation(true);
        });

        let ticking = false;

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const delta = currentScrollY - lastScrollY.current;

                if (currentScrollY <= 24) {
                    setTopBarVisible(true);
                } else if (delta > 12 && currentScrollY > 120) {
                    setTopBarVisible(false);
                } else if (delta < -14) {
                    setTopBarVisible(true);
                }

                lastScrollY.current = currentScrollY;
                ticking = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.cancelAnimationFrame(transitionFrame);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useLayoutEffect(() => {
        const updateHeaderHeight = () => {
            if (!headerRef.current) return;
            const headerHeight = Math.round(headerRef.current.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--site-header-height', `${headerHeight}px`);
        };

        updateHeaderHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateHeaderHeight();
        });

        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        window.addEventListener('resize', updateHeaderHeight);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeaderHeight);
        };
    }, []);

    return (
        <header ref={headerRef} className="sticky top-0 z-50 bg-[#FBFBF9] shadow-sm">
            <div
                className={`hidden md:block overflow-hidden border-gray-200/20 duration-200 ease-out ${enableTopBarAnimation ? 'transition-[height,opacity,border-color]' : ''
                    } ${isTopBarVisible ? 'h-12 border-b opacity-100' : 'h-0 border-b-0 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="flex justify-between items-center px-6 md:px-12 py-3 text-[11px] font-medium font-sans text-gray-900">
                    <div className="flex gap-6">
                        <Link href="/" className="hover:opacity-70 transition-opacity">
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
                        {isAdminUser && (
                            <Link href="/admin" className="hover:opacity-70 transition-opacity font-bold">
                                Admin Panel
                            </Link>
                        )}
                        <Link href="/membership" className="hover:opacity-70 transition-opacity">
                            Membership
                        </Link>
                        <button className="hover:opacity-70 transition-opacity">English</button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-6 md:px-12 py-4">
                <div className="flex items-center flex-1 xl:w-1/4">
                    <Link href="/" className="inline-flex items-center group whitespace-nowrap">
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight text-gray-900">Olivia</span>
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight text-gray-900 ml-2">Alleppey</span>
                    </Link>
                </div>

                <nav className="hidden xl:flex justify-center items-center gap-6 w-2/4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item}
                            href={toNavHref(item)}
                            className={`font-serif hover:opacity-70 transition-colors text-gray-600 hover:text-gray-900 ${item === 'Conference & Events' ? 'text-base whitespace-nowrap' : 'text-lg'
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

                <div className="flex justify-end items-center gap-1 xl:w-1/4">
                    <Link
                        href="#booking-search"
                        className="hidden md:inline-block bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#15443B] transition-colors"
                    >
                        Reserve
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={isMobileMenuOpen}
                        className="xl:hidden p-2 text-gray-900"
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close menu overlay"
                        className="fixed inset-0 z-[60] bg-black/35 xl:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="fixed inset-y-0 right-0 z-[70] w-[86%] max-w-sm bg-[#FBFBF9] border-l border-gray-200 shadow-2xl xl:hidden overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Menu</p>
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="text-gray-900 p-1"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <Link
                                href="#booking-search"
                                className="block w-full text-center bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[#15443B] transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Reserve
                            </Link>
                        </div>

                        <nav className="px-6 pb-6 border-b border-gray-200 space-y-1">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item}
                                    href={toNavHref(item)}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-3 text-[17px] font-serif text-[#1C1C1C] border-b border-gray-100 last:border-b-0"
                                >
                                    {item}
                                </Link>
                            ))}
                            <Link
                                href="/shop"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-3 text-[17px] font-serif text-[#1C1C1C]"
                            >
                                Shop
                            </Link>
                        </nav>

                        <div className="px-6 py-5 space-y-3 text-sm text-gray-700">
                            {session ? (
                                <>
                                    <p className="text-gray-900">Welcome, {session.user?.name}</p>
                                    <button onClick={() => signOut()} className="block hover:opacity-70 transition-opacity">
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => googleSignIn()} className="block hover:opacity-70 transition-opacity">
                                    Sign In
                                </button>
                            )}
                            {isAdminUser && (
                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block font-semibold">
                                    Admin Panel
                                </Link>
                            )}
                            <Link href="/membership" onClick={() => setIsMobileMenuOpen(false)} className="block">
                                Membership
                            </Link>
                            <button className="block hover:opacity-70 transition-opacity">English</button>
                        </div>
                    </aside>
                </>
            )}
        </header>
    );
}
