
"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Linkedin } from "lucide-react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import Image from "next/image";
import saudiFontLogo from '@/images/saudi-font-logo.png';

export default function WelcomePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="flex flex-col min-h-screen">
       <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center" dir="ltr">
            <Logo />
            <div className="flex-grow" />
            <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center container mx-auto p-4 md:p-8">
        <div className="relative px-6 pt-14 lg:px-8">
          <div className="text-center">
            <h1 className={`font-headline text-4xl md:text-6xl font-bold text-primary-foreground tracking-tight ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t.welcome.title}
            </h1>
            <p className={`text-muted-foreground mt-6 max-w-2xl mx-auto text-lg leading-8 ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t.welcome.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-x-6">
                <Button size="lg" onClick={() => router.push('/editor')} className={language === 'ar' ? 'font-arabic' : ''}>
                    {t.welcome.cta} {language === 'en' && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                 {language === 'ar' && (
                  <div className="mt-6">
                      <Image
                        src={saudiFontLogo}
                        alt="Saudi Font Logo"
                        width={200}
                        height={120}
                        className="rounded-lg"
                        unoptimized
                      />
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mt-24 pt-12 border-t">
            <h2 className={`font-headline text-3xl font-bold text-primary-foreground tracking-tight ${language === 'ar' ? 'font-arabic' : ''}`}>
                {t.welcome.aboutTitle}
            </h2>
            <p className={`text-muted-foreground mt-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                {t.welcome.aboutMe}
            </p>
            <p className={`text-xs text-muted-foreground/80 mt-4 italic ${language === 'ar' ? 'font-arabic' : ''}`}>
                {t.welcome.builtWithAi}
            </p>
            <div className="mt-6">
                 <a href="https://www.linkedin.com/in/sulaiman-alfaifi1" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" aria-label="Connect on LinkedIn">
                        <Linkedin className="h-4 w-4" />
                    </Button>
                </a>
            </div>
        </div>
      </main>

      <footer className="text-center py-4">
        <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
          {t.footer.rights}
        </p>
      </footer>
    </div>
  );
}
