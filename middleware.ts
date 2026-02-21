import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // NextAuth edge incompatibility workaround
    // We only protect /admin routes at the middleware level to prevent layout thrashing
    // The actual secure authorization check happens in the layout.tsx via auth()

    const isOnAdminPanel = request.nextUrl.pathname.startsWith('/admin')

    if (isOnAdminPanel) {
        // Simple check for existence of next-auth session cookie
        const sessionToken = request.cookies.get('next-auth.session-token') ||
            request.cookies.get('__Secure-next-auth.session-token')

        if (!sessionToken) {
            return NextResponse.redirect(new URL('/api/auth/signin', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
