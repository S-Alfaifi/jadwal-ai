
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { ptSans, saudiFont } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Jadwal.Ai',
  description: 'An intelligent, user-friendly application that helps university students generate conflict-free class schedules.',
};

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
            defaultTheme="system"
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
