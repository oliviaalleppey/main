import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import FrontendLayout from "@/components/layout/frontend-layout";
import { getColorPalette } from "@/lib/db/actions/settings-actions";
import { Toaster } from "sonner";
import JsonLd from "@/components/seo/json-ld";
import { hotelSchema, websiteSchema } from "@/lib/structured-data";
import { BRAND, SITE_URL } from "@/lib/seo";

// No `force-dynamic` here: it opted every route out of static rendering.
// Note the root layout still calls auth(), which reads cookies and therefore
// keeps routes dynamic on its own — see the SEO notes for the follow-up needed
// to make marketing pages genuinely static.

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

async function getSafeSession() {
  try {
    return await auth();
  } catch (error: any) {
    if (error?.name === 'JWTSessionError' || error?.message?.includes('JWTSessionError')) {
      return null;
    }
    console.error("[auth] Session retrieval failed:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, palette] = await Promise.all([
    getSafeSession(),
    getColorPalette(),
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
        <JsonLd data={[hotelSchema(), websiteSchema()]} />
        <SessionProvider session={session}>
          <FrontendLayout>
            {children}
          </FrontendLayout>
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
