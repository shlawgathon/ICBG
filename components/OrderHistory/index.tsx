"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, Clock } from "lucide-react";
import { BatchCard } from "./BatchCard";

/**
 * Batch type definition for the order history.
 */
type Batch = {
  _id: string;
  _creationTime: number;
  batchId: string;
  status: "PENDING" | "CONFIRMED" | "EXPORTED" | "FULFILLED";
  totalCost: number;
  orderCount: number;
  selectionPolygon?: string;
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
  notes?: string;
};

/**
 * OrderHistory displays all order batches from the Convex database.
 * Shows batch cards with status, counts, and export options.
 *
 * @returns Order history list component
 */
export function OrderHistory() {
  const batches = useQuery(api.orderBatches.listBatches);

  const isLoading = batches === undefined;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order History
          </span>
          {batches && (
            <Badge variant="secondary" className="font-mono">
              {batches.length} batches
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Select an area on the globe, pair gifts, and confirm orders to
              see them appear here.
            </p>
          </div>
        ) : (
          // Batch list
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-4 pr-4">
              {(batches as Batch[]).map((batch: Batch) => (
                <BatchCard key={batch._id} batch={batch} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

