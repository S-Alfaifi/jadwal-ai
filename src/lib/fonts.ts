import { PT_Sans } from 'next/font/google';
import localFont from 'next/font/local';

export const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const saudiFont = localFont({
  src: [
    {
      path: '../assets/fonts/Saudi-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Saudi-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-saudi',
});
