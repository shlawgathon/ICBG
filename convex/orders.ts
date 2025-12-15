import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new individual order within a batch.
 * Called for each address/product pairing when batch is confirmed.
 *
 * @param orderId - Unique order identifier (HOHOHO-XXXXXXXXXX format)
 * @param batchId - Parent batch identifier
 * @param shippingAddress - Full address object as JSON string
 * @param productAsin - Product ASIN from catalog
 * @param productName - Product name (denormalized)
 * @param productPrice - Product price at order time
 * @param shippingCost - Shipping cost (typically 0 for Santa)
 * @param pairingReason - AI-generated gift selection reason (optional)
 * @param recipientEmail - Email for notifications (optional)
 * @param estimatedDeliveryStart - ISO date string for delivery window start
 * @param estimatedDeliveryEnd - ISO date string for delivery window end
 * @returns The Convex document ID of the created order
 */
export const createOrder = mutation({
  args: {
    orderId: v.string(),
    batchId: v.string(),
    shippingAddress: v.string(),
    productAsin: v.string(),
    productName: v.string(),
    productPrice: v.number(),
    shippingCost: v.number(),
    pairingReason: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    estimatedDeliveryStart: v.string(),
    estimatedDeliveryEnd: v.string()
  },
  handler: async (ctx, args) => {
    const orderDocId = await ctx.db.insert("orders", {
      orderId: args.orderId,
      batchId: args.batchId,
      status: "ORDER_CREATED",
      shippingAddress: args.shippingAddress,
      productAsin: args.productAsin,
      productName: args.productName,
      productPrice: args.productPrice,
      shippingCost: args.shippingCost,
      totalCost: args.productPrice + args.shippingCost,
      pairingReason: args.pairingReason,
      recipientEmail: args.recipientEmail,
      emailSent: false,
      estimatedDeliveryStart: args.estimatedDeliveryStart,
      estimatedDeliveryEnd: args.estimatedDeliveryEnd
    });
    return orderDocId;
  }
});

/**
 * Creates multiple orders in a single transaction (batch insert).
 * More efficient than individual createOrder calls for large batches.
 *
 * @param orders - Array of order objects to create
 * @returns Array of created order document IDs
 */
export const createOrdersBatch = mutation({
  args: {
    orders: v.array(
      v.object({
        orderId: v.string(),
        batchId: v.string(),
        shippingAddress: v.string(),
        productAsin: v.string(),
        productName: v.string(),
        productPrice: v.number(),
        shippingCost: v.number(),
        pairingReason: v.optional(v.string()),
        recipientEmail: v.optional(v.string()),
        estimatedDeliveryStart: v.string(),
        estimatedDeliveryEnd: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    const orderDocIds: string[] = [];

    for (const order of args.orders) {
      const docId = await ctx.db.insert("orders", {
        orderId: order.orderId,
        batchId: order.batchId,
        status: "ORDER_CREATED",
        shippingAddress: order.shippingAddress,
        productAsin: order.productAsin,
        productName: order.productName,
        productPrice: order.productPrice,
        shippingCost: order.shippingCost,
        totalCost: order.productPrice + order.shippingCost,
        pairingReason: order.pairingReason,
        recipientEmail: order.recipientEmail,
        emailSent: false,
        estimatedDeliveryStart: order.estimatedDeliveryStart,
        estimatedDeliveryEnd: order.estimatedDeliveryEnd
      });
      orderDocIds.push(docId);
    }

    return orderDocIds;
  }
});

/**
 * Retrieves an order by its public orderId (HOHOHO-XXXXXXXXXX).
 *
 * @param orderId - The public order identifier
 * @returns The order document or null if not found
 */
export const getOrderByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();
  }
});

/**
 * Retrieves all orders belonging to a specific batch.
 * Used for batch detail views and CSV export.
 *
 * @param batchId - The parent batch identifier
 * @returns Array of orders in the batch
 */
export const getOrdersByBatchId = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();
  }
});

/**
 * Retrieves all orders, ordered by creation time (most recent first).
 * Used for the complete order history view.
 *
 * @returns Array of all order documents
 */
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  }
});

/**
 * Retrieves orders filtered by status.
 * Useful for tracking fulfillment progress.
 *
 * @param status - Order status to filter by
 * @returns Array of orders matching the status
 */
export const getOrdersByStatus = query({
  args: {
    status: v.union(
      v.literal("ORDER_CREATED"),
      v.literal("PENDING_FULFILLMENT"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  }
});

/**
 * Updates an order's status as it moves through fulfillment.
 *
 * @param orderId - The public order identifier
 * @param status - New status to set
 * @throws Error if order not found
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal("ORDER_CREATED"),
      v.literal("PENDING_FULFILLMENT"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED")
    )
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();

    if (!order) {
      throw new Error(`Order not found: ${args.orderId}`);
    }

    await ctx.db.patch(order._id, { status: args.status });
  }
});

/**
 * Marks an order as having sent email notification.
 *
 * @param orderId - The public order identifier
 * @param emailSent - Whether email was sent successfully
 * @throws Error if order not found
 */
export const updateOrderEmailStatus = mutation({
  args: {
    orderId: v.string(),
    emailSent: v.boolean()
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();

    if (!order) {
      throw new Error(`Order not found: ${args.orderId}`);
    }

    await ctx.db.patch(order._id, { emailSent: args.emailSent });
  }
});
