"use client";

import { Marker } from "react-map-gl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Baby } from "lucide-react";
import type { Address } from "@/lib/types";

/**
 * Props for the AddressMarkers component.
 */
type AddressMarkersProps = {
  /** Array of addresses to display as markers */
  addresses: Address[];
  /** Optional callback when a marker is clicked */
  onMarkerClick?: (address: Address) => void;
};

/**
 * AddressMarkers displays gift delivery locations on the map.
 * Each marker shows a festive gift icon with hover tooltip
 * containing address details and household metadata.
 *
 * @param addresses - Addresses to display
 * @param onMarkerClick - Optional click handler
 * @returns Array of Marker components with tooltips
 */
export function AddressMarkers({ addresses, onMarkerClick }: AddressMarkersProps) {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      {addresses.map((address) => (
        <Marker key={address.id} longitude={address.lng} latitude={address.lat} anchor="bottom">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onMarkerClick?.(address)}
                className="relative group cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:scale-125"
                aria-label={`Address: ${address.streetAddress}`}
              >
                {/* Gift marker emoji */}
                <span className="text-2xl drop-shadow-lg animate-pulse-festive">🎁</span>

                {/* Pulse animation ring */}
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              </button>
            </TooltipTrigger>

            <TooltipContent side="top" className="max-w-xs bg-card border border-border shadow-lg">
              <div className="space-y-2 p-1">
                {/* Address */}
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{address.streetAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Household metadata */}
                {address.metadata && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {address.metadata.householdType && (
                      <Badge variant="outline" className="text-xs gap-1 border-secondary/50">
                        <Users className="w-3 h-3" />
                        {address.metadata.householdType}
                      </Badge>
                    )}
                    {address.metadata.hasChildren && (
                      <Badge variant="outline" className="text-xs gap-1 border-accent/50">
                        <Baby className="w-3 h-3" />
                        Children
                      </Badge>
                    )}
                    {address.metadata.estimatedAge && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {address.metadata.estimatedAge}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </Marker>
      ))}
    </TooltipProvider>
  );
}
