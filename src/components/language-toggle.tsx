
"use client"

import * as React from "react"
import Image from "next/image"
import { Languages } from "lucide-react"
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
  const { setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]"/>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ar")} className="justify-end">
          <div className="flex items-center gap-2">
            <Image
              src={saudiFontLogo}
              alt="Saudi Font Logo"
              width={40}
              height={32}
              className="rounded-sm"
              unoptimized
            />
            <span className="font-arabic">العربية</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
