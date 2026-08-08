'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Sub-navigation for the WhatsApp module. Every section is built. */
const SECTIONS = [
    { href: '/admin/whatsapp', label: 'Overview', exact: true },
    { href: '/admin/whatsapp/contacts', label: 'Contacts' },
    { href: '/admin/whatsapp/audiences', label: 'Audiences' },
    { href: '/admin/whatsapp/templates', label: 'Templates' },
    { href: '/admin/whatsapp/campaigns', label: 'Campaigns' },
    { href: '/admin/whatsapp/inbox', label: 'Inbox' },
    { href: '/admin/whatsapp/automations', label: 'Automations' },
    { href: '/admin/whatsapp/analytics', label: 'Analytics' },
    { href: '/admin/whatsapp/compliance', label: 'Compliance' },
    { href: '/admin/whatsapp/settings', label: 'Settings' },
];

export function WhatsAppSubNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-wrap gap-1 border-b border-gray-200 pb-px">
            {SECTIONS.map((section) => {
                const isActive = section.exact
                    ? pathname === section.href
                    : pathname.startsWith(section.href);

                return (
                    <Link
                        key={section.href}
                        href={section.href}
                        className={cn(
                            'rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'border-b-2 border-gray-900 text-gray-900'
                                : 'text-gray-500 hover:text-gray-900',
                        )}
                    >
                        {section.label}
                    </Link>
                );
            })}
        </nav>
    );
}
