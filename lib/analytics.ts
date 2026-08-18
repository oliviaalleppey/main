/**
 * Analytics configuration.
 *
 * The GA4 measurement ID is not a secret — it is visible in the page source of
 * any site running GA — so it lives here rather than in an env var. That avoids
 * the common failure where a deploy misses the variable and tracking silently
 * stops. Override with NEXT_PUBLIC_GA_ID for a staging property if needed.
 */
export const GA_MEASUREMENT_ID =
    process.env.NEXT_PUBLIC_GA_ID || "G-DJWY37H5V5";

/**
 * Meta (Facebook) Pixel ID. Public for the same reason as the GA ID above —
 * it ships in the page source of every site running the pixel. Override with
 * NEXT_PUBLIC_META_PIXEL_ID to point a staging deploy at a test pixel.
 */
export const META_PIXEL_ID =
    process.env.NEXT_PUBLIC_META_PIXEL_ID || "1053281767683891";

/** localStorage key and cookie name written by the cookie consent banner. */
export const CONSENT_STORAGE_KEY = "olivia_cookie_consent";

/** Event the banner dispatches when the guest makes or changes their choice. */
export const CONSENT_EVENT = "cookie-consent-changed";

export type ConsentChoice = "accepted" | "essential";
