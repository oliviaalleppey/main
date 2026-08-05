import type { Metadata } from 'next';

// Authenticated guest area: personal reservation data, never indexable.
export const metadata: Metadata = {
    robots: { index: false, follow: false, nocache: true },
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return children;
}
