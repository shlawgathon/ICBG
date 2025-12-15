"use client";

import { Heart } from "lucide-react";

/**
 * Footer component with attribution and credits.
 * Displays required data source attributions and project credits.
 *
 * @returns Footer component with attribution links
 */
export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
        {/* Credits */}
        <div className="flex items-center gap-1">
          <span>Built with</span>
          <Heart className="w-3 h-3 text-primary fill-primary" />
          <span>by Santa&apos;s Engineering Team</span>
        </div>

        {/* Attribution */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© OpenStreetMap contributors</span>
          <span className="hidden sm:inline">•</span>
          <span>Powered by Mapbox</span>
          <span className="hidden sm:inline">•</span>
          <span>AI by Dedalus Labs</span>
        </div>

        {/* Year */}
        <div>
          <span>🎄 Holiday Season 2025</span>
        </div>
      </div>
    </footer>
  );
}
