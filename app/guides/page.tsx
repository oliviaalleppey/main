import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { GUIDES } from '@/lib/guides';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/structured-data';

export const metadata = pageMetadata({
    title: 'Alleppey Travel Guides',
    description:
        'Plan your Alleppey trip: things to do, the best time to visit, houseboat vs resort, and where to stay for the Nehru Trophy Boat Race.',
    path: '/guides',
});

export default function GuidesPage() {
    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
            <JsonLd data={breadcrumbSchema([{ name: 'Guides', path: '/guides' }])} />
            <section className="px-6 md:px-12 pt-36 pb-16 text-center">
                <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">Olivia Alleppey</p>
                <h1 className="text-4xl md:text-6xl font-serif text-[var(--text-dark)] tracking-wide">Alleppey Travel Guides</h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg text-[#403A35] leading-relaxed">
                    Local advice for planning your stay on the Kerala backwaters.
                </p>
            </section>
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
                    {GUIDES.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="block bg-white border border-[#DED6CB] hover:border-[var(--gold-accent)] transition-colors p-8"
                        >
                            <h2 className="text-2xl font-serif text-[var(--text-dark)] mb-3">{guide.h1}</h2>
                            <p className="text-[#59544D] leading-relaxed">{guide.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
