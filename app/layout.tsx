import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import FrontendLayout from "@/components/layout/frontend-layout";
import { getColorPalette } from "@/lib/db/actions/settings-actions";

export const dynamic = "force-dynamic";

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
  metadataBase: new URL("https://oliviaalleppey.com"),
  title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha, Kerala",
  description: "Experience unparalleled luxury at Olivia International Hotel, a premium 5-star property in the heart of Alappuzha, Kerala. Book your stay directly for exclusive offers.",
  keywords: ["luxury hotel", "5-star hotel", "Alappuzha hotel", "Kerala hotel", "Olivia International Hotel"],
  authors: [{ name: "Olivia International Hotel" }],
  openGraph: {
    title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha",
    description: "Experience unparalleled luxury at Olivia International Hotel, a premium 5-star property in the heart of Alappuzha, Kerala.",
    type: "website",
    locale: "en_IN",
    siteName: "Olivia International Hotel",
    url: "https://oliviaalleppey.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Olivia International Hotel - Luxury in Alappuzha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha",
    description: "Experience unparalleled luxury at Olivia International Hotel.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://oliviaalleppey.com",
  },
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
        <SessionProvider session={session}>
          <FrontendLayout>
            {children}
          </FrontendLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
