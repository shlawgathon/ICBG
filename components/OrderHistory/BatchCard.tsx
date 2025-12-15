"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronDown, Download, Package, DollarSign, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderDetails } from "./OrderDetails";

/**
 * Batch type definition.
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
 * Order type definition.
 */
type Order = {
  _id: string;
  _creationTime: number;
  orderId: string;
  batchId: string;
  status: "ORDER_CREATED" | "PENDING_FULFILLMENT" | "SHIPPED" | "DELIVERED";
  shippingAddress: string;
  productAsin: string;
  productName: string;
  productPrice: number;
  shippingCost: number;
  totalCost: number;
  pairingReason?: string;
  recipientEmail?: string;
  emailSent?: boolean;
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
};

/**
 * Props for the BatchCard component.
 */
type BatchCardProps = {
  /** Order batch document from Convex */
  batch: Batch;
};

/**
 * BatchCard displays a summary of an order batch with expandable details.
 * Shows batch status, statistics, and individual orders when expanded.
 *
 * @param batch - Batch document to display
 * @returns Collapsible batch card component
 */
export function BatchCard({ batch }: BatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Load orders when expanded
  const orders = useQuery(api.orders.getOrdersByBatchId, isOpen ? { batchId: batch.batchId } : "skip");

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-medium">{batch.batchId}</code>
                  <StatusBadge status={batch.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(new Date(batch._creationTime).toISOString())}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CardContent className="pt-0 pb-4">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{batch.orderCount}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatCurrency(batch.totalCost)}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-xs">{formatDate(batch.estimatedDeliveryStart)}</p>
                <p className="text-xs text-muted-foreground">Delivery</p>
              </div>
            </div>
          </div>

          {/* Export button */}
          <Button variant="outline" size="sm" className="w-full mb-3" asChild>
            <a href={`/api/orders/export?batchId=${batch.batchId}&format=csv`} download>
              <Download className="w-4 h-4 mr-2" />
              Export Manifest
            </a>
          </Button>

          {/* Expanded order list */}
          <CollapsibleContent>
            {orders === undefined ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">No orders in this batch</div>
            ) : (
              <div className="border-t pt-3 mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Orders ({orders.length})</p>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {(orders as Order[]).map((order: Order) => (
                      <OrderDetails key={order._id} order={order} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
