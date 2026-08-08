/**
 * Mint a local admin session cookie, for looking at the admin UI on a dev machine.
 *
 * Sign-in is Google OAuth, which cannot be driven headlessly, so every screen in
 * the WhatsApp module had gone unverified visually. This uses Auth.js's own
 * `encode` with the project's AUTH_SECRET to produce the same JWT a real sign-in
 * would produce.
 *
 * It grants nothing that the secret holder does not already have, and it is only
 * useful against a server running with that same secret — i.e. localhost. It is
 * a development aid, not part of the app, and nothing imports it.
 *
 *   npx esbuild scripts/dev-session-cookie.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/cookie.cjs
 *   node --env-file=.env /tmp/cookie.cjs
 */

import { encode } from 'next-auth/jwt';

async function main() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('AUTH_SECRET is not set');

    // Over plain http the cookie is unprefixed; behind https Auth.js expects
    // __Secure-authjs.session-token instead.
    const cookieName = 'authjs.session-token';
    const maxAge = 60 * 60; // one hour is plenty for a look around

    const token = await encode({
        token: {
            name: 'Local Dev Admin',
            email: 'dev-local@example.invalid',
            sub: '00000000-0000-0000-0000-0000000000ad',
            id: '00000000-0000-0000-0000-0000000000ad',
            role: 'admin',
        },
        secret,
        salt: cookieName,
        maxAge,
    });

    console.log(JSON.stringify({ cookieName, token, maxAge }));
}

main().catch((error) => { console.error(error); process.exit(1); });
