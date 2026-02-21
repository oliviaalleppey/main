'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Settings,
    LogOut,
    BedDouble,
    Clock,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { href: '/admin/availability', label: 'Availability', icon: Clock },
    // { href: '/admin/pricing', label: 'Pricing Rules', icon: DollarSign }, // Managed by AxisRooms
    { href: '/admin/rooms/types', label: 'Room Types', icon: BedDouble },
    // { href: '/admin/rooms/rate-plans', label: 'Rate Plans', icon: DollarSign }, // Managed by AxisRooms
    // { href: '/admin/rooms/inventory', label: 'Room Inventory', icon: ImageIcon }, // Managed by AxisRooms
    { href: '/admin/settings', label: 'Site Appearance', icon: Settings },
];

interface SidebarProps {
    pendingConfirmations?: number;
    atRiskConfirmations?: number;
}

export function Sidebar({ pendingConfirmations = 0, atRiskConfirmations = 0 }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex w-64 flex-col bg-white border-r">
            <div className="flex h-16 items-center justify-center border-b px-6">
                <h1 className="text-xl font-bold text-gray-900">Olivia Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="flex-1">{item.label}</span>
                            {item.href === '/admin/bookings' && pendingConfirmations > 0 && (
                                <span
                                    className={`min-w-6 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white text-center ${
                                        atRiskConfirmations > 0 ? 'bg-amber-600' : 'bg-blue-600'
                                    }`}
                                >
                                    {pendingConfirmations}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
