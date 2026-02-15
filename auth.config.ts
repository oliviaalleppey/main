
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.role = user.role;
            }

            // If updating session
            // if (trigger === "update" && session?.user) {
            //      token.role = session.user.role;
            // }

            return token;
        },
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token?.role && session.user) {
                session.user.role = token.role as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdmin = auth?.user?.role === 'admin';
            const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');

            if (isOnAdminPanel) {
                if (!isLoggedIn) return false;
                if (!isAdmin) return false;
                return true;
            }
            return true;
        },
    }
} satisfies NextAuthConfig
