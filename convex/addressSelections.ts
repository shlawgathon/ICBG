import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new address selection record.
 * Called when user completes drawing a polygon on the map.
 *
 * @param selectionId - Unique selection identifier (SEL-XXXXXXXXXX format)
 * @param polygon - GeoJSON polygon as JSON string
 * @param boundingBox - Bounding box coordinates as JSON string
 * @param addressCount - Number of addresses identified in selection
 * @param locationDescription - Human-readable location description (optional)
 * @returns The Convex document ID of the created selection
 */
export const createSelection = mutation({
  args: {
    selectionId: v.string(),
    polygon: v.string(),
    boundingBox: v.string(),
    addressCount: v.number(),
    locationDescription: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("addressSelections", {
      selectionId: args.selectionId,
      polygon: args.polygon,
      boundingBox: args.boundingBox,
      addressCount: args.addressCount,
      locationDescription: args.locationDescription
    });
  }
});

/**
 * Links an address selection to an order batch.
 * Called when orders are confirmed from a selection.
 *
 * @param selectionId - The selection identifier
 * @param batchId - The batch identifier to link
 * @throws Error if selection not found
 */
export const linkSelectionToBatch = mutation({
  args: {
    selectionId: v.string(),
    batchId: v.string()
  },
  handler: async (ctx, args) => {
    const selection = await ctx.db
      .query("addressSelections")
      .withIndex("by_selectionId", (q) => q.eq("selectionId", args.selectionId))
      .unique();

    if (!selection) {
      throw new Error(`Selection not found: ${args.selectionId}`);
    }

    await ctx.db.patch(selection._id, { batchId: args.batchId });
  }
});

/**
 * Retrieves a selection by its public selectionId.
 *
 * @param selectionId - The selection identifier
 * @returns The selection document or null if not found
 */
export const getSelectionBySelectionId = query({
  args: { selectionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("addressSelections")
      .withIndex("by_selectionId", (q) => q.eq("selectionId", args.selectionId))
      .unique();
  }
});

/**
 * Retrieves the selection associated with a batch.
 *
 * @param batchId - The batch identifier
 * @returns The selection document or null if not found
 */
export const getSelectionByBatchId = query({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("addressSelections")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .unique();
  }
});

/**
 * Retrieves all address selections, ordered by creation time (most recent first).
 *
 * @returns Array of all selection documents
 */
export const listSelections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("addressSelections").order("desc").collect();
  }
});

/**
 * Updates the address count for a selection.
 * Called if addresses are re-queried for an existing selection.
 *
 * @param selectionId - The selection identifier
 * @param addressCount - New address count
 * @throws Error if selection not found
 */
export const updateSelectionAddressCount = mutation({
  args: {
    selectionId: v.string(),
    addressCount: v.number()
  },
  handler: async (ctx, args) => {
    const selection = await ctx.db
      .query("addressSelections")
      .withIndex("by_selectionId", (q) => q.eq("selectionId", args.selectionId))
      .unique();

    if (!selection) {
      throw new Error(`Selection not found: ${args.selectionId}`);
    }

    await ctx.db.patch(selection._id, { addressCount: args.addressCount });
  }
});

/**
 * Deletes an address selection.
 *
 * @param selectionId - The selection identifier
 * @throws Error if selection not found
 */
export const deleteSelection = mutation({
  args: { selectionId: v.string() },
  handler: async (ctx, args) => {
    const selection = await ctx.db
      .query("addressSelections")
      .withIndex("by_selectionId", (q) => q.eq("selectionId", args.selectionId))
      .unique();

    if (!selection) {
      throw new Error(`Selection not found: ${args.selectionId}`);
    }

    await ctx.db.delete(selection._id);
  }
});
