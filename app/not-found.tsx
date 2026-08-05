import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found',
    robots: { index: false, follow: true },
};

const suggestions = [
    { href: '/rooms', label: 'Rooms & Suites' },
    { href: '/dining', label: 'Restaurants & Bars' },
    { href: '/conference-events', label: 'Conference & Events' },
    { href: '/wedding', label: 'Weddings' },
    { href: '/wellness', label: 'Spa & Wellness' },
    { href: '/contact', label: 'Contact Us' },
];

/**
 * Custom 404. Beyond the guest-facing benefit, this keeps crawlers moving:
 * a dead end with no links wastes the crawl budget spent reaching it.
 */
export default function NotFound() {
    return (
        <main className="min-h-[70vh] bg-[var(--surface-cream)] flex items-center justify-center px-6 py-24">
            <div className="max-w-2xl text-center">
                <span className="inline-block w-12 h-[1px] bg-[var(--gold-accent)] mb-6" />
                <p className="text-[10px] tracking-[0.32em] uppercase text-[#6B645C] mb-5">
                    Error 404
                </p>
                <h1 className="text-4xl md:text-5xl font-serif text-[var(--text-dark)] tracking-tight mb-5">
                    This page has checked out
                </h1>
                <p className="text-[#4F4942] font-light leading-relaxed mb-10 max-w-lg mx-auto">
                    The page you are looking for has moved or no longer exists. Let us point
                    you back towards the rest of Olivia Alleppey.
                </p>

                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-12">
                    {suggestions.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-[11px] tracking-[0.22em] uppercase text-[var(--brand-primary-dark)] underline decoration-[var(--gold-accent)] underline-offset-[6px] hover:text-black transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-10 py-4 bg-[var(--brand-primary-dark)] text-white text-[11px] tracking-[0.24em] uppercase hover:bg-black transition-colors"
                >
                    Return Home
                </Link>
            </div>
        </main>
    );
}
