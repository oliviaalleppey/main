import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

/**
 * The edge gate on /admin.
 *
 * This file did not exist before, which meant the `authorized` callback in
 * auth.config.ts had never once run — the only thing actually keeping people out
 * of the admin panel was the check inside app/admin/layout.tsx. That was enough
 * while "admin" was the single role, and stops being enough the moment staff
 * accounts exist.
 *
 * What runs here is deliberately coarse: is there a session, and does its role
 * belong in the panel at all. Per-section permission lives in
 * lib/admin/guard.ts, because it reads the database and the edge runtime cannot.
 * The two are layers, not alternatives — this one turns an unauthenticated
 * request away cheaply, and the page guard is what actually decides access.
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
    // Everything under /admin, minus Next's internals and static assets.
    matcher: ['/admin/:path*'],
};
