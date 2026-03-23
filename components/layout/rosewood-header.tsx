'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS: Array<{ label: string; href: string; activePrefixes?: string[] }> = [
    { label: 'Discover', href: '/discover' },
    { label: 'Accommodation', href: '/rooms' },
    { label: 'Wedding', href: '/wedding' },
    { label: 'Conference & Events', href: '/conference-events' },
    { label: 'Dining', href: '/dining' },
    { label: 'Experiences', href: '/experiences' },
    { label: 'Wellness', href: '/wellness' },
];

const isNavActive = (pathname: string, item: { href: string; activePrefixes?: string[] }) => {
    const prefixes = item.activePrefixes?.length ? item.activePrefixes : [item.href];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export default function RosewoodHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
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
        <header ref={headerRef} className="sticky top-0 z-50 bg-white shadow-sm">
            <div
                className={`hidden md:block overflow-hidden border-gray-200/20 duration-200 ease-out ${enableTopBarAnimation ? 'transition-[height,opacity,border-color]' : ''
                    } ${isTopBarVisible ? 'h-9 border-b opacity-100' : 'h-0 border-b-0 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="flex justify-end items-center px-6 md:px-12 py-1.5 text-xs font-medium font-sans text-[#23201C]">
                    <div className="flex gap-6 items-center">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <span>Welcome, {session.user?.name}</span>
                                <Link href="/my-bookings" className="hover:opacity-70 transition-opacity font-bold">
                                    My Bookings
                                </Link>
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

            <div className="flex items-center justify-between px-6 md:px-12 h-[68px] md:h-[80px]">
                <div className="flex items-center flex-1 xl:flex-none xl:w-[250px]">
                    <Link href="/" className="inline-flex h-full items-center group whitespace-nowrap" aria-label="Olivia Alleppey">
                        <Image
                            src="/images/olivia-logo.svg"
                            alt="Olivia Alleppey"
                            width={500}
                            height={120}
                            className="h-[75px] md:h-[85px] lg:h-[95px] w-auto max-w-[400px] md:max-w-none origin-left object-contain scale-[1.3] md:scale-[1.45] translate-x-4 md:translate-x-2 transform"
                            priority
                        />
                    </Link>
                </div>

                <nav className="hidden xl:flex justify-center items-center gap-4 lg:gap-6 flex-1 px-4">
                    {NAV_ITEMS.map((item) => {
                        const isActive = isNavActive(pathname, item);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`font-serif font-medium transition-colors text-[#3A342D] hover:text-[#121212] rounded-full px-3 py-1.5 ${isActive ? 'bg-[#15443B] text-white' : ''
                                    } ${item.label === 'Conference & Events' ? 'text-base whitespace-nowrap' : 'text-lg'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <Link href="/shop" className="font-serif font-medium text-lg transition-colors flex items-start gap-0.5 text-[#3A342D] hover:text-[#121212]">
                        Shop
                        <span className="text-[10px] leading-none mt-1">↗</span>
                    </Link>
                </nav>

                <div className="flex justify-end items-center gap-1 flex-1 xl:flex-none">
                    <a
                        href="tel:+918075416514"
                        className="hidden md:flex justify-center items-center gap-2 bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] w-[165px] h-[48px] hover:bg-[#15443B] transition-colors whitespace-nowrap overflow-hidden"
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Instant Book
                    </a>

                    <button
                        type="button"
                        onClick={() => {
                            const el = document.getElementById('booking-search');
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                history.replaceState(null, '', '#booking-search');
                                return;
                            }
                            router.push('/book/search');
                        }}
                        className="hidden md:flex justify-center items-center bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] w-[165px] h-[48px] hover:bg-[#15443B] transition-colors whitespace-nowrap overflow-hidden"
                    >
                        Reserve
                    </button>

                    <a
                        href="tel:+918075416514"
                        className="md:hidden flex items-center gap-1.5 bg-[#0A332B] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2.5 hover:bg-[#15443B] transition-colors mr-2 whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Instant Book
                    </a>

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
                    <aside className="fixed inset-y-0 right-0 z-[70] w-[86%] max-w-sm bg-[#F6F1E8] border-l border-[#D9D0C4] shadow-2xl xl:hidden overflow-y-auto">
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

                        <div className="px-6 py-5 space-y-3">
                            <a
                                href="tel:+918075416514"
                                className="flex items-center justify-center gap-2 w-full bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[#15443B] transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Instant Book
                            </a>
                            <button
                                type="button"
                                className="block w-full text-center bg-[#0A332B] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[#15443B] transition-colors"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    const el = document.getElementById('booking-search');
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        history.replaceState(null, '', '#booking-search');
                                        return;
                                    }
                                    router.push('/book/search');
                                }}
                            >
                                Reserve
                            </button>
                        </div>

                        <nav className="px-6 pb-6 border-b border-gray-200 space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = isNavActive(pathname, item);
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block py-3 px-3 -mx-3 rounded-lg text-[17px] font-serif border-b border-gray-100 last:border-b-0 ${isActive ? 'bg-[#15443B] text-white' : 'text-[#1C1C1C]'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
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
                                    <Link href="/my-bookings" onClick={() => setIsMobileMenuOpen(false)} className="block font-semibold mt-2">
                                        My Bookings
                                    </Link>
                                    <button onClick={() => signOut()} className="block hover:opacity-70 transition-opacity mt-2">
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
