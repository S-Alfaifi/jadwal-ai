
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import DarkModeToggle from "./DarkModeToggle"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"
  
  const handleToggle = (newIsDark: boolean) => {
    setTheme(newIsDark ? "dark" : "light")
  }

  return <DarkModeToggle isDark={isDark} onToggle={handleToggle} />
}
