import Link from 'next/link';

type LegalSection = {
    id: string;
    title: string;
    intro?: string;
    body?: readonly string[];
    points?: readonly string[];
};

interface RelatedLink {
    href: string;
    label: string;
}

interface LegalPageProps {
    eyebrow: string;
    title: string;
    summary: string;
    lastUpdated: string;
    highlights: string[];
    sections: LegalSection[];
    relatedLink: RelatedLink | RelatedLink[];
}

export default function LegalPage({
    eyebrow,
    title,
    summary,
    lastUpdated,
    highlights,
    sections,
    relatedLink,
}: LegalPageProps) {
    return (
        <main className="min-h-screen bg-white font-sans">

            {/* ── Document Header ─────────────────────────────────────── */}
            <header className="border-t-[3px] border-[var(--brand-primary)] bg-[#FAFAF8]">
                <div className="max-w-5xl mx-auto px-6 md:px-12 pt-12 pb-10">

                    <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-[#9A9390] mb-5">
                        Olivia International Alleppey&nbsp;&nbsp;·&nbsp;&nbsp;{eyebrow}
                    </p>

                    <h1 className="font-serif font-semibold text-[2.2rem] md:text-[2.6rem] leading-[1.18] tracking-[-0.01em] text-[#1C1C1C] mb-5">
                        {title}
                    </h1>

                    <p className="font-sans text-base leading-[1.85] text-[#4A4A4A] max-w-2xl mb-7">
                        {summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-[#6B6560]">
                        <span>Last updated: {lastUpdated}</span>
                        <span className="text-[#D0CCC8] select-none">|</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#9A9390]">Covers:</span>
                            {highlights.map((item) => (
                                <span
                                    key={item}
                                    className="border border-[#E0DADA] rounded-sm px-2.5 py-0.5 text-[11px] tracking-[0.1em] uppercase text-[#5A5550] bg-white"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <hr className="border-0 border-t border-[#E5E5E5]" />

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 md:py-16 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-x-14 items-start">

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--site-header-height,104px)+28px)] self-start">

                    <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#9A9390] mb-4">
                        Contents
                    </p>

                    <nav className="space-y-0.5">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="block text-[13px] leading-6 text-[#5A5550] hover:text-[var(--brand-primary)] border-l-2 border-transparent hover:border-[var(--brand-primary)] pl-3 py-0.5 transition-colors duration-150"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
                        <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#9A9390] mb-3">
                            Related
                        </p>
                        <div className="space-y-2">
                            {(Array.isArray(relatedLink) ? relatedLink : [relatedLink]).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#403A35] hover:text-[var(--brand-primary)] transition-colors"
                                >
                                    {link.label}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
                        <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#9A9390] mb-3">
                            Contact
                        </p>
                        <address className="not-italic text-[13px] leading-[1.9] text-[#5A5550] space-y-2">
                            <p>
                                Olivia International<br />
                                Finishing Point, Punnamada<br />
                                Alappuzha, Kerala – 688013<br />
                                India
                            </p>
                            <p>
                                <a href="mailto:reservation@oliviaalleppey.com" className="underline underline-offset-2 decoration-[#BFB9B4] hover:text-[var(--brand-primary)] transition-colors">
                                    reservation@oliviaalleppey.com
                                </a>
                                <br />
                                <a href="mailto:mail@oliviaalleppey.com" className="underline underline-offset-2 decoration-[#BFB9B4] hover:text-[var(--brand-primary)] transition-colors">
                                    mail@oliviaalleppey.com
                                </a>
                            </p>
                            <p>
                                <a href="tel:+918075416514" className="underline underline-offset-2 decoration-[#BFB9B4] hover:text-[var(--brand-primary)] transition-colors">
                                    +91 8075 416 514
                                </a>
                            </p>
                        </address>
                    </div>
                </aside>

                {/* ── Main Content ─────────────────────────────────────── */}
                <div className="min-w-0 max-w-[760px] divide-y divide-[#EFEFEF]">
                    {sections.map((section, index) => (
                        <article
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-32 py-10 md:py-12 first:pt-0"
                        >
                            <div className="flex items-baseline gap-3 mb-5">
                                <span className="text-[11px] font-medium tracking-[0.18em] text-[var(--brand-primary)] shrink-0 tabular-nums">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <h2 className="font-sans font-semibold text-[1.1rem] md:text-[1.15rem] leading-[1.4] tracking-normal text-[#1C1C1C]">
                                    {section.title}
                                </h2>
                            </div>

                            {section.intro ? (
                                <p className="text-base leading-[1.85] text-[#3A3A3A] mb-4">
                                    {section.intro}
                                </p>
                            ) : null}

                            {section.body?.map((paragraph) => (
                                <p key={paragraph} className="mt-3 text-base leading-[1.85] text-[#4A4A4A]">
                                    {paragraph}
                                </p>
                            ))}

                            {section.points?.length ? (
                                <ul className="mt-4 space-y-2.5 list-none pl-0">
                                    {section.points.map((point) => (
                                        <li key={point} className="flex items-start gap-3 text-base leading-[1.85] text-[#4A4A4A]">
                                            <span aria-hidden="true" className="text-[#BBBAB8] mt-[0.42em] shrink-0 select-none">–</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </article>
                    ))}

                    {/* ── Mobile Contact (shown below content on small screens) ── */}
                    <div className="lg:hidden pt-10">
                        <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#9A9390] mb-3">
                            Contact
                        </p>
                        <address className="not-italic text-sm leading-[1.9] text-[#5A5550] space-y-2">
                            <p>
                                Olivia International · Finishing Point, Punnamada<br />
                                Alappuzha, Kerala – 688013, India
                            </p>
                            <p>
                                <a href="mailto:reservation@oliviaalleppey.com" className="underline underline-offset-2 decoration-[#BFB9B4] hover:text-[var(--brand-primary)] transition-colors">
                                    reservation@oliviaalleppey.com
                                </a>
                                {' · '}
                                <a href="tel:+918075416514" className="underline underline-offset-2 decoration-[#BFB9B4] hover:text-[var(--brand-primary)] transition-colors">
                                    +91 8075 416 514
                                </a>
                            </p>
                        </address>
                        <div className="mt-6 space-y-2">
                            {(Array.isArray(relatedLink) ? relatedLink : [relatedLink]).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-1.5 text-sm font-medium text-[#403A35] hover:text-[var(--brand-primary)] transition-colors"
                                >
                                    {link.label}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
