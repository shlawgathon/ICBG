import type { Polygon } from "geojson";

/**
 * OSM element reference for traceability back to OpenStreetMap data.
 */
export type OsmRef = {
  /** OSM element type (node, way, or relation) */
  type: "node" | "way" | "relation";
  /** Unique OSM element ID */
  id: number;
};

/**
 * Household metadata inferred from OSM building tags.
 * Used for AI-powered gift recommendations.
 */
export type HouseholdMetadata = {
  /** Inferred household composition type */
  householdType?: "family" | "single" | "elderly";
  /** Whether children are likely present (inferred from building type and nearby amenities) */
  hasChildren?: boolean;
  /** Estimated primary age demographic of household */
  estimatedAge?: "young" | "middle" | "senior";
};

/**
 * Address identified from OpenStreetMap via Overpass API.
 * Represents a delivery destination for Santa's gift dispatch.
 */
export type Address = {
  /** Unique identifier derived from OSM node/way ID */
  id: string;
  /** Human-readable street address constructed from OSM tags */
  streetAddress: string;
  /** City name from addr:city tag or reverse geocoded */
  city: string;
  /** State/province from addr:state tag */
  state: string;
  /** Postal/ZIP code from addr:postcode tag */
  postalCode: string;
  /** Latitude coordinate (centroid for ways) */
  lat: number;
  /** Longitude coordinate (centroid for ways) */
  lng: number;
  /** Household metadata inferred from OSM building tags */
  metadata?: HouseholdMetadata;
  /** Original OSM element type and ID for reference */
  osmRef?: OsmRef;
};

/**
 * Product from the mock catalog.
 * Represents a gift that can be assigned to households.
 */
export type Product = {
  /** Amazon-style product identifier */
  asin: string;
  /** Product display name */
  name: string;
  /** Product description */
  description: string;
  /** Price in USD */
  price: number;
  /** Product category */
  category: "toys" | "books" | "electronics" | "home" | "clothing";
  /** Age appropriateness */
  ageRange?: "children" | "teen" | "adult" | "senior" | "all";
};

/**
 * Gift pairing result from AI service.
 * Links an address to its assigned gift.
 */
export type GiftPairing = {
  /** Reference to the address ID */
  addressId: string;
  /** Assigned product */
  product: Product;
  /** AI-generated reason for this pairing (when using AI strategy) */
  pairingReason?: string;
};

/**
 * Order status state machine values.
 * Tracks an order through the fulfillment pipeline.
 */
export type OrderStatus =
  | "ORDER_CREATED"
  | "PENDING_FULFILLMENT"
  | "SHIPPED"
  | "DELIVERED";

/**
 * Batch status state machine values.
 * Tracks a batch of orders through processing.
 */
export type BatchStatus = "PENDING" | "CONFIRMED" | "EXPORTED" | "FULFILLED";

/**
 * API request schema for address identification.
 */
export type AddressIdentifyRequest = {
  /** GeoJSON polygon representing the selected area */
  polygon: Polygon;
  /** Maximum number of addresses to return (default: 50, max: 50) */
  limit?: number;
};

/**
 * API response schema for address identification.
 */
export type AddressIdentifyResponse = {
  /** Array of identified addresses */
  addresses: Address[];
  /** Total count of addresses found */
  count: number;
  /** Bounding box of the selection [minLng, minLat, maxLng, maxLat] */
  boundingBox: [number, number, number, number];
  /** Data source attribution (required by OSM license) */
  attribution: string;
};

/**
 * API request schema for gift pairing.
 */
export type GiftPairRequest = {
  /** Array of addresses to pair with gifts */
  addresses: Address[];
  /** Optional strategy for gift assignment */
  strategy?: "ai-recommended" | "round-robin" | "single-product";
  /** Category constraint for gifts (optional, used with single-product strategy) */
  category?: string;
};

/**
 * API response schema for gift pairing.
 */
export type GiftPairResponse = {
  /** Array of gift pairings */
  pairings: GiftPairing[];
  /** Total estimated cost of all gifts */
  totalCost: number;
  /** Strategy used for pairing */
  strategyUsed: string;
};

/**
 * API request schema for sending delivery notifications.
 */
export type SendNotificationsRequest = {
  /** Array of notification recipients */
  recipients: Array<{
    /** Recipient email address */
    email: string;
    /** Recipient display name */
    name: string;
    /** Delivery address for personalization */
    address: string;
  }>;
  /** Optional batch ID to associate notifications with orders */
  batchId?: string;
  /** Estimated delivery date for the notification */
  estimatedDelivery?: string;
};

/**
 * API response schema for notifications.
 */
export type SendNotificationsResponse = {
  /** Number of emails successfully queued */
  sent: number;
  /** Number of emails that failed to send */
  failed: number;
  /** Detailed results for each recipient */
  results: Array<{
    /** Recipient email address */
    email: string;
    /** Send status */
    status: "sent" | "failed";
    /** Error message if failed */
    error?: string;
  }>;
};

/**
 * Standard API error response schema.
 */
export type APIError = {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (development only) */
  details?: Record<string, unknown>;
};

/**
 * Overpass API element types.
 * Raw element structure returned by the Overpass API.
 */
export type OverpassElement = {
  /** OSM element type */
  type: "node" | "way" | "relation";
  /** OSM element ID */
  id: number;
  /** Latitude (only for nodes) */
  lat?: number;
  /** Longitude (only for nodes) */
  lon?: number;
  /** OSM tags (key-value pairs) */
  tags?: Record<string, string>;
  /** Geometry points (only for ways with geom output) */
  geometry?: Array<{ lat: number; lon: number }>;
};

/**
 * Overpass API response structure.
 */
export type OverpassResponse = {
  /** API version */
  version: number;
  /** Generator identifier */
  generator: string;
  /** OSM3S metadata */
  osm3s: {
    /** Timestamp of OSM data */
    timestamp_osm_base: string;
    /** Copyright notice */
    copyright: string;
  };
  /** Array of OSM elements */
  elements: OverpassElement[];
};

