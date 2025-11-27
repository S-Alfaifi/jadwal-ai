
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { PT_Sans } from 'next/font/google';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: 'Jadwal.Ai',
  description: 'An intelligent, user-friendly application that helps university students generate conflict-free class schedules.',
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const saudiFont = localFont({
  src: [
    {
      path: '../assets/fonts/SaudiWeb-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SaudiWeb-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-saudi',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(ptSans.variable, saudiFont.variable)}>
      <body className={cn("font-body antialiased min-h-screen")}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              {children}
              <Toaster />
            </LanguageProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
