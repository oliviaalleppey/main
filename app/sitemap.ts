import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { diningOutlets, roomTypes, venues } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { absoluteUrl } from "@/lib/seo";

// Regenerate at most once a day; room and outlet slugs change rarely.
export const revalidate = 86400;

type Entry = MetadataRoute.Sitemap[number];

const staticRoutes: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/rooms", priority: 0.9, changeFrequency: "weekly" },
    { path: "/dining", priority: 0.8, changeFrequency: "monthly" },
    { path: "/conference-events", priority: 0.8, changeFrequency: "monthly" },
    { path: "/wedding", priority: 0.8, changeFrequency: "monthly" },
    { path: "/wellness", priority: 0.7, changeFrequency: "monthly" },
    { path: "/discover", priority: 0.7, changeFrequency: "monthly" },
    { path: "/gallery", priority: 0.6, changeFrequency: "monthly" },
    { path: "/membership", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" },
];

/**
 * Dynamic slugs are fetched independently so one failing table cannot empty the
 * whole sitemap — a partial sitemap is far better than a 500.
 */
async function safe<T>(query: Promise<T[]>, label: string): Promise<T[]> {
    try {
        return await query;
    } catch (error) {
        console.error(`[sitemap] failed to load ${label}:`, error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const [rooms, outlets, allVenues] = await Promise.all([
        safe(
            db
                .select({ slug: roomTypes.slug, updatedAt: roomTypes.updatedAt })
                .from(roomTypes)
                // roomTypes has no isActive column; visibility is driven by `status`.
                .where(eq(roomTypes.status, "active")),
            "room types"
        ),
        safe(
            db
                .select({ slug: diningOutlets.slug })
                .from(diningOutlets)
                .where(eq(diningOutlets.isActive, true)),
            "dining outlets"
        ),
        safe(
            db
                .select({ slug: venues.slug })
                .from(venues)
                .where(eq(venues.isActive, true)),
            "venues"
        ),
    ]);

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: absoluteUrl(route.path),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const roomEntries: MetadataRoute.Sitemap = rooms.map((room) => ({
        url: absoluteUrl(`/rooms/${room.slug}`),
        lastModified: room.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const diningEntries: MetadataRoute.Sitemap = outlets.map((outlet) => ({
        url: absoluteUrl(`/dining/${outlet.slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    const venueEntries: MetadataRoute.Sitemap = allVenues.map((venue) => ({
        url: absoluteUrl(`/conference-events/${venue.slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    return [...staticEntries, ...roomEntries, ...diningEntries, ...venueEntries];
}
