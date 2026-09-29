/**
 * Where to send someone after they sign in.
 *
 * /signin used to send everyone to /admin. Once NextAuth's sign-in page was
 * pointed at /signin (for staff accounts), that included guests coming from My
 * Bookings: they signed in, were sent to /admin, were refused as non-staff and
 * sent back to sign in — and never reached their bookings.
 *
 * Only a path on this site is honoured. Anything else — another domain,
 * `//evil.example`, `javascript:` — falls back to the default, because a sign-in
 * page that redirects wherever its URL says is a ready-made phishing link.
 */
const OWN_HOSTS = new Set(['oliviaalleppey.com', 'www.oliviaalleppey.com', 'localhost', '127.0.0.1']);

export function safeCallbackPath(raw: string | string[] | null | undefined, fallback = '/admin'): string {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value || typeof value !== 'string') return fallback;

    let url: URL;
    try {
        // A relative path resolves against a placeholder origin we then require.
        url = new URL(value, 'https://oliviaalleppey.com');
    } catch {
        return fallback;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
    if (!OWN_HOSTS.has(url.hostname)) return fallback;
    // "//evil.example/x" parses as a host, and is caught above; a bare "/" path
    // with a backslash trick ("/\\evil.example") is normalised by URL too.
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith('/') || path.startsWith('//')) return fallback;
    // Never loop back into the sign-in page itself.
    if (path === '/signin' || path.startsWith('/signin?') || path.startsWith('/api/auth/')) return fallback;
    return path;
}

/** Guests arrive from My Bookings; everyone else from the admin panel. */
export function isGuestDestination(path: string): boolean {
    return path === '/my-bookings' || path.startsWith('/my-bookings/') || path.startsWith('/my-bookings?');
}
