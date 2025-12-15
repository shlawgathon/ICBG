import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new order batch from a completed area selection and gift pairing.
 * Called when user confirms orders after gift pairing completes.
 *
 * @param batchId - Unique batch identifier (BATCH-XXXXXXXXXX format)
 * @param totalCost - Aggregate cost of all orders in the batch
 * @param orderCount - Number of individual orders in the batch
 * @param selectionPolygon - GeoJSON polygon as JSON string (optional)
 * @param estimatedDeliveryStart - ISO date string for delivery window start
 * @param estimatedDeliveryEnd - ISO date string for delivery window end
 * @param notes - Optional notes for the batch
 * @returns The Convex document ID of the created batch
 */
export const createBatch = mutation({
  args: {
    batchId: v.string(),
    totalCost: v.number(),
    orderCount: v.number(),
    selectionPolygon: v.optional(v.string()),
    estimatedDeliveryStart: v.string(),
    estimatedDeliveryEnd: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchDocId = await ctx.db.insert("orderBatches", {
      batchId: args.batchId,
      status: "PENDING",
      totalCost: args.totalCost,
      orderCount: args.orderCount,
      selectionPolygon: args.selectionPolygon,
      estimatedDeliveryStart: args.estimatedDeliveryStart,
      estimatedDeliveryEnd: args.estimatedDeliveryEnd,
      notes: args.notes,
    });
    return batchDocId;
  },
});

/**
 * Retrieves a batch by its public batchId (BATCH-XXXXXXXXXX).
 *
 * @param batchId - The public batch identifier
 * @returns The batch document or null if not found
 */
export const getBatchByBatchId = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orderBatches")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .unique();
  },
});

/**
 * Retrieves all batches, ordered by creation time (most recent first).
 * Used for the order history dashboard.
 *
 * @returns Array of all batch documents
 */
export const listBatches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orderBatches").order("desc").collect();
  },
});

/**
 * Retrieves batches filtered by status.
 * Useful for operational dashboards showing pending vs. fulfilled batches.
 *
 * @param status - Batch status to filter by
 * @returns Array of batches matching the status
 */
export const getBatchesByStatus = query({
  args: {
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("EXPORTED"),
      v.literal("FULFILLED")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orderBatches")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

/**
 * Updates a batch's status as it moves through the fulfillment pipeline.
 *
 * @param batchId - The public batch identifier
 * @param status - New status to set
 * @throws Error if batch not found
 */
export const updateBatchStatus = mutation({
  args: {
    batchId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("EXPORTED"),
      v.literal("FULFILLED")
    ),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("orderBatches")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .unique();

    if (!batch) {
      throw new Error(`Batch not found: ${args.batchId}`);
    }

    await ctx.db.patch(batch._id, { status: args.status });
  },
});

/**
 * Deletes a batch and all its associated orders.
 * Used for cleanup or cancellation.
 *
 * @param batchId - The public batch identifier
 * @throws Error if batch not found
 */
export const deleteBatch = mutation({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("orderBatches")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .unique();

    if (!batch) {
      throw new Error(`Batch not found: ${args.batchId}`);
    }

    // Delete all orders in this batch
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    for (const order of orders) {
      await ctx.db.delete(order._id);
    }

    // Delete the batch itself
    await ctx.db.delete(batch._id);
  },
});

