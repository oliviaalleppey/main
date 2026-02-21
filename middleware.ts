import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig);

export default async function middleware(req: any, ctx: any) {
    try {
        return await auth(req, ctx);
    } catch (error: any) {
        console.error("Middleware Init/Execution Error:", error);
        return new Response(
            JSON.stringify({
                error: "Middleware Error",
                message: error?.message || "Unknown error",
                name: error?.name,
                stack: error?.stack
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
