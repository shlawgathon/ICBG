import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema definition for ICBG order persistence.
 * Defines tables for order batches, individual orders, and address selections.
 * All tables are automatically indexed by _id and _creationTime.
 */
export default defineSchema({
  /**
   * Order batches group multiple orders from a single area selection.
   * Tracks batch-level status and aggregate cost information.
   */
  orderBatches: defineTable({
    /** Unique batch identifier with BATCH- prefix */
    batchId: v.string(),
    /** Current batch status in the fulfillment pipeline */
    status: v.union(v.literal("PENDING"), v.literal("CONFIRMED"), v.literal("EXPORTED"), v.literal("FULFILLED")),
    /** Total cost of all orders in the batch (USD) */
    totalCost: v.number(),
    /** Number of orders in this batch */
    orderCount: v.number(),
    /** GeoJSON polygon representing the selected area (stored as JSON string) */
    selectionPolygon: v.optional(v.string()),
    /** Estimated delivery window start date (ISO string) */
    estimatedDeliveryStart: v.string(),
    /** Estimated delivery window end date (ISO string) */
    estimatedDeliveryEnd: v.string(),
    /** Optional notes or metadata for the batch */
    notes: v.optional(v.string())
  })
    .index("by_batchId", ["batchId"])
    .index("by_status", ["status"]),

  /**
   * Individual orders represent a single gift delivery to one address.
   * Contains full shipping, product, and cost information.
   */
  orders: defineTable({
    /** Unique order identifier with HOHOHO- prefix */
    orderId: v.string(),
    /** Reference to parent batch */
    batchId: v.string(),
    /** Current order status in fulfillment pipeline */
    status: v.union(
      v.literal("ORDER_CREATED"),
      v.literal("PENDING_FULFILLMENT"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED")
    ),
    /** Full shipping address object (stored as JSON string for flexibility) */
    shippingAddress: v.string(),
    /** Product ASIN from the catalog */
    productAsin: v.string(),
    /** Product name at time of order (denormalized for history) */
    productName: v.string(),
    /** Product price at time of order (USD) */
    productPrice: v.number(),
    /** Shipping cost (USD, typically 0 for Santa's free delivery) */
    shippingCost: v.number(),
    /** Total order cost (product + shipping) */
    totalCost: v.number(),
    /** AI-generated reason for gift selection (optional) */
    pairingReason: v.optional(v.string()),
    /** Recipient email for notifications (optional) */
    recipientEmail: v.optional(v.string()),
    /** Whether email notification was sent successfully */
    emailSent: v.optional(v.boolean()),
    /** Estimated delivery start date (ISO string) */
    estimatedDeliveryStart: v.string(),
    /** Estimated delivery end date (ISO string) */
    estimatedDeliveryEnd: v.string()
  })
    .index("by_orderId", ["orderId"])
    .index("by_batchId", ["batchId"])
    .index("by_status", ["status"]),

  /**
   * Address selections track polygon selections made on the globe.
   * Useful for analytics and re-running deliveries to the same area.
   */
  addressSelections: defineTable({
    /** Unique selection identifier */
    selectionId: v.string(),
    /** GeoJSON polygon (stored as JSON string) */
    polygon: v.string(),
    /** Bounding box [minLng, minLat, maxLng, maxLat] as JSON string */
    boundingBox: v.string(),
    /** Number of addresses identified in this selection */
    addressCount: v.number(),
    /** Reference to batch created from this selection (optional) */
    batchId: v.optional(v.string()),
    /** Human-readable location description (e.g., "Castro District, SF") */
    locationDescription: v.optional(v.string())
  })
    .index("by_selectionId", ["selectionId"])
    .index("by_batchId", ["batchId"])
});
