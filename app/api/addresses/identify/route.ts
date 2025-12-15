import { NextResponse } from "next/server";
import * as turf from "@turf/turf";
import { identifyAddressesInPolygon, isValidPolygon, calculatePolygonArea } from "@/lib/overpass";
import type { AddressIdentifyRequest, AddressIdentifyResponse, APIError } from "@/lib/types";

/** Maximum number of addresses to return per request */
const MAX_ADDRESSES = 50;

/** Maximum polygon area in km² to prevent excessively large queries */
const MAX_AREA_KM2 = 10;

/**
 * POST /api/addresses/identify
 *
 * Identifies addresses within a user-defined polygon using OpenStreetMap
 * Overpass API. Returns building addresses with inferred household metadata.
 *
 * @param request - Request containing GeoJSON polygon and optional limit
 * @returns JSON response with identified addresses and attribution
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: AddressIdentifyRequest = await request.json();
    const { polygon, limit } = body;

    // Validate polygon structure
    if (!polygon || !isValidPolygon(polygon)) {
      const error: APIError = {
        code: "INVALID_POLYGON",
        message: "Request must contain a valid GeoJSON polygon"
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate polygon area isn't too large
    const area = calculatePolygonArea(polygon);
    if (area > MAX_AREA_KM2) {
      const error: APIError = {
        code: "AREA_TOO_LARGE",
        message: `Selection area (${area.toFixed(2)} km²) exceeds maximum of ${MAX_AREA_KM2} km²`
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Apply limit constraints
    const effectiveLimit = Math.min(limit ?? MAX_ADDRESSES, MAX_ADDRESSES);

    // Query Overpass API
    const addresses = await identifyAddressesInPolygon(polygon, effectiveLimit);

    // Calculate bounding box for response
    const bbox = turf.bbox(polygon) as [number, number, number, number];

    const response: AddressIdentifyResponse = {
      addresses,
      count: addresses.length,
      boundingBox: bbox,
      attribution: "© OpenStreetMap contributors"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Address identification error:", error);

    const apiError: APIError = {
      code: "INTERNAL_ERROR",
      message: "Failed to identify addresses in the selected area",
      details: process.env.NODE_ENV === "development" ? { error: String(error) } : undefined
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}
