"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider component that wraps the application with next-themes context.
 * Enables dark/light mode toggling and system theme detection.
 *
 * @param children - Child components to render within the provider
 * @param props - Additional props passed to NextThemesProvider
 * @returns JSX element with theme context provider
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

