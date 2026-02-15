import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: '/auth/signin', // Optional: Custom sign-in page if we want one
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                // Fetch role from DB explicitly to ensure it's up-to-date
                const dbUser = await db.query.users.findFirst({
                    where: (users, { eq }) => eq(users.email, user.email),
                });

                // @ts-ignore
                session.user.role = dbUser?.role || 'user';
            }
            return session;
        }
    }
})
