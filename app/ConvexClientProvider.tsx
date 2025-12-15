"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

/**
 * Gets the Convex URL from environment variables.
 * Provides a fallback placeholder during SSR/build to prevent errors.
 *
 * @returns The Convex deployment URL
 */
function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    // During build/SSR, provide a placeholder URL to prevent instantiation errors.
    // The actual client will be created client-side with the real URL.
    if (typeof window === "undefined") {
      return "https://placeholder.convex.cloud";
    }
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }
  return url;
}

/**
 * Provider component that wraps the application with Convex context.
 * Must wrap any components that use Convex hooks (useQuery, useMutation).
 * Lazily initializes the Convex client to handle SSR scenarios.
 *
 * @param children - Child components to render within the provider
 * @returns JSX element with Convex context provider
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(getConvexUrl()), []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
