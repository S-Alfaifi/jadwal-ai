
"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Languages } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import saudiFontLogo from '@/images/saudi-font-logo.png';

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]"/>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")} className="flex justify-between">
          <span>English</span>
          {language === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ar")} className="flex justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={saudiFontLogo}
              alt="Saudi Font Logo"
              width={50}
              height={42}
              className="rounded-sm"
              unoptimized
            />
            <span className="font-arabic">العربية</span>
          </div>
           {language === 'ar' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
