import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import FrontendLayout from "@/components/layout/frontend-layout";
import { getColorPalette } from "@/lib/db/actions/settings-actions";
import { Toaster } from "sonner";
import JsonLd from "@/components/seo/json-ld";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import MetaPixel from "@/components/analytics/meta-pixel";
import { hotelSchema, websiteSchema } from "@/lib/structured-data";
import { BRAND, SITE_URL } from "@/lib/seo";
import { getHeroMedia, getHomeHeroImages } from "@/app/admin/media/actions";

// Public pages are cached and rebuilt at most once a minute, so admin edits
// still show up within about a minute. A page can ask for less caching with
// its own `revalidate` (the lowest value in a route wins); the booking funnel,
// account pages and admin read cookies and so always render per request.
//
// Nothing in this layout may read cookies or headers (auth() included): doing
// so makes every page on the site render per request, which is what slowed
// first-byte times to 0.4-1s. The header loads the session in the browser.
export const revalidate = 60;

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `template` lets pages set a bare title and inherit the brand suffix.
  title: {
    default: `${BRAND} - Luxury 5-Star Hotel in Alappuzha, Kerala`,
    template: `%s | ${BRAND}`,
  },
  description:
    "Experience unparalleled luxury at Olivia Alleppey, a premium 5-star hotel at Finishing Point, Alappuzha, Kerala. Book direct for exclusive rates on lake-view rooms and suites.",
  applicationName: BRAND,
  authors: [{ name: BRAND }],
  openGraph: {
    title: `${BRAND} - Luxury 5-Star Hotel in Alappuzha`,
    description:
      "Experience unparalleled luxury at Olivia Alleppey, a premium 5-star hotel at Finishing Point, Alappuzha, Kerala.",
    type: "website",
    locale: "en_IN",
    siteName: BRAND,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} - Luxury 5-Star Hotel in Alappuzha`,
    description: "Experience unparalleled luxury at Olivia Alleppey, Kerala.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // NOTE: no `alternates.canonical` here on purpose. A canonical set in the
  // root layout is inherited by every page that does not override it, which
  // previously made the whole site canonicalise to the homepage. Pages set
  // their own canonical via pageMetadata().
};

/** Real photos of the property for the Hotel structured data. */
async function getPropertyPhotos(): Promise<string[]> {
  const [heroMedia, homeImages] = await Promise.all([
    getHeroMedia().catch(() => null),
    getHomeHeroImages().catch(() => []),
  ]);
  const photos = [
    heroMedia?.type === "image" ? heroMedia.url : null,
    ...homeImages.map((image) => image.imageUrl),
  ].filter((url): url is string => !!url);
  return [...new Set(photos)].slice(0, 5);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [palette, photos] = await Promise.all([
    getColorPalette(),
    getPropertyPhotos(),
  ]);

  const paletteVars = {
    "--brand-primary": palette.brandPrimary,
    "--brand-primary-dark": palette.brandPrimaryDark,
    "--brand-primary-deep": palette.brandPrimaryDeep,
    "--gold-accent": palette.goldAccent,
    "--gold-accent-dark": palette.goldAccentDark,
    "--gold-cta": palette.goldCta,
    "--gold-cta-dark": palette.goldCtaDark,
    "--surface-cream": palette.surfaceCream,
    "--surface-soft": palette.surfaceSoft,
    "--text-dark": palette.textDark,
    "--btn-dark": palette.btnDark,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${cinzel.variable}`}
      style={paletteVars}
      suppressHydrationWarning
    >
      <body className="font-sans subpixel-antialiased" suppressHydrationWarning>
        <JsonLd data={[hotelSchema(photos), websiteSchema()]} />
        <GoogleAnalytics />
        <MetaPixel />
        <SessionProvider>
          <FrontendLayout>
            {children}
          </FrontendLayout>
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
