"use client";

import { usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, DollarSign, Calendar } from "lucide-react";
import { BatchCard } from "@/components/OrderHistory/BatchCard";
import { formatCurrency } from "@/lib/utils";

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
 * Props for the OrderHistoryClient component.
 */
type OrderHistoryClientProps = {
  /** Preloaded batches data from server */
  preloadedBatches: Preloaded<typeof api.orderBatches.listBatches>;
};

/**
 * Client component for order history with preloaded data.
 * Uses Convex's usePreloadedQuery for hydration.
 *
 * @param preloadedBatches - Server-preloaded batch data
 * @returns Order history list with statistics
 */
export function OrderHistoryClient({
  preloadedBatches,
}: OrderHistoryClientProps) {
  const batches = usePreloadedQuery(preloadedBatches) as Batch[];

  // Calculate statistics
  const totalBatches = batches.length;
  const totalOrders = batches.reduce((sum: number, b: Batch) => sum + b.orderCount, 0);
  const totalCost = batches.reduce((sum: number, b: Batch) => sum + b.totalCost, 0);
  const pendingBatches = batches.filter((b: Batch) => b.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBatches}</p>
                <p className="text-xs text-muted-foreground">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingBatches}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              All Batches
            </span>
            <Badge variant="secondary" className="font-mono">
              {batches.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Go to Mission Control to select delivery areas and create your
                first batch of gift orders.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {batches.map((batch: Batch) => (
                  <BatchCard key={batch._id} batch={batch} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

