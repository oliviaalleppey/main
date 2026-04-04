'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS: Array<{ label: string; href: string; activePrefixes?: string[] }> = [
    { label: 'Home', href: '/' },
    { label: 'Discover', href: '/discover' },
    { label: 'Accommodation', href: '/rooms' },
    { label: 'Wedding', href: '/wedding' },
    { label: 'Conference & Events', href: '/conference-events' },
    { label: 'Dining', href: '/dining' },
    { label: 'Wellness', href: '/wellness' },
    { label: 'Membership', href: '/membership' },
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

    const phoneIcon = (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    );

    const handleReserve = () => {
        setIsMobileMenuOpen(false);
        const el = document.getElementById('rooms');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#rooms');
            return;
        }
        router.push('/#rooms');
    };

    return (
        <header ref={headerRef} className="sticky top-0 z-50 bg-white shadow-sm">

            {/* ── Top bar (sign-in / language) — hides on scroll ── */}
            <div
                className={`hidden md:block overflow-hidden border-gray-200/20 duration-200 ease-out ${
                    enableTopBarAnimation ? 'transition-[height,opacity,border-color]' : ''
                } ${isTopBarVisible ? 'h-9 border-b opacity-100' : 'h-0 border-b-0 opacity-0 pointer-events-none'}`}
            >
                <div className="flex justify-end items-center px-6 md:px-10 py-1.5 text-xs font-medium font-sans text-[#23201C]">
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
                        <button className="hover:opacity-70 transition-opacity">English</button>
                    </div>
                </div>
            </div>

            {/* ── Main header row ── */}
            {/*
                Layout math at xl (1280px), px-10 = 80px total padding, gap-3 = 12px:
                  Logo (shrink-0): ~250px  |  Nav (flex-1): ~766px  |  Reserve (shrink-0): ~120px
                  80 + 250 + 12 + 766 + 12 + 120 = 1240px  ✓ fits inside 1280px
            */}
            <div className="flex items-center gap-3 px-6 md:px-10 h-[68px] md:h-[76px] min-w-0">

                {/* Logo */}
                <Link
                    href="/"
                    className="shrink-0 flex items-center"
                    aria-label="Olivia Alleppey"
                >
                    <Image
                        src="/images/olivia-logo.svg"
                        alt="Olivia Alleppey"
                        width={500}
                        height={120}
                        className="h-[62px] md:h-[96px] w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Desktop nav — flex-1 so it fills the middle, centered */}
                <nav className="hidden xl:flex flex-1 justify-center items-center min-w-0 self-stretch">
                    {NAV_ITEMS.map((item) => {
                        const isActive = isNavActive(pathname, item);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`relative flex items-center h-full font-sans text-[15px] tracking-[0.03em] whitespace-nowrap transition-colors px-4 ${
                                    isActive
                                        ? 'text-[var(--brand-primary)] font-semibold'
                                        : 'text-[#3A342D] font-medium hover:text-[#111]'
                                }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span className="absolute bottom-3 left-4 right-4 h-[2px] bg-[var(--gold-accent)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile spacer — pushes right-side items to edge on mobile */}
                <div className="flex-1 xl:hidden" />

                {/* Right-side buttons */}
                <div className="flex items-center gap-2 shrink-0">

                    {/* Instant Book — desktop wide screens only (2xl) */}
                    <a
                        href="tel:+918075416514"
                        className="hidden 2xl:flex items-center gap-2 bg-[var(--brand-primary)] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-5 h-[46px] hover:bg-[var(--brand-primary-dark)] transition-colors whitespace-nowrap"
                    >
                        {phoneIcon}
                        Instant Book
                    </a>

                    {/* Reserve — desktop (xl+) */}
                    <button
                        type="button"
                        onClick={handleReserve}
                        className="hidden xl:flex items-center justify-center bg-[var(--brand-primary)] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 h-[46px] hover:bg-[var(--brand-primary-dark)] transition-colors whitespace-nowrap"
                    >
                        Reserve
                    </button>

                    {/* Instant Book — mobile compact (below xl) */}
                    <a
                        href="tel:+918075416514"
                        className="xl:hidden flex items-center gap-1.5 bg-[var(--brand-primary)] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2.5 hover:bg-[var(--brand-primary-dark)] transition-colors whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Instant Book
                    </a>

                    {/* Hamburger — mobile only (below xl) */}
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

            {/* ── Mobile drawer ── */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Close menu overlay"
                        className="fixed inset-0 z-[60] bg-black/35 xl:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <aside className="fixed inset-y-0 right-0 z-[70] w-[86%] max-w-sm bg-[var(--surface-cream)] border-l border-[#D9D0C4] shadow-2xl xl:hidden overflow-y-auto">

                        {/* Drawer header */}
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

                        {/* CTA buttons */}
                        <div className="px-6 py-5 space-y-3">
                            <a
                                href="tel:+918075416514"
                                className="flex items-center justify-center gap-2 w-full bg-[var(--brand-primary)] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[var(--brand-primary-dark)] transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {phoneIcon}
                                Instant Book
                            </a>
                            <button
                                type="button"
                                className="block w-full text-center bg-[var(--brand-primary)] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[var(--brand-primary-dark)] transition-colors"
                                onClick={handleReserve}
                            >
                                Reserve
                            </button>
                        </div>

                        {/* Nav links */}
                        <nav className="px-6 pb-6 border-b border-gray-200 space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = isNavActive(pathname, item);
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block py-4 border-b border-gray-100 last:border-b-0 text-[17px] font-serif font-semibold transition-colors pl-4 ${
                                            isActive
                                                ? 'text-[var(--brand-primary)] border-l-[3px] border-l-[var(--gold-accent)] bg-[var(--gold-accent)]/[0.06] pl-3'
                                                : 'text-[var(--text-dark)] border-l-[3px] border-l-transparent'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Auth / language */}
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
                            <button className="block hover:opacity-70 transition-opacity">English</button>
                        </div>
                    </aside>
                </>
            )}
        </header>
    );
}
