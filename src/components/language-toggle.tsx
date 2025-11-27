
"use client"

import * as React from "react"
import { useLanguage } from "@/context/language-context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button variant="outline" size="icon" onClick={handleToggle} aria-label="Toggle language">
      {language === 'en' ? (
         <span className="font-arabic text-lg font-bold">ع</span>
      ) : (
        <span className="text-lg font-bold">E</span>
      )}
    </Button>
  );
}
