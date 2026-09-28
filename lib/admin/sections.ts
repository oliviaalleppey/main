/**
 * The admin panel's sections, and the URLs that belong to each.
 *
 * This is the single source of truth for three things that used to be written
 * out separately and drift apart: the sidebar menu, the grant checkboxes on
 * /admin/staff, and the permission check at the top of each page. A section that
 * is not in this list cannot be granted, cannot appear in the menu, and — because
 * `sectionForPath` falls through to null — is admin-only by default.
 *
 * Adding a section is a change to this file plus a `requireSection` line on the
 * page. Forgetting the second one fails closed: the page stays admin-only.
 */

export const ADMIN_SECTIONS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Occupancy and booking summary on the admin home page.',
        paths: ['/admin'],
        exact: true,
    },
    {
        key: 'bookings',
        label: 'Bookings',
        description: 'Guest reservations, payment status and confirmation retries.',
        paths: ['/admin/bookings'],
    },
    {
        key: 'availability',
        label: 'Availability',
        description: 'Room availability calendar and date blocking.',
        paths: ['/admin/availability'],
    },
    {
        key: 'pricing',
        label: 'Pricing',
        description: 'Nightly rates, pricing rules and rate plans.',
        paths: ['/admin/pricing', '/admin/rooms/rate-plans'],
    },
    {
        key: 'rooms',
        label: 'Room Types',
        description: 'Room type definitions and physical room inventory.',
        // Deliberately after 'pricing' in this list: /admin/rooms/rate-plans is a
        // pricing screen that lives under the rooms URL tree, and sectionForPath
        // takes the longest matching prefix, so it resolves to pricing regardless
        // of order. Order here only controls the menu.
        paths: ['/admin/rooms'],
    },
    {
        key: 'add-ons',
        label: 'Add-ons',
        description: 'Bookable extras offered during checkout.',
        paths: ['/admin/add-ons'],
    },
    {
        key: 'offers',
        label: 'Promo Codes',
        description: 'Discount codes and promotional offers.',
        paths: ['/admin/offers'],
    },
    {
        key: 'memberships',
        label: 'Memberships',
        description: 'Membership applications and their approval status.',
        paths: ['/admin/memberships'],
    },
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        description: 'Guest messaging, campaigns and templates.',
        paths: ['/admin/whatsapp'],
    },
    {
        key: 'media',
        label: 'Media',
        description: 'Page images, room photography and hero media.',
        paths: ['/admin/media'],
    },
    {
        key: 'gallery',
        label: 'Gallery',
        description: 'The public gallery and its tabs.',
        paths: ['/admin/gallery'],
    },
    {
        key: 'settings',
        label: 'Site Appearance',
        description: 'Colour palette and homepage hero images.',
        paths: ['/admin/settings'],
    },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];
export type SectionKey = AdminSection['key'];

/**
 * Where each section's menu entry and redirects point.
 *
 * Separate from `paths` because a section can own several URL prefixes but has
 * only one front door: pricing covers /admin/rooms/rate-plans as well, and rooms
 * opens on its types tab rather than the bare /admin/rooms redirect.
 */
export const SECTION_HREFS: Record<SectionKey, string> = {
    dashboard: '/admin',
    bookings: '/admin/bookings',
    availability: '/admin/availability',
    pricing: '/admin/pricing',
    rooms: '/admin/rooms/types',
    'add-ons': '/admin/add-ons',
    offers: '/admin/offers',
    memberships: '/admin/memberships',
    whatsapp: '/admin/whatsapp',
    media: '/admin/media',
    gallery: '/admin/gallery',
    settings: '/admin/settings',
};

export const SECTION_KEYS: SectionKey[] = ADMIN_SECTIONS.map((s) => s.key);

export function isSectionKey(value: string | null | undefined): value is SectionKey {
    return !!value && (SECTION_KEYS as string[]).includes(value);
}

export function sectionByKey(key: SectionKey): AdminSection {
    // Non-null: SectionKey is derived from the same list.
    return ADMIN_SECTIONS.find((s) => s.key === key)!;
}

/**
 * Which section a URL belongs to, or null if none claims it.
 *
 * Longest prefix wins, so /admin/rooms/rate-plans resolves to `pricing` rather
 * than `rooms` even though both could match. Returning null means "no section
 * owns this URL" — callers must treat that as admin-only, never as public.
 */
export function sectionForPath(pathname: string): SectionKey | null {
    let best: { key: SectionKey; length: number } | null = null;

    for (const section of ADMIN_SECTIONS) {
        for (const path of section.paths) {
            const matches = 'exact' in section && section.exact
                ? pathname === path
                : pathname === path || pathname.startsWith(`${path}/`);

            if (matches && (!best || path.length > best.length)) {
                best = { key: section.key, length: path.length };
            }
        }
    }

    return best?.key ?? null;
}

/**
 * Sections that are never grantable, whatever the checkbox grid says.
 *
 * Staff management is the one that matters: granting it to a staff member would
 * let them grant themselves every other section, which is the whole permission
 * system undone in two clicks.
 */
export const ADMIN_ONLY_PATHS = ['/admin/staff'];

export function isAdminOnlyPath(pathname: string): boolean {
    return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
