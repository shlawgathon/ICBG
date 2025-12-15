"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Download, FileJson, FileSpreadsheet, Check, Loader2, Rocket } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * Props for the OrderSummary component.
 */
type OrderSummaryProps = {
  /** Number of orders to create */
  orderCount: number;
  /** Total cost of all orders */
  totalCost: number;
  /** Estimated delivery date string */
  estimatedDelivery: string;
  /** Callback to confirm and create orders */
  onConfirmOrders: () => Promise<void>;
  /** Whether order creation is in progress */
  isOrdering: boolean;
  /** Confirmed batch ID (after creation) */
  confirmedBatchId?: string;
};

/**
 * OrderSummary displays batch totals and provides order confirmation.
 * Includes export options for created batches.
 *
 * @param orderCount - Number of orders
 * @param totalCost - Total cost in USD
 * @param estimatedDelivery - Delivery date string
 * @param onConfirmOrders - Confirm order creation
 * @param isOrdering - Whether creation is in progress
 * @param confirmedBatchId - Created batch ID
 * @returns Order summary card component
 */
export function OrderSummary({
  orderCount,
  totalCost,
  estimatedDelivery,
  onConfirmOrders,
  isOrdering,
  confirmedBatchId
}: OrderSummaryProps) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-muted-foreground">Total Cost</p>
          </div>
        </div>

        {/* Estimated delivery */}
        <div className="text-sm">
          <p className="text-muted-foreground">Estimated Delivery</p>
          <p className="font-medium">{estimatedDelivery}</p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        {/* Confirm orders dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1" disabled={orderCount === 0 || isOrdering || !!confirmedBatchId}>
              {isOrdering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : confirmedBatchId ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmed
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  🎅 Confirm Orders
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">🎅</span>
                Confirm Gift Dispatch
              </DialogTitle>
              <DialogDescription className="pt-2 space-y-2">
                <p>
                  You are about to dispatch <strong>{orderCount} gifts</strong> totaling{" "}
                  <strong>{formatCurrency(totalCost)}</strong>.
                </p>
                <p>This action will create orders in Santa&apos;s database and prepare the gifts for delivery.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={onConfirmOrders} disabled={isOrdering}>
                  {isOrdering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Confirm Dispatch"
                  )}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={!confirmedBatchId} title="Export orders">
              <Download className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/api/orders/export?batchId=${confirmedBatchId}&format=csv`} download>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/api/orders/export?batchId=${confirmedBatchId}&format=json`} download>
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      {/* Success message */}
      {confirmedBatchId && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 rounded-lg px-3 py-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              Batch created: <code className="font-mono text-xs">{confirmedBatchId}</code>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
