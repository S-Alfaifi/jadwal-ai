
"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Linkedin } from "lucide-react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import GenerateButton from "@/components/GenerateButton";

export default function WelcomePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeToggle = (newIsDark: boolean) => {
    setTheme(newIsDark ? 'dark' : 'light');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
       <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center" dir="ltr">
            <Logo />
            <div className="flex-grow" />
            <div className="flex items-center gap-4">
                <LanguageToggle />
                <DarkModeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center container mx-auto p-4 md:p-8">
        <div className="relative px-6 pt-14 lg:px-8">
          <div className="text-center">
            <h1 className={cn('font-headline text-4xl md:text-6xl font-bold text-foreground tracking-tight', language === 'ar' && 'font-arabic md:text-7xl')}>
              {t.welcome.title}
            </h1>
            <p className={cn('text-muted-foreground mt-6 max-w-2xl mx-auto text-lg leading-8', language === 'ar' && 'font-arabic')}>
              {t.welcome.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-x-6">
                <GenerateButton onClick={() => router.push('/editor')}>
                    <span className={cn(language === 'ar' ? 'font-arabic' : '')}>{t.welcome.cta}</span>
                    {language === 'en' && <ArrowRight className="h-4 w-4" />}
                </GenerateButton>
            </div>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mt-24 pt-12 border-t">
            <h2 className={cn('font-headline text-3xl font-bold text-foreground tracking-tight', language === 'ar' && 'font-arabic md:text-4xl')}>
                {t.welcome.aboutTitle}
            </h2>
            <p className={cn('text-muted-foreground mt-4', language === 'ar' && 'font-arabic')}>
                {t.welcome.aboutMe}
            </p>
            <p className={cn('text-xs text-muted-foreground/80 mt-4 italic', language === 'ar' && 'font-arabic')}>
                {t.welcome.builtWithAi}
            </p>
            <div className="mt-6 flex justify-center items-center gap-4">
                 <a href="https://www.linkedin.com/in/sulaiman-alfaifi1" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" aria-label="Connect on LinkedIn">
                        <Linkedin className="h-4 w-4" />
                    </Button>
                </a>
            </div>
        </div>
      </main>

      <footer className="text-center py-4">
        <p className={cn('text-xs text-muted-foreground', language === 'ar' ? 'font-arabic' : '')}>
          {t.footer.rights}
        </p>
      </footer>
    </div>
  );
}
