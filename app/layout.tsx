import type { Metadata } from "next";
import { Inter, Playfair_Display, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
