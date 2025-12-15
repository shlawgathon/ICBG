import { NextResponse } from "next/server";
import { getAllProducts, getProductsByCategory, getProductByAsin } from "@/lib/dedalus";
import type { Product, APIError } from "@/lib/types";

/**
 * GET /api/catalog
 *
 * Retrieves products from the gift catalog.
 * Supports filtering by category or fetching a single product by ASIN.
 *
 * Query Parameters:
 * - category: Filter by product category (toys, books, electronics, home, clothing)
 * - asin: Get a specific product by ASIN
 *
 * @param request - Request with optional query parameters
 * @returns JSON response with products array or single product
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as Product["category"] | null;
    const asin = searchParams.get("asin");

    // Get single product by ASIN
    if (asin) {
      const product = getProductByAsin(asin);
      if (!product) {
        const error: APIError = {
          code: "PRODUCT_NOT_FOUND",
          message: `Product not found: ${asin}`
        };
        return NextResponse.json(error, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    // Get products by category
    if (category) {
      const validCategories = ["toys", "books", "electronics", "home", "clothing"];
      if (!validCategories.includes(category)) {
        const error: APIError = {
          code: "INVALID_CATEGORY",
          message: `Invalid category. Valid options: ${validCategories.join(", ")}`
        };
        return NextResponse.json(error, { status: 400 });
      }

      const products = getProductsByCategory(category);
      return NextResponse.json({
        products,
        count: products.length,
        category
      });
    }

    // Get all products
    const products = getAllProducts();
    return NextResponse.json({
      products,
      count: products.length
    });
  } catch (error) {
    console.error("Catalog error:", error);

    const apiError: APIError = {
      code: "INTERNAL_ERROR",
      message: "Failed to retrieve catalog",
      details: process.env.NODE_ENV === "development" ? { error: String(error) } : undefined
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}
