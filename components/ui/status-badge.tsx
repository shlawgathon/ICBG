"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, BatchStatus } from "@/lib/types";

/**
 * Style mappings for each status value.
 * Uses festive color scheme with appropriate semantic colors.
 */
const statusStyles: Record<OrderStatus | BatchStatus, string> = {
  // Order statuses
  ORDER_CREATED: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  PENDING_FULFILLMENT: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  SHIPPED: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  DELIVERED: "bg-green-500/20 text-green-500 border-green-500/30",
  // Batch statuses
  PENDING: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  EXPORTED: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  FULFILLED: "bg-green-500/20 text-green-500 border-green-500/30",
};

/**
 * Props for the StatusBadge component.
 */
type StatusBadgeProps = {
  /** Status value to display */
  status: OrderStatus | BatchStatus;
  /** Additional CSS classes to apply */
  className?: string;
};

/**
 * StatusBadge displays order or batch status with appropriate styling.
 * Extends shadcn Badge with festive color scheme based on status value.
 *
 * @param status - The status value to display
 * @param className - Additional CSS classes
 * @returns Styled badge component
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs uppercase tracking-wide",
        statusStyles[status],
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

