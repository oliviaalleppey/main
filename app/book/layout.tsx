import type { Metadata } from 'next';

// The booking funnel is session-specific and parameterised. robots.txt already
// blocks crawling; this keeps it out of the index if a URL is ever discovered
// through a link or referral instead.
export const metadata: Metadata = {
    title: 'Book Your Stay',
    robots: { index: false, follow: false, nocache: true },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
    return children;
}
