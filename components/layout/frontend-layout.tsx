'use client';

import { usePathname } from 'next/navigation';
import RosewoodHeader from './rosewood-header';
import RosewoodFooter from './rosewood-footer';

interface FrontendLayoutProps {
    children: React.ReactNode;
}

export default function FrontendLayout({ children }: FrontendLayoutProps) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    // Also exclude if it's a standalone separate layout (optional, but sticking to admin for now)
    // If you have specific auth pages that shouldn't have headers, add them here.

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <RosewoodHeader />
            <div className="flex-grow">
                {children}
            </div>
            <RosewoodFooter />
        </div>
    );
}
