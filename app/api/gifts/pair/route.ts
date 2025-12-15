import { NextResponse } from "next/server";
import {
  pairGiftsWithAI,
  fallbackGiftPairing,
  getAllProducts,
  mockCatalog,
} from "@/lib/dedalus";
import type {
  GiftPairRequest,
  GiftPairResponse,
  GiftPairing,
  Product,
  APIError,
} from "@/lib/types";

/** Maximum addresses per request */
const MAX_ADDRESSES = 50;

/**
 * Assigns gifts using round-robin strategy.
 * Cycles through products in order.
 *
 * @param addresses - Array of addresses to pair
 * @returns Array of gift pairings
 */
function roundRobinPairing(
  addresses: GiftPairRequest["addresses"]
): GiftPairing[] {
  const products = getAllProducts();
  return addresses.map((address, index) => ({
    addressId: address.id,
    product: products[index % products.length],
    pairingReason: "Assigned via round-robin distribution",
  }));
}

/**
 * Assigns the same product to all addresses.
 *
 * @param addresses - Array of addresses to pair
 * @param category - Optional category to filter product selection
 * @returns Array of gift pairings
 */
function singleProductPairing(
  addresses: GiftPairRequest["addresses"],
  category?: string
): GiftPairing[] {
  let product: Product;

  if (category) {
    const categoryProducts = mockCatalog.filter(
      (p) => p.category === category
    );
    product = categoryProducts.length > 0 ? categoryProducts[0] : mockCatalog[0];
  } else {
    // Default to a universally appropriate gift (books)
    product = mockCatalog.find((p) => p.category === "books") ?? mockCatalog[0];
  }

  return addresses.map((address) => ({
    addressId: address.id,
    product,
    pairingReason: `Standard gift selection${category ? ` (${category})` : ""}`,
  }));
}

/**
 * POST /api/gifts/pair
 *
 * Pairs addresses with appropriate gifts using the specified strategy.
 * Default strategy is AI-recommended which uses household metadata for
 * intelligent gift selection.
 *
 * Strategies:
 * - ai-recommended: Uses Dedalus Labs AI with household metadata (default)
 * - round-robin: Cycles through all products
 * - single-product: Assigns the same product to everyone
 *
 * @param request - Request containing addresses and optional strategy
 * @returns JSON response with gift pairings and total cost
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: GiftPairRequest = await request.json();
    const { addresses, strategy = "ai-recommended", category } = body;

    // Validate addresses array
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      const error: APIError = {
        code: "INVALID_ADDRESSES",
        message: "Request must contain a non-empty array of addresses",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Enforce limit
    if (addresses.length > MAX_ADDRESSES) {
      const error: APIError = {
        code: "TOO_MANY_ADDRESSES",
        message: `Maximum ${MAX_ADDRESSES} addresses per request`,
      };
      return NextResponse.json(error, { status: 400 });
    }

    let pairings: GiftPairing[];
    let strategyUsed: string = strategy;

    switch (strategy) {
      case "round-robin":
        pairings = roundRobinPairing(addresses);
        break;

      case "single-product":
        pairings = singleProductPairing(addresses, category);
        break;

      case "ai-recommended":
      default:
        try {
          // Try AI-powered gift pairing first
          pairings = await pairGiftsWithAI(addresses);

          // If AI returns fewer pairings than addresses, use fallback for remainder
          if (pairings.length < addresses.length) {
            const pairedIds = new Set(pairings.map((p) => p.addressId));
            const unpairedAddresses = addresses.filter(
              (a) => !pairedIds.has(a.id)
            );

            const fallbackPairings = unpairedAddresses.map((address) => ({
              addressId: address.id,
              product: fallbackGiftPairing(address),
              pairingReason: "Assigned via rule-based fallback",
            }));

            pairings = [...pairings, ...fallbackPairings];
            strategyUsed = "ai-recommended (with fallback)";
          }
        } catch (aiError) {
          console.warn("AI pairing failed, using fallback:", aiError);

          // Fall back to rule-based pairing
          pairings = addresses.map((address) => ({
            addressId: address.id,
            product: fallbackGiftPairing(address),
            pairingReason: "Assigned via rule-based logic (AI unavailable)",
          }));
          strategyUsed = "rule-based-fallback";
        }
        break;
    }

    // Calculate total cost
    const totalCost = pairings.reduce(
      (sum, pairing) => sum + pairing.product.price,
      0
    );

    const response: GiftPairResponse = {
      pairings,
      totalCost,
      strategyUsed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Gift pairing error:", error);

    const apiError: APIError = {
      code: "INTERNAL_ERROR",
      message: "Failed to pair gifts with addresses",
      details:
        process.env.NODE_ENV === "development"
          ? { error: String(error) }
          : undefined,
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}

