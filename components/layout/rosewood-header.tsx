import { signIn, signOut, useSession } from "next-auth/react"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function RosewoodHeader() {
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const googleSignIn = () => signIn("google");
    // ... existing scroll effect ...

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBF9] shadow-sm transition-all duration-300">
            {/* Top Bar - Minimalist with underlined links - Hides on Scroll */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100 border-b border-gray-200'}`}>
                <div className="flex justify-between items-center px-6 md:px-12 py-3 text-[11px] font-medium font-sans">
                    <div className="flex gap-6">
                        <Link href="#" className="text-gray-900 hover:opacity-70 transition-opacity">
                            Olivia International
                        </Link>
                    </div>
                    <div className="flex gap-6 items-center">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <span className="text-gray-900">Welcome, {session.user?.name}</span>
                                <button onClick={() => signOut()} className="text-gray-900 hover:opacity-70 transition-opacity">
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => googleSignIn()} className="text-gray-900 hover:opacity-70 transition-opacity">
                                Sign In
                            </button>
                        )}
                        {/* Admin Link */}
                        {/* @ts-ignore */}
                        {session?.user?.role === 'admin' && (
                            <Link href="/admin" className="text-gray-900 hover:opacity-70 transition-opacity font-bold">
                                Admin Panel
                            </Link>
                        )}
                        <Link href="/membership" className="text-gray-900 hover:opacity-70 transition-opacity">
                            Membership
                        </Link>
                        <button className="text-gray-900 hover:opacity-70 transition-opacity">
                            English
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Bar - Rosewood Style */}
            <div className={`flex justify-between items-center px-6 md:px-12 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-5'}`}>

                {/* Left: Brand Logo + Dropdown */}
                <div className="flex items-center gap-2 w-1/4">
                    <Link href="/" className="flex flex-col text-gray-900 group">
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight">Olivia</span>
                        <span className="text-sm font-bold tracking-[0.2em] uppercase leading-tight">Alleppey</span>
                    </Link>
                    <button className="text-gray-500 mt-1 hover:text-gray-900 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Center: Navigation Links (Serif, Elegant) */}
                <nav className="hidden xl:flex justify-center items-center gap-8 w-2/4">
                    {['Discover', 'Overview', 'Offers', 'Accommodation', 'Residences', 'Dining', 'Wellness', 'Experiences', 'Events'].map((item) => (
                        <Link
                            key={item}
                            href={`/${item.toLowerCase()}`}
                            className="text-gray-600 font-serif text-lg hover:text-gray-900 transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                    <Link href="/shop" className="text-gray-600 font-serif text-lg hover:text-gray-900 transition-colors flex items-start gap-0.5">
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
