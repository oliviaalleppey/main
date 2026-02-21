'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BedDouble, List } from 'lucide-react';

const TABS = [
    {
        href: '/admin/rooms/types',
        label: 'Room Types',
        icon: BedDouble,
    },
    {
        href: '/admin/rooms/inventory',
        label: 'Room Inventory',
        icon: List,
    },
];

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="border-b">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium',
                                    isActive
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        '-ml-0.5 mr-2 h-5 w-5',
                                        isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                                    )}
                                />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            {children}
        </div>
    );
}
