import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            // Initial sign in - fetch role from database
            if (user?.email) {
                try {
                    const dbUser = await db.query.users.findFirst({
                        where: eq(users.email, user.email),
                    });
                    if (dbUser) {
                        token.role = dbUser.role || 'user';
                        token.id = dbUser.id;
                    }
                } catch (error) {
                    console.error('Error fetching user role in JWT callback:', error);
                    // Fallback to user role if DB fails
                    token.role = 'user';
                }
            }

            // If updating session
            if (trigger === "update" && session?.user) {
                token.role = session.user.role;
            }

            return token;
        },
    }
})
