"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Users, Baby, User } from "lucide-react";
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
 * AddressList displays identified addresses within the selected area.
 * Shows household metadata and supports scrolling for long lists.
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
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
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
          // Address list
          <>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm leading-tight">{address.streetAddress || "Unknown Address"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[address.city, address.state, address.postalCode].filter(Boolean).join(", ") ||
                        "Location pending"}
                    </p>

                    {/* Household metadata badges */}
                    {address.metadata && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {address.metadata.householdType && (
                          <Badge variant="outline" className="text-xs gap-1 py-0">
                            {address.metadata.householdType === "family" && <Users className="w-3 h-3" />}
                            {address.metadata.householdType === "single" && <User className="w-3 h-3" />}
                            {address.metadata.householdType === "elderly" && <User className="w-3 h-3" />}
                            {address.metadata.householdType}
                          </Badge>
                        )}
                        {address.metadata.hasChildren && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 py-0 border-accent/50 text-accent-foreground"
                          >
                            <Baby className="w-3 h-3" />
                            Children
                          </Badge>
                        )}
                        {address.metadata.estimatedAge && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {address.metadata.estimatedAge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* OSM attribution */}
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">© OpenStreetMap contributors</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
