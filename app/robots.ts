import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin",
                    "/api/",
                    "/signin",
                    "/my-bookings",
                    // Booking funnel: thin, parameterised, and often per-session.
                    "/book/search",
                    "/book/details",
                    "/book/checkout",
                    "/book/confirmation",
                    "/book/invoice",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
