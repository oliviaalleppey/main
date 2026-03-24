'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarCheck,
    Settings,
    LogOut,
    BedDouble,
    Clock,
    DollarSign,
    ChevronRight,
    Sparkles,
    Tag,
    Film,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/admin/availability', label: 'Availability', icon: Clock },
    { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
    { href: '/admin/rooms/types', label: 'Room Types', icon: BedDouble },
    { href: '/admin/rooms/rate-plans', label: 'Rate Plans', icon: Tag },
    { href: '/admin/add-ons', label: 'Add-ons', icon: Sparkles },
    { href: '/admin/media', label: 'Media', icon: Film },
    { href: '/admin/settings', label: 'Site Appearance', icon: Settings },
];

interface SidebarProps {
    pendingConfirmations?: number;
    atRiskConfirmations?: number;
}

export function Sidebar({ pendingConfirmations = 0, atRiskConfirmations = 0 }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex w-64 flex-col bg-[#0A1628] min-h-screen">
            {/* Logo / Brand */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                </div>
                <div>
                    <p className="text-white font-semibold text-sm leading-tight">Olivia</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Admin Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5">
                <p className="text-white/30 text-[10px] uppercase tracking-widest px-3 py-2 font-semibold">Main Menu</p>
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/92'}`} />
                            <span className="flex-1">{item.label}</span>
                            {item.href === '/admin/bookings' && pendingConfirmations > 0 && (
                                <span
                                    className={`min-w-5 h-5 rounded-full px-1.5 text-[10px] font-bold text-white text-center flex items-center justify-center ${atRiskConfirmations > 0 ? 'bg-red-500' : 'bg-blue-500'
                                        }`}
                                >
                                    {pendingConfirmations}
                                </span>
                            )}
                            {isActive && <ChevronRight className="h-3 w-3 text-white/30" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
