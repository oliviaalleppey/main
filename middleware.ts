
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAdmin = req.auth?.user?.role === 'admin'
    const isOnAdminPanel = req.nextUrl.pathname.startsWith('/admin')

    if (isOnAdminPanel) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/api/auth/signin', req.url))
        }
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
