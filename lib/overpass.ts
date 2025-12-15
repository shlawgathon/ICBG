import * as turf from "@turf/turf";
import type { Polygon } from "geojson";
import type {
  Address,
  OverpassElement,
  OverpassResponse,
  HouseholdMetadata,
} from "./types";

/** Overpass API public endpoint */
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

/** Alternative endpoints for fallback */
const OVERPASS_FALLBACK_URLS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

/**
 * Converts a GeoJSON polygon to Overpass QL poly filter format.
 * Overpass expects coordinates as "lat lon lat lon ..." space-separated string.
 *
 * @param polygon - GeoJSON polygon geometry
 * @returns Overpass QL poly filter string
 */
function polygonToOverpassPoly(polygon: Polygon): string {
  const coords = polygon.coordinates[0];
  return coords.map(([lng, lat]) => `${lat} ${lng}`).join(" ");
}

/**
 * Builds an Overpass QL query to fetch buildings with addresses within a polygon.
 * Queries for nodes and ways with addr:* tags or building tags.
 *
 * @param polygon - GeoJSON polygon defining the search area
 * @returns Overpass QL query string
 */
function buildOverpassQuery(polygon: Polygon): string {
  const bbox = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const polyStr = polygonToOverpassPoly(polygon);

  return `
    [out:json][timeout:30][bbox:${minLat},${minLng},${maxLat},${maxLng}];
    (
      way["building"]["addr:housenumber"](poly:"${polyStr}");
      node["addr:housenumber"](poly:"${polyStr}");
      way["building"~"^(house|residential|apartments|detached|terrace)$"](poly:"${polyStr}");
    );
    out body geom;
  `.trim();
}

/**
 * Infers household metadata from OSM building and amenity tags.
 * Uses heuristics based on building type, size, and nearby features.
 *
 * @param buildingType - OSM building tag value
 * @param tags - Full OSM tags object
 * @returns Inferred household metadata
 */
function inferHouseholdMetadata(
  buildingType: string | undefined,
  tags: Record<string, string>
): HouseholdMetadata {
  const levels = parseInt(tags["building:levels"] ?? "1", 10);

  // Apartments suggest mixed demographics
  if (buildingType === "apartments" || levels > 3) {
    return {
      householdType: "family",
      hasChildren: Math.random() > 0.5,
      estimatedAge: "middle",
    };
  }

  // Single-family homes
  if (buildingType === "house" || buildingType === "detached") {
    return {
      householdType: "family",
      hasChildren: true,
      estimatedAge: "middle",
    };
  }

  // Senior housing indicated by tags
  if (
    tags["social_facility"] === "nursing_home" ||
    tags["amenity"] === "retirement_home"
  ) {
    return {
      householdType: "elderly",
      hasChildren: false,
      estimatedAge: "senior",
    };
  }

  // Default for residential buildings
  return {
    householdType: "family",
    hasChildren: Math.random() > 0.4,
    estimatedAge: "middle",
  };
}

/**
 * Transforms an OSM element into our Address schema.
 * Extracts address components from OSM tags and computes centroid for ways.
 *
 * @param element - Raw OSM element from Overpass response
 * @returns Transformed Address object
 */
function osmElementToAddress(element: OverpassElement): Address {
  const tags = element.tags ?? {};

  // Compute centroid for ways (buildings)
  let lat: number, lng: number;
  if (element.type === "way" && element.geometry && element.geometry.length > 0) {
    const coords = element.geometry.map(
      (g) => [g.lon, g.lat] as [number, number]
    );
    // Ensure the polygon is closed
    if (
      coords.length > 2 &&
      (coords[0][0] !== coords[coords.length - 1][0] ||
        coords[0][1] !== coords[coords.length - 1][1])
    ) {
      coords.push(coords[0]);
    }
    try {
      const centroid = turf.centroid(turf.polygon([coords]));
      [lng, lat] = centroid.geometry.coordinates;
    } catch {
      // Fallback to first point if centroid calculation fails
      lat = element.geometry[0].lat;
      lng = element.geometry[0].lon;
    }
  } else {
    lat = element.lat!;
    lng = element.lon!;
  }

  // Construct street address from OSM tags
  const houseNumber = tags["addr:housenumber"] ?? "";
  const street = tags["addr:street"] ?? "";
  const streetAddress =
    houseNumber && street
      ? `${houseNumber} ${street}`
      : tags["addr:full"] ?? `Building ${element.id}`;

  // Infer household metadata from building tags
  const buildingType = tags["building"];
  const metadata = inferHouseholdMetadata(buildingType, tags);

  return {
    id: `osm_${element.type}_${element.id}`,
    streetAddress,
    city: tags["addr:city"] ?? "",
    state: tags["addr:state"] ?? "",
    postalCode: tags["addr:postcode"] ?? "",
    lat,
    lng,
    metadata,
    osmRef: { type: element.type, id: element.id },
  };
}

/**
 * Queries the Overpass API to identify addresses within the given polygon.
 * Fetches real OSM data and transforms it into our Address schema.
 *
 * @param polygon - GeoJSON polygon defining the selection area
 * @param limit - Maximum number of addresses to return (default: 50)
 * @returns Promise resolving to array of addresses within the polygon
 * @throws Error if Overpass API request fails
 */
export async function identifyAddressesInPolygon(
  polygon: Polygon,
  limit: number = 50
): Promise<Address[]> {
  const query = buildOverpassQuery(polygon);

  let response: Response | undefined;
  let lastError: Error | undefined;

  // Try primary endpoint first, then fallbacks
  const urls = [OVERPASS_API_URL, ...OVERPASS_FALLBACK_URLS];

  for (const url of urls) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (response.ok) {
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  if (!response || !response.ok) {
    throw lastError ?? new Error("All Overpass API endpoints failed");
  }

  const data: OverpassResponse = await response.json();

  // Transform OSM elements to addresses and apply limit
  const addresses = data.elements
    .map(osmElementToAddress)
    .filter((addr) => addr.streetAddress !== "" && addr.lat && addr.lng)
    .slice(0, limit);

  return addresses;
}

/**
 * Validates a polygon geometry before querying.
 *
 * @param polygon - GeoJSON polygon to validate
 * @returns true if valid, false otherwise
 */
export function isValidPolygon(polygon: Polygon): boolean {
  if (!polygon || polygon.type !== "Polygon") {
    return false;
  }

  if (!polygon.coordinates || polygon.coordinates.length === 0) {
    return false;
  }

  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) {
    return false;
  }

  return true;
}

/**
 * Calculates the area of a polygon in square kilometers.
 *
 * @param polygon - GeoJSON polygon
 * @returns Area in square kilometers
 */
export function calculatePolygonArea(polygon: Polygon): number {
  const area = turf.area(polygon);
  return area / 1_000_000; // Convert from m² to km²
}

