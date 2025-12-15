"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

/**
 * Convex client instance for the ICBG application.
 * Connects to the Convex deployment specified by NEXT_PUBLIC_CONVEX_URL.
 */
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Provider component that wraps the application with Convex context.
 * Must wrap any components that use Convex hooks (useQuery, useMutation).
 *
 * @param children - Child components to render within the provider
 * @returns JSX element with Convex context provider
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
