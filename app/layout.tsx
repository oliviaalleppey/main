import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";

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
  title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha, Kerala",
  description: "Experience unparalleled luxury at Olivia International Hotel, a premium 5-star property in the heart of Alappuzha, Kerala. Book your stay directly for exclusive offers.",
  keywords: ["luxury hotel", "5-star hotel", "Alappuzha hotel", "Kerala hotel", "Olivia International Hotel"],
  authors: [{ name: "Olivia International Hotel" }],
  openGraph: {
    title: "Olivia International Hotel - Luxury 5-Star Hotel in Alappuzha",
    description: "Experience unparalleled luxury at Olivia International Hotel",
    type: "website",
    locale: "en_IN",
  },
};

import { auth } from "@/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import FrontendLayout from "@/components/layout/frontend-layout";

async function getSafeSession() {
  try {
    return await auth();
  } catch (error: any) {
    // Suppress noise for common session decryption errors (invalid/expired cookies)
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
  const session = await getSafeSession();

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${cinzel.variable}`} suppressHydrationWarning>
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
