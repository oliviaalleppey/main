'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
    Percent,
    Film,
    Users,
    MessageCircle,
    ShieldCheck,
    Image as ImageIcon,
    type LucideIcon,
} from 'lucide-react';
import { ADMIN_SECTIONS, SECTION_HREFS, type SectionKey } from '@/lib/admin/sections';

/**
 * Icons live here rather than in the section registry so that the registry stays
 * importable from server code without dragging a component library in with it.
 */
const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
    dashboard: LayoutDashboard,
    bookings: CalendarCheck,
    availability: Clock,
    pricing: DollarSign,
    rooms: BedDouble,
    'add-ons': Sparkles,
    offers: Percent,
    memberships: Users,
    whatsapp: MessageCircle,
    media: Film,
    gallery: ImageIcon,
    settings: Settings,
};

interface SidebarProps {
    pendingConfirmations?: number;
    atRiskConfirmations?: number;
    /** Administrators see every section, plus the staff-management link. */
    isAdmin: boolean;
    /** Sections a staff member holds. null for an administrator. */
    allowedSections: SectionKey[] | null;
}

export function Sidebar({
    pendingConfirmations = 0,
    atRiskConfirmations = 0,
    isAdmin,
    allowedSections,
}: SidebarProps) {
    const pathname = usePathname();

    // Hiding a link is presentation, not protection — requireSection() on each
    // page is what actually refuses a staff member who types the URL in. This
    // just stops them clicking through to a redirect.
    const granted = new Set(allowedSections ?? []);
    const navItems = ADMIN_SECTIONS.filter((section) => isAdmin || granted.has(section.key));

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
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                <p className="text-white/30 text-[10px] uppercase tracking-widest px-3 py-2 font-semibold">Main Menu</p>

                {navItems.length === 0 && (
                    <p className="px-3 py-2 text-xs text-white/40 leading-relaxed">
                        No sections have been assigned to your account yet. Ask the hotel
                        administrator to grant access.
                    </p>
                )}

                {navItems.map((section) => {
                    const Icon = SECTION_ICONS[section.key];
                    const href = SECTION_HREFS[section.key];
                    const isActive = section.key === 'dashboard'
                        ? pathname === '/admin'
                        : section.paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

                    return (
                        <Link
                            key={section.key}
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/92'}`} />
                            <span className="flex-1">{section.label}</span>
                            {section.key === 'bookings' && pendingConfirmations > 0 && (
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

                {isAdmin && (
                    <>
                        <p className="text-white/30 text-[10px] uppercase tracking-widest px-3 pt-5 pb-2 font-semibold">
                            Administration
                        </p>
                        <Link
                            href="/admin/staff"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group ${pathname.startsWith('/admin/staff')
                                ? 'bg-white/10 text-white'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <ShieldCheck className={`h-4 w-4 flex-shrink-0 ${pathname.startsWith('/admin/staff') ? 'text-amber-400' : 'text-white/40 group-hover:text-white/92'}`} />
                            <span className="flex-1">Staff Access</span>
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => signOut({ redirectTo: '/signin' })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
