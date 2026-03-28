import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    logger: {
        error(error) {
            // Silently handle common session decryption errors that often occur
            // when cookies are stale or secrets have changed.
            if (error.name === "JWTSessionError" || error.message.includes("JWTSessionError")) {
                console.warn("[auth] Session decryption failed (likely expired/invalid cookie). Falling back to anonymous.");
                return;
            }
            console.error("[auth][error]", error);
        }
    },
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
                    
                    // Automatically grant admin rights to specific emails
                    const defaultAdmins = ['it@oliviaalleppey.com', 'mail@oliviaalleppey.com'];
                    if (defaultAdmins.includes(user.email)) {
                        token.role = 'admin';
                        // Also update DB asynchronously if needed, but token.role is enough for session
                        if (dbUser && dbUser.role !== 'admin') {
                            db.update(users).set({ role: 'admin' }).where(eq(users.email, user.email)).execute().catch(console.error);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user role in JWT callback:', error);
                    // Fallback to user role if DB fails
                    token.role = 'user';
                    
                    if (user.email === 'it@oliviaalleppey.com' || user.email === 'mail@oliviaalleppey.com') {
                        token.role = 'admin';
                    }
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
