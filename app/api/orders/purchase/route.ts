import { NextRequest, NextResponse } from "next/server";
import { purchaseProduct, purchaseProductsBatch } from "@/lib/dedalus";
import type { Address } from "@/lib/types";

/**
 * POST /api/orders/purchase
 * 
 * Purchase products using the dw820/shopping-agent-mcp MCP server.
 * Supports both single address and batch address purchases.
 * 
 * Request body for single purchase:
 * {
 *   "address": "123 Main St",
 *   "city": "San Francisco",
 *   "state": "CA",
 *   "zipCode": "94102",
 *   "unit": "Unit 1113" (optional)
 * }
 * 
 * Request body for batch purchase:
 * {
 *   "addresses": [Address, Address, ...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a batch purchase
    if (body.addresses && Array.isArray(body.addresses)) {
      const addresses: Address[] = body.addresses;

      if (addresses.length === 0) {
        return NextResponse.json(
          { error: "No addresses provided" },
          { status: 400 }
        );
      }

      const results = await purchaseProductsBatch(addresses);

      const successCount = results.filter((r) => r.result.success).length;
      const failedCount = results.filter((r) => !r.result.success).length;

      return NextResponse.json({
        success: failedCount === 0,
        totalOrders: results.length,
        successCount,
        failedCount,
        results
      });
    }

    // Single purchase
    const { address, city, state, zipCode, unit } = body;

    if (!address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: "Missing required fields: address, city, state, zipCode" },
        { status: 400 }
      );
    }

    const result = await purchaseProduct(address, city, state, zipCode, unit);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Purchase API error:", error);
    return NextResponse.json(
      { 
        error: "Purchase failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
