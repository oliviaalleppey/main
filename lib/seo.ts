/**
 * Central SEO configuration.
 *
 * Every page title, canonical URL and JSON-LD block derives from here so the
 * brand name, contact details and domain only ever need changing in one place.
 */

export const SITE_URL = "https://oliviaalleppey.com";

/** Public-facing brand name used in titles and OG tags. */
export const BRAND = "Olivia Alleppey";

/** Registered/legal name, used as `legalName` in structured data. */
export const LEGAL_NAME = "Olivia International Hotel";

export const CONTACT = {
    phone: "+918075416514",
    phoneDisplay: "+91 8075 416 514",
    reservationsEmail: "reservation@oliviaalleppey.com",
    generalEmail: "mail@oliviaalleppey.com",
    indiaBooking: ["+914772250888", "+914772250800"],
    dubaiBooking: ["+971505587651", "+971504522043"],
} as const;

export const ADDRESS = {
    street: "Finishing Point",
    locality: "Alappuzha",
    region: "Kerala",
    postalCode: "688013",
    country: "IN",
} as const;

/** The generated social card served by app/opengraph-image.tsx. */
export const OG_IMAGE_URL = `${SITE_URL}/opengraph-image`;

/** Absolute URL for a site-relative path. Trailing slashes are normalised away. */
export function absoluteUrl(path = "/"): string {
    if (path === "/") return SITE_URL;
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${clean.replace(/\/$/, "")}`;
}

type PageMetaInput = {
    title: string;
    description: string;
    /** Site-relative path, e.g. "/rooms". Used for the canonical and OG url. */
    path: string;
    /** Absolute or site-relative image URL. Falls back to the generated OG image. */
    image?: string;
    /** Set for funnel/account pages that should stay out of the index. */
    noIndex?: boolean;
};

/**
 * Builds a complete, self-consistent Metadata object for a page.
 *
 * Note the canonical is always set explicitly: the root layout must not define
 * one, otherwise pages that omit it inherit the homepage canonical.
 */
export function pageMetadata({
    title,
    description,
    path,
    image,
    noIndex = false,
}: PageMetaInput) {
    const url = absoluteUrl(path);
    const isHome = path === "/";
    // The root layout defines `title.template` ("%s | Olivia Alleppey"), so the
    // page title must stay bare or the brand ends up in it twice. The homepage
    // opts out with `absolute` because its title already names the brand.
    const fullTitle = isHome ? title : `${title} | ${BRAND}`;
    // Setting `openGraph` on a page replaces the object inherited from the root
    // layout, so the file-based /opengraph-image is NOT picked up automatically.
    // Fall back to it explicitly, otherwise inner pages share with a blank card.
    const resolvedImage = image || OG_IMAGE_URL;

    return {
        title: isHome ? { absolute: title } : title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: BRAND,
            locale: "en_IN",
            type: "website" as const,
            images: [{ url: resolvedImage, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: "summary_large_image" as const,
            title: fullTitle,
            description,
            images: [resolvedImage],
        },
        ...(noIndex
            ? { robots: { index: false, follow: false, nocache: true } }
            : {}),
    };
}
