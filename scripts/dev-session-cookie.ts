/**
 * Mint a local session cookie, for looking at the admin UI on a dev machine.
 *
 * Sign-in is Google OAuth, which cannot be driven headlessly. This uses
 * Auth.js's own `encode` with the project's AUTH_SECRET to produce the same JWT
 * a real sign-in would produce.
 *
 * The email must belong to a real row in the `user` table. Admin access is read
 * from the database on every request (lib/admin/guard.ts), not from the token,
 * so a made-up address — which is what this script used to sign — is turned
 * away at the panel. To look at the panel as staff, add that person on
 * /admin/staff first and pass their email with `staff`.
 *
 *   npx esbuild scripts/dev-session-cookie.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/cookie.cjs
 *   node --env-file=.env /tmp/cookie.cjs it@oliviaalleppey.com          # admin
 *   node --env-file=.env /tmp/cookie.cjs someone@oliviaalleppey.com staff
 *
 * Handle the output as a credential. It is signed with AUTH_SECRET, so if the
 * local .env holds the production secret the cookie is also a valid session on
 * the live site for the next hour. Use it against localhost only, do not paste
 * it anywhere, and delete /tmp/cookie.cjs's output when done.
 */

import { encode } from 'next-auth/jwt';

async function main() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('AUTH_SECRET is not set');

    const email = process.argv[2]?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
        throw new Error('Pass the email of an existing admin or staff user, e.g. it@oliviaalleppey.com');
    }

    // The token's role only gets the request past the edge middleware, which
    // admits 'admin' and 'staff'. What the person may actually open is decided by
    // their row in the database.
    const role = process.argv[3] ?? 'admin';
    if (!['admin', 'staff'].includes(role)) {
        throw new Error(`Unknown role '${role}' — use admin or staff`);
    }

    // Over plain http the cookie is unprefixed; behind https Auth.js expects
    // __Secure-authjs.session-token instead.
    const cookieName = 'authjs.session-token';
    const maxAge = 60 * 60; // one hour is plenty for a look around

    const token = await encode({
        token: {
            name: `Local Dev (${email})`,
            email,
            role,
        },
        secret,
        salt: cookieName,
        maxAge,
    });

    console.log(JSON.stringify({ cookieName, token, maxAge, email, role }));
}

main().catch((error) => { console.error(error); process.exit(1); });
