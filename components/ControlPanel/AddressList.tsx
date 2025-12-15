"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, ExternalLink } from "lucide-react";
import type { Address } from "@/lib/types";

/**
 * Props for the AddressList component.
 */
type AddressListProps = {
  /** Array of identified addresses */
  addresses: Address[];
  /** Whether addresses are being loaded */
  isLoading: boolean;
};

/**
 * Generates a Google Maps search URL for an address.
 * Uses the full address string for better place matching.
 *
 * @param address - Address to generate URL for
 * @returns Google Maps URL
 */
function getGoogleMapsUrl(address: Address): string {
  const fullAddress = [
    address.streetAddress,
    address.city,
    address.state,
    address.postalCode
  ]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
}

/**
 * AddressList displays identified addresses within the selected area.
 * Addresses are clickable and open in Google Maps.
 *
 * @param addresses - Identified addresses
 * @param isLoading - Loading state
 * @returns Address list card component
 */
export function AddressList({ addresses, isLoading }: AddressListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Home className="w-4 h-4 text-secondary" />
            Identified Addresses
          </span>
          <Badge variant="secondary" className="font-mono">
            {addresses.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          // Empty state
          <div className="text-center py-6">
            <Home className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Select an area on the map to identify addresses</p>
          </div>
        ) : (
          // Address list - no fixed height, parent ScrollArea handles scrolling
          <>
            <div className="space-y-2">
              {addresses.map((address) => (
                <a
                  key={address.id}
                  href={getGoogleMapsUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                        {address.streetAddress || "Unknown Address"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[address.city, address.state, address.postalCode].filter(Boolean).join(", ") ||
                          "Location pending"}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                  </div>
                </a>
              ))}
            </div>

            {/* OSM attribution */}
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">© OpenStreetMap contributors</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
