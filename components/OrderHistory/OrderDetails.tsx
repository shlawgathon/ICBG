"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Gift, Mail, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
 * Props for the OrderDetails component.
 */
type OrderDetailsProps = {
  /** Order document from Convex */
  order: Order;
};

/**
 * OrderDetails displays a single order within a batch.
 * Shows product, address, and delivery status information.
 *
 * @param order - Order document to display
 * @returns Order detail row component
 */
export function OrderDetails({ order }: OrderDetailsProps) {
  // Parse shipping address
  let address = {
    streetAddress: "",
    city: "",
    state: ""
  };
  try {
    address = JSON.parse(order.shippingAddress);
  } catch {
    address.streetAddress = order.shippingAddress;
  }

  return (
    <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
      {/* Order ID and status */}
      <div className="flex items-center justify-between">
        <code className="text-xs font-mono text-muted-foreground">{order.orderId}</code>
        <StatusBadge status={order.status} />
      </div>

      {/* Product info */}
      <div className="flex items-start gap-2">
        <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{order.productName}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(order.productPrice)}</p>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate">{address.streetAddress || "Unknown Address"}</p>
          <p className="text-xs text-muted-foreground">{[address.city, address.state].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      {/* Email status */}
      {order.recipientEmail && (
        <div className="flex items-center gap-2 pt-1">
          <Mail className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">{order.recipientEmail}</span>
          {order.emailSent && (
            <Badge variant="secondary" className="text-xs py-0 px-1">
              Sent
            </Badge>
          )}
        </div>
      )}

      {/* Pairing reason if available */}
      {order.pairingReason && (
        <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">&quot;{order.pairingReason}&quot;</p>
      )}
    </div>
  );
}
