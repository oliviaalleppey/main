import { Bodoni_Moda, Josefin_Sans, Poiret_One } from 'next/font/google';

// Not preloaded: the homepage imports these for the themed pop-ups, and should
// not fetch them while another theme is showing.
const poiret = Poiret_One({ subsets: ['latin'], weight: '400', variable: '--font-poiret', display: 'swap', preload: false });
const josefin = Josefin_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-josefin', display: 'swap', preload: false });
const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-bodoni', display: 'swap', preload: false });

/** Class names that define each theme's font variables. */
export const THEME_FONTS = {
    masquerade: '',
    gatsby: `${poiret.variable} ${josefin.variable}`,
    noir: bodoni.variable,
} as const;
