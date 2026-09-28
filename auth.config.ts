
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // /admin/staff adds a staff member by typing their email, which
            // writes a user row before that person has ever signed in. Without
            // this flag NextAuth refuses to attach their Google account to that
            // waiting row and fails their first sign-in with
            // OAuthAccountNotLinked.
            //
            // The "dangerous" case is a provider that reports email addresses it
            // has not verified, which would let someone claim a row by asserting
            // an address. Google is not such a provider, and Google is the only
            // one configured here.
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
    // Without this, a request the middleware turns away lands on NextAuth's own
    // generic sign-in page rather than the hotel's. Only matters now that
    // middleware.ts exists and `authorized` can actually reject anything.
    pages: { signIn: "/signin" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }

            // If updating session
            if (trigger === "update" && session?.user) {
                token.role = session.user.role;
            }

            return token;
        },
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token?.id && session.user) {
                session.user.id = token.id as string;
            }
            if (token?.role && session.user) {
                session.user.role = token.role as string;
            }
            return session;
        },
        /**
         * Coarse edge gate. Runs from middleware.ts on every /admin request.
         *
         * It answers one question — does this session belong in the panel at all
         * — and deliberately not "which sections". Sections are stored per user
         * in the database, and the edge runtime has no database access; that
         * check is lib/admin/guard.ts, called by each page.
         *
         * Note this reads the role from the session token, which is written at
         * sign-in. That is fine for widening (a promotion needs a fresh sign-in
         * to reach the panel) but must never be the last word on narrowing: a
         * staff member demoted mid-session still carries `staff` in their token
         * and passes here. The database lookup in the page guard is what turns
         * them away, which is why that layer, not this one, is the real gate.
         */
        authorized({ auth, request: { nextUrl } }) {
            if (!nextUrl.pathname.startsWith('/admin')) return true;

            const role = auth?.user?.role;
            if (!auth?.user) return false;

            return role === 'admin' || role === 'staff';
        },
    }
} satisfies NextAuthConfig
