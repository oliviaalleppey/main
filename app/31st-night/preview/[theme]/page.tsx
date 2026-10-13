import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PartyExperience from '@/components/party/party-experience';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import { PARTY_BOOK_HREF, PARTY_END, PARTY_PAGE_THEMES, PARTY_THEMES, switchPartyTheme } from '@/lib/config/party-popup';

/**
 * Shows /31st-night in any theme, with the saved prices and words, so the team
 * can look at a theme before switching the live page to it in Site Appearance.
 */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
    return PARTY_PAGE_THEMES.map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
    const { theme } = await params;
    const name = PARTY_PAGE_THEMES.find((t) => t === theme);
    return {
        title: `Preview: ${name ? PARTY_THEMES[name].name : '31st Night'}`,
        robots: { index: false, follow: false },
    };
}

export default async function PartyThemePreview({ params }: { params: Promise<{ theme: string }> }) {
    const { theme } = await params;
    const name = PARTY_PAGE_THEMES.find((t) => t === theme);
    if (!name) notFound();

    const saved = await getPartyPopup();
    const content = saved.pageTheme === name ? saved : switchPartyTheme(saved, name);
    const over = Date.now() >= new Date(PARTY_END).getTime();

    return <PartyExperience content={content} over={over} bookHref={PARTY_BOOK_HREF} />;
}
