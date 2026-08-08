
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;
            const isAdmin = role === 'admin';
            const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');

            if (isOnAdminPanel) {
                if (!isLoggedIn) return false;
                if (isAdmin) return true;

                // The WhatsApp module has its own roles (marketing, front desk,
                // viewer) with per-capability checks inside. They are admitted to
                // that module only — deliberately not to the rest of the panel,
                // which has no such checks and would hand them bookings, pricing
                // and payments as a side effect.
                if (nextUrl.pathname.startsWith('/admin/whatsapp')) {
                    return role === 'marketing' || role === 'frontdesk' || role === 'viewer';
                }

                return false;
            }
            return true;
        },
    }
} satisfies NextAuthConfig
