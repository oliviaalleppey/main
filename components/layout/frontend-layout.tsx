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
    const isInvoice = pathname?.includes('/invoice');

    // Exclude header/footer for admin panel or print-optimized invoice pages
    if (isAdmin || isInvoice) {
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
