import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMetadata, absoluteUrl, BRAND } from '@/lib/seo';
import { GUIDES, getGuide } from '@/lib/guides';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema, faqSchema, HOTEL_ID } from '@/lib/structured-data';

export const dynamicParams = false;

export function generateStaticParams() {
    return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const guide = getGuide(slug);
    if (!guide) return { title: 'Guide Not Found', robots: { index: false, follow: false } };
    return pageMetadata({ title: guide.title, description: guide.description, path: `/guides/${slug}` });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const guide = getGuide(slug);
    if (!guide) notFound();

    const url = absoluteUrl(`/guides/${guide.slug}`);
    const related = GUIDES.filter((other) => other.slug !== guide.slug);

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
            <JsonLd
                data={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: guide.h1,
                        description: guide.description,
                        mainEntityOfPage: url,
                        dateModified: guide.updated,
                        datePublished: guide.updated,
                        author: { '@type': 'Organization', name: BRAND },
                        publisher: { '@id': HOTEL_ID },
                    },
                    faqSchema(guide.faqs),
                    breadcrumbSchema([
                        { name: 'Guides', path: '/guides' },
                        { name: guide.h1, path: `/guides/${guide.slug}` },
                    ]),
                ]}
            />

            <article className="px-6 md:px-12 pt-36 pb-16">
                <div className="max-w-3xl mx-auto">
                    <nav className="text-xs tracking-[0.2em] uppercase text-[#6B645C] mb-6">
                        <Link href="/guides" className="hover:text-[var(--text-dark)]">Guides</Link>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-serif text-[var(--text-dark)] tracking-wide leading-tight mb-8">
                        {guide.h1}
                    </h1>
                    <p className="text-xl text-[#403A35] leading-relaxed mb-12">{guide.intro}</p>

                    {guide.sections.map((section) => (
                        <section key={section.heading} className="mb-10">
                            <h2 className="text-2xl md:text-3xl font-serif text-[var(--text-dark)] mb-4">{section.heading}</h2>
                            <div className="space-y-4 text-[#403A35] text-lg leading-relaxed">
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className="mt-14 mb-12">
                        <h2 className="text-2xl md:text-3xl font-serif text-[var(--text-dark)] mb-6">Frequently asked questions</h2>
                        <dl className="space-y-6">
                            {guide.faqs.map((faq) => (
                                <div key={faq.question}>
                                    <dt className="font-serif text-xl text-[var(--text-dark)] mb-2">{faq.question}</dt>
                                    <dd className="text-[#403A35] leading-relaxed">{faq.answer}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="bg-white border border-[#DED6CB] p-8 text-center mb-14">
                        <p className="font-serif text-2xl text-[var(--text-dark)] mb-4">Stay at Finishing Point, Punnamada</p>
                        <Link
                            href={guide.cta.href}
                            className="inline-block bg-[var(--btn-dark)] text-white px-8 py-3 text-[11px] tracking-[0.22em] uppercase"
                        >
                            {guide.cta.label}
                        </Link>
                    </div>

                    <h2 className="text-xl font-serif text-[var(--text-dark)] mb-4">More guides</h2>
                    <ul className="space-y-2">
                        {related.map((other) => (
                            <li key={other.slug}>
                                <Link href={`/guides/${other.slug}`} className="underline text-[#403A35] hover:text-[var(--text-dark)]">
                                    {other.h1}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </article>
        </main>
    );
}
