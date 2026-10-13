import { Josefin_Sans, Poiret_One } from 'next/font/google';

// Not preloaded: the homepage imports these for the Gatsby pop-up, and should
// not fetch them while the masquerade is showing.
export const poiret = Poiret_One({ subsets: ['latin'], weight: '400', variable: '--font-poiret', display: 'swap', preload: false });
export const josefin = Josefin_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-josefin', display: 'swap', preload: false });

/** Class names that define --font-poiret and --font-josefin. */
export const gatsbyFonts = `${poiret.variable} ${josefin.variable}`;
