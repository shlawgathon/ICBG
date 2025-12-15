"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, History, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Header component with navigation and theme toggle.
 * Displays the ICBG branding and primary navigation links.
 *
 * @returns Header component with navigation
 */
export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-2xl">🎅</span>
          <span className="text-primary text-lg">ICBG</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Intercontinental Ballistic Gifts
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Globe className="w-4 h-4 mr-2" />
              Mission Control
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders">
              <History className="w-4 h-4 mr-2" />
              Order History
            </Link>
          </Button>
        </nav>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}

