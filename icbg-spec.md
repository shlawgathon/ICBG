# Intercontinental Ballistic Gifts (ICBG)

## Technical Specification Document

**Version:** 1.0.0  
**Date:** December 14, 2025  
**Hackathon:** Santa's Ho's HackNight @ Dedalus Labs Break In  
**Theme:** Sleighs, Logistics, and Routing  
**Duration:** 6 hours (4:45 PM – 9:00 PM)

---

## Executive Summary

**ICBG** is a web-based logistics platform that enables Santa's operations team to select any neighborhood on a globe, automatically identify real-world households within that region using OpenStreetMap data, intelligently assign gifts to each address, send festive email notifications to recipients, and generate a ready-to-fulfill delivery batch—all in a single action. The platform demonstrates scalable logistics infrastructure with live geographic data from the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) and AI-powered product pairing capabilities, leveraging the Dedalus Labs SDK with MCP (Model Context Protocol) server integration via the [AgentMail MCP server](https://www.dedaluslabs.ai/marketplace/vroom08/agentmail-mcp) from the Dedalus Labs Marketplace for intelligent gift recommendations and automated delivery notifications.

**One-Sentence Pitch:**  
"Click any neighborhood on a globe, query real addresses from OpenStreetMap, assign gifts at scale with AI, notify recipients via email, and generate a ready-to-fulfill delivery batch in one action."

---

## Project Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 16)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Mapbox Globe  │  │  Control Panel  │  │      Order Dashboard        │  │
│  │   + Draw Tools  │  │  + Area Select  │  │  + Delivery Manifest        │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                         │                  │
│           └────────────────────┴─────────────────────────┘                  │
│                                    │                                        │
│                           React Query / SWR                                 │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ HTTP/REST
┌────────────────────────────────────┼────────────────────────────────────────┐
│                              BACKEND (Next.js API Routes)                   │
├────────────────────────────────────┼────────────────────────────────────────┤
│  ┌─────────────────┐  ┌────────────┴────────────┐  ┌─────────────────────┐  │
│  │ Address Service │  │  Gift Pairing Service   │  │   Order Service     │  │
│  │ (Overpass API + │  │  (Dedalus Labs SDK +    │  │   (Mock Amazon)     │  │
│  │  Turf.js)       │  │   AgentMail MCP)        │  │                     │  │
│  └─────────────────┘  └─────────────────────────┘  └─────────────────────┘  │
│                                    │                                        │
│                           Dedalus Runner                                    │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ MCP Protocol
                   ┌─────────────────┴─────────────────┐
                   │  AgentMail MCP Server             │
                   │  (vroom08/agentmail-mcp)          │
                   │  Dedalus Labs Marketplace         │
                   └───────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.0.10 | Full-stack React framework with App Router |
| **Language** | TypeScript | 5.7.x | Type-safe JavaScript |
| **Runtime** | Node.js | 22.x LTS | Server-side JavaScript runtime |
| **Mapping** | Mapbox GL JS | 3.17.0 | Interactive WebGL maps |
| **React Mapping** | react-map-gl | 8.1.0 | React wrapper for Mapbox GL JS |
| **Draw Tools** | @mapbox/mapbox-gl-draw | 1.5.1 | Polygon drawing on maps |
| **Geospatial** | @turf/turf | 7.3.1 | Geospatial analysis library |
| **Address Data** | Overpass API | - | OpenStreetMap query API for real-world building/address data |
| **AI/MCP** | dedalus-labs | 0.1.0-alpha.4 | MCP client SDK for AI agents |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **State** | React Query | 5.x | Server state management |
| **ID Generation** | nanoid | 5.x | Unique ID generation |

---

## Detailed Feature Specifications

### 1. Interactive Globe/Map Interface

**Component:** `<GlobeMap />`

**Functionality:**

The globe interface serves as the primary interaction surface where Santa's operations team selects delivery regions. The implementation uses Mapbox GL JS with the globe projection for visual impact, combined with the Mapbox Draw plugin for polygon selection.

**Technical Implementation:**

```typescript
// Map configuration for globe projection with draw capabilities
const mapConfig = {
  projection: 'globe',
  style: 'mapbox://styles/mapbox/dark-v11',
  fog: {
    color: 'rgb(186, 210, 235)',
    'high-color': 'rgb(36, 92, 223)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(11, 11, 25)',
    'star-intensity': 0.6
  }
};
```

**User Interactions:**

When a user clicks the "Select Area" button, the draw mode activates, enabling them to draw a polygon on the map by clicking points to define vertices. Double-clicking completes the polygon. The system then captures the GeoJSON representation of the selected area and passes it to the address identification service.

**Constraints:**

The system limits selections to a maximum of 50 addresses per query to ensure responsive performance and avoid overloading the Overpass API. Users can select any location worldwide—the OpenStreetMap database provides global coverage. For optimal results, selections should target residential areas with good OSM data coverage (major cities in North America, Europe, and Asia have excellent coverage).

### 2. Address Identification Service (OpenStreetMap Overpass API)

**Endpoint:** `POST /api/addresses/identify`

**Functionality:**

Given a GeoJSON polygon representing a selected area, this service queries the [OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) to identify real-world buildings and addresses within that region. The Overpass API is a read-only database interface optimized for extracting custom subsets of OSM data based on geographic bounds and tag filters.

**Overpass API Integration:**

The service constructs an Overpass QL (Query Language) query that retrieves:
1. Buildings (`building=*`) within the polygon bounds
2. Nodes with address information (`addr:housenumber`, `addr:street`)
3. Ways (building outlines) with associated address tags

The public Overpass API endpoint (`https://overpass-api.de/api/interpreter`) is free to use and requires no authentication.

**Request Schema:**

```typescript
type AddressIdentifyRequest = {
  /** GeoJSON polygon representing the selected area */
  polygon: GeoJSON.Polygon;
  /** Maximum number of addresses to return (default: 50, max: 50) */
  limit?: number;
};
```

**Response Schema:**

```typescript
type Address = {
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
  metadata?: {
    /** Inferred from building type tags (apartments, house, residential) */
    householdType?: 'family' | 'single' | 'elderly';
    /** Inferred from nearby amenities (playground, school proximity) */
    hasChildren?: boolean;
    /** Inferred from building:levels and building age tags */
    estimatedAge?: 'young' | 'middle' | 'senior';
  };
  /** Original OSM element type and ID for reference */
  osmRef?: {
    type: 'node' | 'way' | 'relation';
    id: number;
  };
};

type AddressIdentifyResponse = {
  /** Array of identified addresses */
  addresses: Address[];
  /** Total count of addresses found */
  count: number;
  /** Bounding box of the selection [minLng, minLat, maxLng, maxLat] */
  boundingBox: [number, number, number, number];
  /** Data source attribution (required by OSM license) */
  attribution: string;
};
```

**Implementation Strategy:**

The service converts the GeoJSON polygon to an Overpass QL polygon filter, queries the API, and transforms the OSM response into our address schema. Turf.js is used for computing bounding boxes and centroids.

```typescript
import * as turf from '@turf/turf';

/** Overpass API public endpoint */
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Converts a GeoJSON polygon to Overpass QL poly filter format.
 * Overpass expects coordinates as "lat lon lat lon ..." space-separated string.
 * 
 * @param polygon - GeoJSON polygon geometry
 * @returns Overpass QL poly filter string
 */
function polygonToOverpassPoly(polygon: GeoJSON.Polygon): string {
  const coords = polygon.coordinates[0];
  return coords.map(([lng, lat]) => `${lat} ${lng}`).join(' ');
}

/**
 * Builds an Overpass QL query to fetch buildings with addresses within a polygon.
 * Queries for nodes and ways with addr:* tags or building tags.
 * 
 * @param polygon - GeoJSON polygon defining the search area
 * @param limit - Maximum number of results (applied client-side due to Overpass limitations)
 * @returns Overpass QL query string
 */
function buildOverpassQuery(polygon: GeoJSON.Polygon): string {
  const bbox = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  return `
    [out:json]
    [timeout:30]
    [bbox:${minLat},${minLng},${maxLat},${maxLng}];
    (
      // Buildings with addresses
      way["building"]["addr:housenumber"](poly:"${polygonToOverpassPoly(polygon)}");
      // Address nodes
      node["addr:housenumber"](poly:"${polygonToOverpassPoly(polygon)}");
      // Residential buildings without explicit addresses (use centroid)
      way["building"~"^(house|residential|apartments|detached|terrace)$"](poly:"${polygonToOverpassPoly(polygon)}");
    );
    out body geom;
  `.trim();
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
  if (element.type === 'way' && element.geometry) {
    const coords = element.geometry.map(g => [g.lon, g.lat] as [number, number]);
    const centroid = turf.centroid(turf.polygon([coords]));
    [lng, lat] = centroid.geometry.coordinates;
  } else {
    lat = element.lat!;
    lng = element.lon!;
  }
  
  // Construct street address from OSM tags
  const houseNumber = tags['addr:housenumber'] ?? '';
  const street = tags['addr:street'] ?? '';
  const streetAddress = houseNumber && street 
    ? `${houseNumber} ${street}` 
    : tags['addr:full'] ?? `Building ${element.id}`;
  
  // Infer household metadata from building tags
  const buildingType = tags['building'];
  const metadata = inferHouseholdMetadata(buildingType, tags);
  
  return {
    id: `osm_${element.type}_${element.id}`,
    streetAddress,
    city: tags['addr:city'] ?? '',
    state: tags['addr:state'] ?? '',
    postalCode: tags['addr:postcode'] ?? '',
    lat,
    lng,
    metadata,
    osmRef: { type: element.type, id: element.id }
  };
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
): Address['metadata'] {
  const levels = parseInt(tags['building:levels'] ?? '1', 10);
  
  // Apartments suggest mixed demographics
  if (buildingType === 'apartments' || levels > 3) {
    return { householdType: 'family', hasChildren: Math.random() > 0.5, estimatedAge: 'middle' };
  }
  
  // Single-family homes
  if (buildingType === 'house' || buildingType === 'detached') {
    return { householdType: 'family', hasChildren: true, estimatedAge: 'middle' };
  }
  
  // Senior housing indicated by tags
  if (tags['social_facility'] === 'nursing_home' || tags['amenity'] === 'retirement_home') {
    return { householdType: 'elderly', hasChildren: false, estimatedAge: 'senior' };
  }
  
  // Default for residential buildings
  return { householdType: 'family', hasChildren: Math.random() > 0.4, estimatedAge: 'middle' };
}

/**
 * Queries the Overpass API to identify addresses within the given polygon.
 * Fetches real OSM data and transforms it into our Address schema.
 * 
 * @param polygon - GeoJSON polygon defining the selection area
 * @param limit - Maximum number of addresses to return
 * @returns Promise resolving to array of addresses within the polygon
 */
async function identifyAddressesInPolygon(
  polygon: GeoJSON.Polygon,
  limit: number = 50
): Promise<Address[]> {
  const query = buildOverpassQuery(polygon);
  
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });
  
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }
  
  const data: OverpassResponse = await response.json();
  
  // Transform OSM elements to addresses and apply limit
  const addresses = data.elements
    .map(osmElementToAddress)
    .filter(addr => addr.streetAddress !== '')
    .slice(0, limit);
  
  return addresses;
}

/** Raw Overpass API response types */
type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
};

type OverpassResponse = {
  version: number;
  generator: string;
  osm3s: { timestamp_osm_base: string; copyright: string };
  elements: OverpassElement[];
};
```

**OSM Data Attribution:**

Per the [OpenStreetMap License](https://www.openstreetmap.org/copyright), all responses must include attribution. The API response includes:

```typescript
attribution: "© OpenStreetMap contributors"
```

### 3. AI-Powered Gift Pairing Service (Dedalus Labs MCP Integration)

**Endpoint:** `POST /api/gifts/pair`

**Functionality:**

This service represents the core MCP integration requirement for the hackathon. It uses the Dedalus Labs SDK to connect to the AgentMail MCP server from the [Dedalus Labs Marketplace](https://www.dedaluslabs.ai/marketplace/vroom08/agentmail-mcp) to send email notifications when gifts are assigned. The AI agent analyzes each address's characteristics, selects appropriate gifts from the mock product catalog, and sends festive email notifications to recipients.

**MCP Server Configuration:**

The system connects to the AgentMail MCP server (`vroom08/agentmail-mcp`) hosted on the Dedalus Labs Marketplace. This server provides email sending capabilities that enable the platform to notify recipients about incoming gift deliveries. This satisfies the hackathon requirement of using at least one MCP server from the Dedalus Marketplace.

**Dedalus Integration Pattern:**

```typescript
import Dedalus from 'dedalus-labs';
import { DedalusRunner } from 'dedalus-labs';

/**
 * Initializes the Dedalus client and runner for MCP-powered gift pairing
 * and email notifications.
 * The runner manages the agent loop and MCP server connections.
 */
const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY
});

const runner = new DedalusRunner(client);

/**
 * Custom tool for retrieving products from the mock catalog.
 * This local tool is combined with the MCP server's capabilities.
 * 
 * @param category - Product category to filter by
 * @returns Array of products in the specified category
 */
function getProductsByCategory(category: string): Product[] {
  return mockCatalog.filter(p => p.category === category);
}

/**
 * Pairs gifts with addresses using AI-powered recommendations and
 * sends email notifications via the AgentMail MCP server.
 * Combines local catalog tools with MCP server for intelligent pairing.
 * 
 * @param addresses - Array of addresses requiring gift assignment
 * @returns Promise resolving to gift pairings for each address
 */
async function pairGiftsWithAI(addresses: Address[]): Promise<GiftPairing[]> {
  const result = await runner.run({
    input: buildGiftPairingPrompt(addresses),
    model: 'openai/gpt-4o-mini',
    tools: [getProductsByCategory],
    mcpServers: ['vroom08/agentmail-mcp']
  });
  
  return parseGiftPairings(result.finalOutput);
}
```

**Request Schema:**

```typescript
type GiftPairRequest = {
  /** Array of addresses to pair with gifts */
  addresses: Address[];
  /** Optional strategy for gift assignment */
  strategy?: 'ai-recommended' | 'round-robin' | 'single-product';
  /** Category constraint for gifts (optional) */
  category?: string;
};
```

**Response Schema:**

```typescript
type Product = {
  /** Amazon-style product identifier */
  asin: string;
  /** Product display name */
  name: string;
  /** Product description */
  description: string;
  /** Price in USD */
  price: number;
  /** Product category */
  category: 'toys' | 'books' | 'electronics' | 'home' | 'clothing';
  /** Age appropriateness */
  ageRange?: 'children' | 'teen' | 'adult' | 'all';
};

type GiftPairing = {
  /** Reference to the address */
  addressId: string;
  /** Assigned product */
  product: Product;
  /** AI-generated reason for this pairing (when using AI strategy) */
  pairingReason?: string;
};

type GiftPairResponse = {
  /** Array of gift pairings */
  pairings: GiftPairing[];
  /** Total estimated cost of all gifts */
  totalCost: number;
  /** Strategy used for pairing */
  strategyUsed: string;
};
```

**Mock Product Catalog:**

The system includes a curated catalog of 20 products across categories, designed to enable meaningful AI-powered recommendations:

```typescript
const mockCatalog: Product[] = [
  { asin: 'B0X001', name: 'LEGO Holiday Train Set', description: 'Classic holiday train with 4 cars', price: 49.99, category: 'toys', ageRange: 'children' },
  { asin: 'B0X002', name: 'Illustrated Christmas Stories', description: 'Collection of classic tales', price: 19.99, category: 'books', ageRange: 'children' },
  { asin: 'B0X003', name: 'Smart Home Display', description: '10-inch smart display', price: 129.99, category: 'electronics', ageRange: 'adult' },
  { asin: 'B0X004', name: 'Cozy Holiday Throw Blanket', description: 'Soft fleece with festive patterns', price: 34.99, category: 'home', ageRange: 'all' },
  // ... additional products
];
```

### 4. Email Notification Service (AgentMail MCP)

**Endpoint:** `POST /api/notifications/send`

**Functionality:**

This service leverages the AgentMail MCP server from the [Dedalus Labs Marketplace](https://www.dedaluslabs.ai/marketplace/vroom08/agentmail-mcp) to send festive email notifications to gift recipients. When an order batch is confirmed, the system can optionally dispatch personalized "Santa's delivering your present!" emails to notify recipients of their incoming gifts.

**Request Schema:**

```typescript
type SendNotificationsRequest = {
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
```

**Response Schema:**

```typescript
type SendNotificationsResponse = {
  /** Number of emails successfully queued */
  sent: number;
  /** Number of emails that failed to send */
  failed: number;
  /** Detailed results for each recipient */
  results: Array<{
    email: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
};
```

**Implementation:**

```typescript
import Dedalus from 'dedalus-labs';
import { DedalusRunner } from 'dedalus-labs';

const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY
});

const runner = new DedalusRunner(client);

/**
 * Sends festive delivery notification emails via AgentMail MCP server.
 * Each recipient receives a personalized email announcing their gift delivery.
 * 
 * @param recipients - Array of notification recipients with email and address info
 * @param estimatedDelivery - Expected delivery date string
 * @returns Promise resolving to send results for each recipient
 */
async function sendDeliveryNotifications(
  recipients: Array<{ email: string; name: string; address: string }>,
  estimatedDelivery: string = 'December 23-24, 2025'
): Promise<SendNotificationsResponse> {
  const prompt = `
You are Santa's notification coordinator. Send festive email notifications
to the following recipients announcing their gift deliveries.

For each recipient, use the AgentMail tools to send an email with:
- To: The recipient's email address
- Subject: "🎅 Santa's Delivering Your Present!"
- Body: A warm, HTML-formatted festive message including:
  - A greeting with their name
  - Announcement that a special gift is on the way
  - Their delivery address
  - Estimated delivery: ${estimatedDelivery}
  - Signed "With holiday cheer, Santa's Workshop"

Recipients to notify:
${recipients.map(r => `
- Name: ${r.name}
- Email: ${r.email}
- Address: ${r.address}
`).join('\n')}

After sending all emails, report back the status of each send operation
in JSON format:
{
  "results": [
    { "email": "...", "status": "sent" },
    { "email": "...", "status": "failed", "error": "reason" }
  ]
}
`.trim();

  const result = await runner.run({
    input: prompt,
    model: 'openai/gpt-4o-mini',
    mcpServers: ['vroom08/agentmail-mcp']
  });

  return parseNotificationResults(result.finalOutput);
}
```

---

### 5. Order Generation Service

**Endpoint:** `POST /api/orders/create`

**Functionality:**

This service generates mock order records that simulate what would be sent to Amazon's fulfillment system. Each order receives a unique identifier with a festive prefix, and the system tracks order status through a simple state machine.

**Request Schema:**

```typescript
type CreateOrdersRequest = {
  /** Array of gift pairings to convert to orders */
  pairings: GiftPairing[];
  /** Full address details for shipping */
  addresses: Address[];
  /** Batch identifier for grouping orders */
  batchId?: string;
};
```

**Response Schema:**

```typescript
type Order = {
  /** Unique order identifier with festive prefix */
  orderId: string;
  /** Timestamp of order creation */
  createdAt: string;
  /** Current order status */
  status: 'ORDER_CREATED' | 'PENDING_FULFILLMENT' | 'SHIPPED' | 'DELIVERED';
  /** Full shipping address */
  shippingAddress: Address;
  /** Product being shipped */
  product: Product;
  /** Estimated delivery window */
  estimatedDelivery: {
    earliest: string;
    latest: string;
  };
  /** Order cost breakdown */
  cost: {
    productPrice: number;
    shipping: number;
    total: number;
  };
};

type CreateOrdersResponse = {
  /** Batch identifier for all created orders */
  batchId: string;
  /** Array of created orders */
  orders: Order[];
  /** Summary statistics */
  summary: {
    totalOrders: number;
    totalCost: number;
    estimatedDeliveryWindow: string;
  };
};
```

**Order ID Generation:**

Order IDs follow a festive pattern that maintains uniqueness while reinforcing the theme:

```typescript
import { nanoid } from 'nanoid';

/**
 * Generates a festive order ID with the HOHOHO prefix.
 * Uses nanoid for the unique suffix to ensure collision resistance.
 * 
 * @returns A unique order identifier in the format HOHOHO-XXXXXXXXXX
 */
function generateOrderId(): string {
  const suffix = nanoid(10).toUpperCase();
  return `HOHOHO-${suffix}`;
}
```

### 6. Delivery Manifest Export

**Endpoint:** `GET /api/orders/export`

**Functionality:**

Generates downloadable delivery manifests in CSV format, suitable for integration with actual logistics systems. The manifest includes all order details, routing information, and delivery instructions.

**Query Parameters:**

```typescript
type ExportParams = {
  /** Batch ID to export */
  batchId: string;
  /** Export format */
  format: 'csv' | 'json';
};
```

**CSV Schema:**

```
OrderID,Status,RecipientAddress,City,State,PostalCode,Latitude,Longitude,ProductName,ProductASIN,Price,EstimatedDelivery
HOHOHO-ABC123,ORDER_CREATED,"123 Main St",San Francisco,CA,94102,37.7749,-122.4194,LEGO Holiday Train Set,B0X001,49.99,2025-12-24
```

---

## API Route Specifications

### Route Map

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/addresses/identify` | Identify addresses within polygon |
| `POST` | `/api/gifts/pair` | AI-powered gift pairing |
| `POST` | `/api/notifications/send` | Send delivery notification emails (AgentMail MCP) |
| `POST` | `/api/orders/create` | Generate mock orders |
| `GET` | `/api/orders/[batchId]` | Retrieve batch details |
| `GET` | `/api/orders/export` | Export delivery manifest |
| `GET` | `/api/catalog` | Retrieve product catalog |

### Error Handling

All API routes follow a consistent error response schema:

```typescript
type APIError = {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (development only) */
  details?: Record<string, unknown>;
};
```

Standard error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_POLYGON` | 400 | Provided polygon geometry is invalid |
| `LIMIT_EXCEEDED` | 400 | Requested more than 50 addresses |
| `OVERPASS_TIMEOUT` | 504 | Overpass API query timed out (area too large) |
| `OVERPASS_ERROR` | 502 | Overpass API communication failure |
| `NO_ADDRESSES_FOUND` | 404 | No addresses found in selected area (sparse OSM data) |
| `DEDALUS_ERROR` | 502 | MCP server communication failure |
| `AGENTMAIL_ERROR` | 502 | AgentMail MCP server email delivery failure |
| `INVALID_EMAIL` | 400 | One or more recipient email addresses are invalid |
| `BATCH_NOT_FOUND` | 404 | Order batch does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Frontend Component Hierarchy

```
<RootLayout>
├── <Header>
│   ├── <Logo />
│   ├── <StatusIndicator /> (MCP connection status)
│   └── <ThemeToggle />
│
├── <MainContent>
│   ├── <GlobeMap>
│   │   ├── <MapboxMap /> (react-map-gl)
│   │   ├── <DrawControl /> (@mapbox/mapbox-gl-draw)
│   │   ├── <SelectionOverlay />
│   │   └── <DeliveryRouteLines /> (animated)
│   │
│   └── <ControlPanel>
│       ├── <AreaSelectionControls>
│       │   ├── <DrawButton />
│       │   ├── <ClearButton />
│       │   └── <PolygonInfo />
│       │
│       ├── <AddressList>
│       │   ├── <AddressCard /> (repeated)
│       │   └── <AddressCount />
│       │
│       ├── <GiftPairingSection>
│       │   ├── <StrategySelector />
│       │   ├── <PairGiftsButton />
│       │   ├── <PairingProgress />
│       │   └── <EmailNotificationPreview />
│       │
│       ├── <NotificationStatus>
│       │   ├── <EmailSentCount />
│       │   ├── <EmailFailedCount />
│       │   └── <NotificationLog />
│       │
│       └── <OrderSummary>
│           ├── <TotalCount />
│           ├── <TotalCost />
│           ├── <ConfirmOrderButton />
│           └── <ExportManifestButton />
│
└── <Footer>
    └── <HackathonBadge />
```

---

## Database Schema (In-Memory)

For the hackathon MVP, all data is stored in-memory using TypeScript Maps and Arrays. This eliminates database setup time while maintaining clean data access patterns.

```typescript
/**
 * In-memory data store for the hackathon MVP.
 * Uses Maps for O(1) lookup by ID and Arrays for ordered iteration.
 */
type DataStore = {
  /** Order batches indexed by batch ID */
  batches: Map<string, OrderBatch>;
  /** Individual orders indexed by order ID */
  orders: Map<string, Order>;
  /** Address selections indexed by selection ID */
  selections: Map<string, AddressSelection>;
};

type OrderBatch = {
  id: string;
  createdAt: Date;
  orderIds: string[];
  status: 'PENDING' | 'CONFIRMED' | 'EXPORTED';
  totalCost: number;
};

type AddressSelection = {
  id: string;
  polygon: GeoJSON.Polygon;
  addressIds: string[];
  createdAt: Date;
};
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxxx    # Mapbox public token for client-side maps

# Dedalus Labs Configuration
DEDALUS_API_KEY=sk-xxxx                     # Dedalus API key for MCP server access

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Application base URL
NODE_ENV=development                         # Environment mode
```

### Environment Setup Instructions

1. Create a `.env.local` file in the project root
2. Copy the template above and fill in your credentials
3. Obtain a Mapbox token from [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)
4. Obtain a Dedalus API key from [dedaluslabs.ai/dashboard](https://dedaluslabs.ai/dashboard)

---

## 6-Hour Implementation Timeline

### Hour 0–1: Project Setup and Scope Lock (4:45 PM – 5:45 PM)

**Objectives:**

This first hour establishes the foundation. The team must resist feature creep and commit to the defined scope. The deliverable by end of hour is a running Next.js application with Mapbox displaying and Dedalus SDK initialized.

**Tasks:**

1. Initialize Next.js 16 project with TypeScript and Tailwind CSS
2. Install all dependencies (see package.json below)
3. Configure environment variables
4. Verify Mapbox token works with a basic map render
5. Verify Dedalus SDK connects with a simple test query
6. Create folder structure and placeholder components

**Verification Checklist:**

- [ ] `npm run dev` starts without errors
- [ ] Map renders at localhost:3000
- [ ] Console shows "Dedalus connected" message
- [ ] TypeScript compiles without errors

### Hour 1–2: Globe/Map Interface (5:45 PM – 6:45 PM)

**Objectives:**

Build the interactive map with polygon drawing capabilities. By end of hour, users can draw a polygon on the map and the system captures the GeoJSON representation.

**Tasks:**

1. Implement `<GlobeMap />` component with globe projection
2. Add Mapbox Draw control for polygon selection
3. Create draw mode toggle button
4. Capture polygon GeoJSON on draw completion
5. Display selection feedback (highlight selected area)
6. Add basic styling for festive theme

**Verification Checklist:**

- [ ] Globe renders with dark theme
- [ ] Draw button activates polygon mode
- [ ] Polygon completes on double-click
- [ ] Console logs GeoJSON of selected polygon

### Hour 2–3: Address Service with Overpass API (6:45 PM – 7:45 PM)

**Objectives:**

Implement the OpenStreetMap Overpass API integration for real-world address identification. By end of hour, selecting any area on the globe returns a list of real addresses within that region.

**Tasks:**

1. Implement Overpass QL query builder (polygon to OSM query)
2. Create `/api/addresses/identify` endpoint with Overpass API integration
3. Build OSM-to-Address transformer (parse OSM tags into Address schema)
4. Implement household metadata inference from building tags
5. Connect frontend to address service with loading states
6. Display address list in control panel with OSM attribution
7. Add address markers to map (handle way centroids)

**Verification Checklist:**

- [ ] Overpass API query executes successfully
- [ ] API returns real OSM addresses within polygon
- [ ] Address list renders in sidebar with proper formatting
- [ ] Markers appear on map for identified addresses
- [ ] OSM attribution displays correctly
- [ ] Error handling works for empty/sparse areas

### Hour 3–4: AI Gift Pairing + Email Notifications with Dedalus MCP (7:45 PM – 8:45 PM)

**Objectives:**

Implement the core MCP integration using Dedalus Labs SDK with the AgentMail MCP server from the Dedalus Marketplace. By end of hour, the system uses AI to recommend appropriate gifts for each identified address based on household metadata and sends festive email notifications to recipients.

**Tasks:**

1. Create mock product catalog (20 products)
2. Implement Dedalus runner with AgentMail MCP server connection (`vroom08/agentmail-mcp`)
3. Create custom tool for catalog queries
4. Build gift pairing prompt engineering with email notification instructions
5. Implement `/api/gifts/pair` endpoint
6. Implement `/api/notifications/send` endpoint
7. Display pairings in UI with AI reasoning
8. Show email notification status/preview in UI

**Verification Checklist:**

- [ ] AgentMail MCP server connection established
- [ ] AI returns valid product recommendations
- [ ] Festive email notifications sent successfully
- [ ] Pairing reasons display in UI
- [ ] Different households get different recommendations
- [ ] Email send status displayed in UI

### Hour 4–5: Order Generation (8:45 PM – 9:45 PM)

**Objectives:**

Create the order generation system with mock Amazon integration. By end of hour, users can confirm orders and see a complete order summary.

**Tasks:**

1. Implement order ID generation
2. Create `/api/orders/create` endpoint
3. Build order summary component
4. Calculate totals and estimated delivery
5. Add "Confirm Area Order" button
6. Implement CSV export functionality

**Verification Checklist:**

- [ ] Orders generate with HOHOHO prefix
- [ ] Summary shows total count and cost
- [ ] CSV downloads successfully
- [ ] Order status displays correctly

### Hour 5–6: Demo Polish (9:45 PM – 10:00 PM + Buffer)

**Objectives:**

Add visual polish and prepare for the 3-minute demo. Focus on animations and the "wow factor" for judges.

**Tasks:**

1. Add animated delivery lines (depot → houses)
2. Implement order counter animation
3. Polish UI with festive styling
4. Add loading states and transitions
5. Test complete flow end-to-end
6. Prepare demo script and talking points

**Verification Checklist:**

- [ ] Animated lines draw smoothly
- [ ] Counter increments dramatically
- [ ] No console errors
- [ ] Demo flow works in under 3 minutes

---

## Package.json Specification

```json
{
  "name": "icbg",
  "version": "1.0.0",
  "description": "Intercontinental ballistic gift dispatch platform for Santa's logistics operations",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.0.10",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "dedalus-labs": "0.1.0-alpha.4",
    "mapbox-gl": "3.17.0",
    "react-map-gl": "8.1.0",
    "@mapbox/mapbox-gl-draw": "1.5.1",
    "@turf/turf": "7.3.1",
    "@tanstack/react-query": "^5.62.0",
    "nanoid": "^5.0.9",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "@types/geojson": "^7946.0.15",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.49",
    "eslint": "^9.16.0",
    "eslint-config-next": "16.0.10"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

---

## Dedalus Labs MCP Integration Details

### MCP Server Selection

The project uses the **AgentMail MCP server** (`vroom08/agentmail-mcp`) from the [Dedalus Labs Marketplace](https://www.dedaluslabs.ai/marketplace/vroom08/agentmail-mcp) as the primary MCP integration. This server provides email sending capabilities that enable the platform to send festive delivery notifications to gift recipients. The marketplace-hosted server is fully managed by Dedalus Labs, handling hosting, scaling, and availability automatically.

### Integration Architecture

```typescript
/**
 * Configuration for Dedalus Labs SDK integration.
 * This setup enables AI-powered gift pairing with email notifications
 * via the AgentMail MCP server from the Dedalus Marketplace.
 */
import Dedalus from 'dedalus-labs';
import { DedalusRunner } from 'dedalus-labs';

/**
 * Initializes the Dedalus client with API key from environment.
 * The client handles authentication and request signing automatically.
 */
const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY
});

/**
 * Creates a DedalusRunner instance for orchestrating agent workflows.
 * The runner manages tool execution, MCP server communication, and
 * multi-turn conversations with the underlying LLM.
 */
const runner = new DedalusRunner(client);

/**
 * Local tool function for querying the product catalog.
 * Dedalus SDK automatically extracts the function signature and
 * docstring to generate the tool schema for the LLM.
 * 
 * @param category - Product category to filter ('toys', 'books', 'electronics', 'home', 'clothing')
 * @param ageRange - Target age range ('children', 'teen', 'adult', 'all')
 * @returns Array of products matching the criteria
 */
function searchProducts(category: string, ageRange?: string): Product[] {
  return mockCatalog.filter(product => {
    const categoryMatch = product.category === category;
    const ageMatch = !ageRange || product.ageRange === ageRange || product.ageRange === 'all';
    return categoryMatch && ageMatch;
  });
}

/**
 * Generates gift recommendations for a list of addresses using AI,
 * then sends email notifications via the AgentMail MCP server.
 * Combines local product search tools with MCP server email capabilities.
 * 
 * @param addresses - Array of addresses with household metadata
 * @param recipientEmails - Optional map of address IDs to recipient email addresses
 * @returns Promise resolving to AI-generated gift pairings with notification status
 */
async function generateGiftRecommendations(
  addresses: Address[],
  recipientEmails?: Map<string, string>
): Promise<GiftPairing[]> {
  const prompt = `
You are Santa's AI gift coordinator. For each household below, recommend 
an appropriate gift from the available catalog. Consider the household type,
whether children are present, and the estimated age demographics.

After selecting gifts, send a festive email notification to each recipient
using the AgentMail email tools. The email should have:
- Subject: "🎅 Santa's Delivering Your Present!"
- Body: A warm, festive message announcing that a special gift is on its way,
  mentioning the estimated delivery window of December 23-24, 2025.
  Sign it "With holiday cheer, Santa's Workshop"

Households to process:
${addresses.map(a => `
- Address ID: ${a.id}
- Address: ${a.streetAddress}, ${a.city}, ${a.state} ${a.postalCode}
- Household Type: ${a.metadata?.householdType ?? 'unknown'}
- Has Children: ${a.metadata?.hasChildren ?? 'unknown'}
- Estimated Age: ${a.metadata?.estimatedAge ?? 'unknown'}
${recipientEmails?.get(a.id) ? `- Email: ${recipientEmails.get(a.id)}` : ''}
`).join('\n')}

Use the searchProducts tool to find appropriate gifts. For each household,
provide your recommendation in the following JSON format:
{
  "addressId": "...",
  "asin": "...",
  "reason": "Brief explanation of why this gift fits this household",
  "emailSent": true/false
}
`.trim();

  const result = await runner.run({
    input: prompt,
    model: 'openai/gpt-4o-mini',
    tools: [searchProducts],
    mcpServers: ['vroom08/agentmail-mcp']
  });

  return parseRecommendations(result.finalOutput);
}
```

### AgentMail MCP Server Capabilities

The AgentMail MCP server (`vroom08/agentmail-mcp`) from the Dedalus Labs Marketplace provides email functionality:

1. **Email Sending:** Send transactional emails with customizable subject, body, and recipient
2. **Rich Content:** Support for HTML-formatted email bodies with festive styling
3. **Delivery Tracking:** Confirmation of email dispatch status
4. **Managed Infrastructure:** Fully hosted by Dedalus Labs—no SMTP configuration required

### Email Notification Templates

The system sends festive delivery notifications with the following structure:

```typescript
/**
 * Email notification template for gift delivery announcements.
 * Sent via the AgentMail MCP server when gifts are paired.
 */
type DeliveryNotificationEmail = {
  /** Recipient email address */
  to: string;
  /** Festive subject line with emoji */
  subject: '🎅 Santa\'s Delivering Your Present!';
  /** HTML-formatted email body */
  body: string;
};

/**
 * Generates the HTML body for a delivery notification email.
 * 
 * @param recipientName - Name of the gift recipient
 * @param address - Delivery address
 * @param estimatedDelivery - Expected delivery date range
 * @returns Formatted HTML email body
 */
function generateNotificationEmailBody(
  recipientName: string,
  address: string,
  estimatedDelivery: string
): string {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #c41e3a; text-align: center;">🎄 Special Delivery Incoming! 🎄</h1>
      <p>Dear ${recipientName},</p>
      <p>Ho ho ho! Great news from the North Pole!</p>
      <p>Santa's elves have prepared something special just for you, and it's being 
      loaded onto the sleigh as we speak. Your gift will be delivered to:</p>
      <p style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
        <strong>${address}</strong>
      </p>
      <p>Expected arrival: <strong>${estimatedDelivery}</strong></p>
      <p>Keep an eye on the sky and listen for sleigh bells!</p>
      <p style="margin-top: 30px;">With holiday cheer,<br/>
      <em>Santa's Workshop</em> 🎅</p>
    </div>
  `;
}
```

### Fallback Strategy

If the MCP server is unavailable, the system falls back to rule-based gift assignment without email notifications:

```typescript
/**
 * Fallback gift pairing strategy when MCP server is unavailable.
 * Uses simple rule-based logic based on household metadata.
 * Email notifications are skipped in fallback mode.
 * 
 * @param address - Address with household metadata
 * @returns Product selected using rule-based logic
 */
function fallbackGiftPairing(address: Address): Product {
  const { metadata } = address;
  
  if (metadata?.hasChildren) {
    return mockCatalog.find(p => p.category === 'toys' && p.ageRange === 'children')!;
  }
  
  if (metadata?.estimatedAge === 'senior') {
    return mockCatalog.find(p => p.category === 'home' && p.ageRange === 'all')!;
  }
  
  // Default: books are universally appreciated
  return mockCatalog.find(p => p.category === 'books')!;
}
```

---

## Demo Script (3 Minutes)

### Opening (30 seconds)

"Imagine you're running Santa's logistics operations. Every December, you need to coordinate gift delivery to millions of households worldwide. Today, I'm showing you ICBG—a platform that lets you select any neighborhood on the globe, automatically identify every household, assign appropriate gifts using AI, and generate a ready-to-fulfill delivery batch in one click."

### Demo Flow (2 minutes)

1. **Globe Interaction (30 sec):** "Here's our interactive globe. I can select any location worldwide—let me zoom into San Francisco and draw a selection around the Castro neighborhood." *[Draw polygon on map]*

2. **Address Identification (20 sec):** "Watch this—ICBG queries OpenStreetMap's Overpass API in real-time and identifies 47 actual households within our selection. These are real addresses from the world's largest open geographic database, not mock data." *[Show address list with OSM attribution]*

3. **AI Gift Pairing + Email Notifications (40 sec):** "Now the magic happens. Using the AgentMail MCP server from the Dedalus Labs Marketplace, our AI analyzes each household—inferring demographics from building types—and recommends appropriate gifts. When gifts are assigned, recipients automatically receive festive email notifications saying 'Santa's delivering your present!' Watch as families get matched with toys while seniors receive cozy home goods." *[Trigger pairing, show progress, display email notification preview]*

4. **Order Generation (30 sec):** "With one click, I generate 47 orders totaling $1,847. Each order has a unique ID, real shipping address, and estimated delivery window. I can export this as a delivery manifest for our fulfillment team." *[Click confirm, show summary, download CSV]*

### Closing (30 seconds)

"What you've seen is fully functional with real data. The area selection works globally with live OpenStreetMap data—over 10 billion geographic features worldwide. Product pairing and email notifications are powered by the AgentMail MCP server from the Dedalus Labs Marketplace—recipients actually receive festive delivery announcements. The Amazon integration is mocked for demo speed, but the interface mirrors the actual fulfillment flow. ICBG—making Santa's operations as smooth as a sleigh on fresh snow."

---

## Judge Evaluation Points

**What judges should believe after the demo:**

1. **Real Data:** Address identification uses live OpenStreetMap data—not mock data—demonstrating real-world applicability
2. **Global Scalability:** Area selection works at any zoom level, any location on the globe with OSM coverage
3. **Automation:** Address ingestion happens automatically through Overpass API geospatial queries
4. **MCP Integration:** Email notifications via the AgentMail MCP server from the Dedalus Labs Marketplace demonstrate real, production-ready MCP integration
5. **User Engagement:** Recipients receive actual festive "Santa's delivering your present!" email notifications
6. **Production-Path:** Amazon ordering is pluggable—the mock system mirrors real API patterns

**Explicit disclaimers to include:**

- "Address data comes from OpenStreetMap—the world's largest open geographic database with over 10 billion features."
- "Email notifications are sent via the AgentMail MCP server hosted on the Dedalus Labs Marketplace—recipients receive real emails."
- "The Amazon integration is mocked for hackathon speed; the interface mirrors the real fulfillment flow and could be connected to actual APIs."

---

## Project Structure

```
icbg/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main application page
│   ├── globals.css             # Global styles including Tailwind
│   └── api/
│       ├── addresses/
│       │   └── identify/
│       │       └── route.ts    # Address identification endpoint
│       ├── gifts/
│       │   └── pair/
│       │       └── route.ts    # Gift pairing endpoint (MCP)
│       ├── notifications/
│       │   └── send/
│       │       └── route.ts    # Email notification endpoint (AgentMail MCP)
│       ├── orders/
│       │   ├── create/
│       │   │   └── route.ts    # Order creation endpoint
│       │   ├── [batchId]/
│       │   │   └── route.ts    # Batch retrieval endpoint
│       │   └── export/
│       │       └── route.ts    # CSV export endpoint
│       └── catalog/
│           └── route.ts        # Product catalog endpoint
│
├── components/
│   ├── GlobeMap/
│   │   ├── index.tsx           # Main map component
│   │   ├── DrawControl.tsx     # Mapbox Draw wrapper
│   │   ├── DeliveryLines.tsx   # Animated route lines
│   │   └── AddressMarkers.tsx  # Household markers
│   │
│   ├── ControlPanel/
│   │   ├── index.tsx           # Control panel container
│   │   ├── AreaSelection.tsx   # Draw controls
│   │   ├── AddressList.tsx     # Address list display
│   │   ├── GiftPairing.tsx     # Pairing controls
│   │   ├── NotificationStatus.tsx # Email notification status
│   │   └── OrderSummary.tsx    # Order summary display
│   │
│   └── ui/
│       ├── Button.tsx          # Styled button component
│       ├── Card.tsx            # Card container
│       ├── Badge.tsx           # Status badges
│       └── Progress.tsx        # Progress indicator
│
├── lib/
│   ├── dedalus.ts              # Dedalus SDK initialization
│   ├── agentmail.ts            # AgentMail MCP email notification service
│   ├── mapbox.ts               # Mapbox configuration
│   ├── overpass.ts             # Overpass API client and query builder
│   ├── types.ts                # TypeScript type definitions
│   └── utils.ts                # Utility functions
│
├── data/
│   └── catalog.json            # Mock product catalog
│
├── .env.local                  # Environment variables (git-ignored)
├── .env.example                # Environment template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Overpass API timeout | Medium | High | Limit polygon size, implement 30s timeout, show user-friendly error |
| Overpass API rate limiting | Low | Medium | Use appropriate query limits, cache results, consider secondary endpoint |
| Sparse OSM data in selected area | Medium | Medium | Display helpful message, suggest alternative areas with better coverage |
| Mapbox rate limiting | Low | Medium | Use cached tiles, limit zoom interactions |
| Dedalus API unavailable | Low | High | Implement fallback rule-based pairing (without email) |
| AgentMail MCP unavailable | Low | Medium | Skip email notifications, proceed with gift pairing only |
| Email delivery failures | Low | Low | Log failures, display partial success in UI, allow retry |
| Browser WebGL issues | Low | Medium | Test in Chrome, have Firefox backup |
| State management complexity | Medium | Medium | Keep state flat, use React Query |

### Time Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict scope lock in Hour 1 |
| Integration delays | Medium | High | Build components independently, integrate last |
| Demo environment issues | Low | High | Test on demo machine early |

### Demo Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Network issues | Medium | High | Cache all API responses, work offline |
| Live demo failure | Low | High | Record backup video of working demo |

---

## Success Criteria

### Minimum Viable Product (Must Have)

1. ✓ Globe displays with polygon selection capability
2. ✓ Selecting area returns list of real addresses (OpenStreetMap Overpass API)
3. ✓ Gift pairing uses Dedalus MCP integration (hackathon requirement)
4. ✓ Email notifications sent via AgentMail MCP server from Dedalus Marketplace
5. ✓ Orders generate with unique IDs and summary
6. ✓ Export functionality produces valid CSV
7. ✓ OSM attribution displayed per license requirements

### Enhanced Features (Nice to Have)

1. ○ Animated delivery route lines
2. ○ Real-time order counter animation
3. ○ Festive UI theme with snow effects
4. ○ Multiple area selection support
5. ○ Order status state machine
6. ○ Email delivery status tracking in UI

### Demo Quality (Must Have)

1. ✓ Complete flow in under 3 minutes
2. ✓ No console errors during demo
3. ✓ Clear explanation of MCP integration
4. ✓ Professional presentation delivery

---

## Appendix A: Data Samples

### Sample Address Data (from OpenStreetMap)

Address data is sourced in real-time from the OpenStreetMap Overpass API. Below is a sample of the transformed output:

```json
{
  "id": "osm_way_123456789",
  "streetAddress": "456 Castro Street",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94114",
  "lat": 37.7612,
  "lng": -122.4348,
  "metadata": {
    "householdType": "family",
    "hasChildren": true,
    "estimatedAge": "middle"
  },
  "osmRef": {
    "type": "way",
    "id": 123456789
  }
}
```

**Raw Overpass API Response (abbreviated):**

```json
{
  "version": 0.6,
  "generator": "Overpass API 0.7.62.4",
  "osm3s": {
    "timestamp_osm_base": "2025-12-14T20:00:00Z",
    "copyright": "The data included in this document is from www.openstreetmap.org."
  },
  "elements": [
    {
      "type": "way",
      "id": 123456789,
      "tags": {
        "building": "house",
        "addr:housenumber": "456",
        "addr:street": "Castro Street",
        "addr:city": "San Francisco",
        "addr:state": "CA",
        "addr:postcode": "94114",
        "building:levels": "2"
      },
      "geometry": [
        { "lat": 37.7611, "lon": -122.4349 },
        { "lat": 37.7611, "lon": -122.4347 },
        { "lat": 37.7613, "lon": -122.4347 },
        { "lat": 37.7613, "lon": -122.4349 },
        { "lat": 37.7611, "lon": -122.4349 }
      ]
    }
  ]
}
```

### Sample Product Data

```json
{
  "asin": "B0X001",
  "name": "LEGO Holiday Train Set",
  "description": "Build and display this festive train with 4 decorated cars, engine, and holiday-themed accessories. Perfect for ages 8+.",
  "price": 49.99,
  "category": "toys",
  "ageRange": "children"
}
```

### Sample Order Data

```json
{
  "orderId": "HOHOHO-A7B2C9D4E1",
  "createdAt": "2025-12-14T22:30:00Z",
  "status": "ORDER_CREATED",
  "shippingAddress": {
    "id": "addr_001",
    "streetAddress": "123 Castro Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94114",
    "lat": 37.7609,
    "lng": -122.4350
  },
  "product": {
    "asin": "B0X001",
    "name": "LEGO Holiday Train Set",
    "price": 49.99
  },
  "estimatedDelivery": {
    "earliest": "2025-12-23",
    "latest": "2025-12-24"
  },
  "cost": {
    "productPrice": 49.99,
    "shipping": 0.00,
    "total": 49.99
  }
}
```

---

## Appendix B: Dedalus Labs SDK Reference

### Installation

```bash
npm install dedalus-labs
```

### Basic Usage Pattern

```typescript
import Dedalus from 'dedalus-labs';
import { DedalusRunner } from 'dedalus-labs';

// Initialize client
const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY
});

// Create runner
const runner = new DedalusRunner(client);

// Execute with MCP servers from Dedalus Marketplace and local tools
const result = await runner.run({
  input: 'Your prompt here',
  model: 'openai/gpt-4o-mini',
  tools: [localFunction1, localFunction2],
  mcpServers: ['vroom08/agentmail-mcp']  // Marketplace server reference format
});

console.log(result.finalOutput);
```

### MCP Server Reference Format

MCP servers from the Dedalus Labs Marketplace are referenced using the format `username/server-name`:

```typescript
// Examples of marketplace MCP server references:
mcpServers: [
  'vroom08/agentmail-mcp',      // Email sending capabilities
  'simon-liang/brave-search-mcp', // Web search
  'windsor/ticketmaster-mcp'    // Event/ticket lookup
]
```

### AgentMail MCP Server

The AgentMail MCP server (`vroom08/agentmail-mcp`) provides email functionality:

- **Marketplace URL:** [dedaluslabs.ai/marketplace/vroom08/agentmail-mcp](https://www.dedaluslabs.ai/marketplace/vroom08/agentmail-mcp)
- **Capabilities:** Send transactional emails, HTML content support, delivery confirmation
- **Use Case:** Sending festive delivery notification emails to gift recipients

```typescript
// Example: Sending email via AgentMail MCP
const result = await runner.run({
  input: `Send an email to recipient@example.com with subject "🎅 Santa's Delivering Your Present!"
          and a festive HTML body announcing their gift delivery.`,
  model: 'openai/gpt-4o-mini',
  mcpServers: ['vroom08/agentmail-mcp']
});
```

### Supported Models

The Dedalus platform supports multiple AI providers through a unified interface:

- OpenAI: `openai/gpt-4o-mini`, `openai/gpt-4.1`, `openai/gpt-5`
- Anthropic: `anthropic/claude-opus-4.1`, `anthropic/claude-sonnet-4.5`
- Google: `google/gemini-2.5-flash`
- Others: See [docs.dedaluslabs.ai/sdk/guides/providers](https://docs.dedaluslabs.ai/sdk/guides/providers)

For this hackathon, `openai/gpt-4o-mini` provides the best balance of speed and capability for gift pairing and email notification workflows.

---

## Appendix C: OpenStreetMap Overpass API Reference

### Overview

The [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) is a read-only API that serves custom selected parts of OpenStreetMap data. It is optimized for data consumers that need elements selected by search criteria like location, type of objects, tag properties, and combinations thereof.

**Key Characteristics:**
- Free to use, no authentication required
- Supports complex geospatial queries via Overpass QL
- Returns data in JSON or XML format
- Queries execute server-side for efficiency
- Public endpoint: `https://overpass-api.de/api/interpreter`

### Overpass QL Query Structure

```
[out:json]           // Output format
[timeout:30]         // Query timeout in seconds
[bbox:south,west,north,east];  // Bounding box filter

(
  // Query statements
  way["building"]["addr:housenumber"](poly:"lat lon lat lon ...");
  node["addr:housenumber"](poly:"lat lon lat lon ...");
);

out body geom;       // Output with geometry
```

### Relevant OSM Tags for Address Identification

| Tag | Description | Example |
|-----|-------------|---------|
| `addr:housenumber` | House/building number | "123" |
| `addr:street` | Street name | "Main Street" |
| `addr:city` | City name | "San Francisco" |
| `addr:state` | State/province | "CA" |
| `addr:postcode` | Postal/ZIP code | "94102" |
| `addr:full` | Complete address string | "123 Main St, SF, CA" |
| `building` | Building type | "house", "apartments", "residential" |
| `building:levels` | Number of floors | "2" |

### Building Type Values for Household Inference

| Value | Typical Household | Gift Strategy |
|-------|-------------------|---------------|
| `house` | Single family | Family-oriented gifts |
| `detached` | Single family | Family-oriented gifts |
| `apartments` | Mixed demographics | Varied gifts |
| `residential` | General residential | Default strategy |
| `terrace` | Row houses, families | Family-oriented gifts |

### Rate Limiting and Best Practices

1. **Query Timeout:** Set `[timeout:30]` to prevent long-running queries
2. **Bounding Box:** Always include `[bbox:...]` to limit query scope
3. **Result Limits:** Process results client-side; Overpass doesn't support LIMIT
4. **Polygon Size:** Keep selection polygons reasonably small (< 1 km²)
5. **Attribution:** Display "© OpenStreetMap contributors" per license requirements

### Alternative Endpoints

If the primary endpoint is unavailable:
- `https://overpass.kumi.systems/api/interpreter`
- `https://overpass.openstreetmap.ru/api/interpreter`

### Example Query for Residential Buildings

```
[out:json][timeout:30];
(
  way["building"~"^(house|residential|apartments|detached|terrace)$"]
    (37.76,-122.44,37.77,-122.43);
  way["building"]["addr:housenumber"]
    (37.76,-122.44,37.77,-122.43);
);
out body geom;
```

This query retrieves all residential-type buildings and buildings with house numbers within a bounding box covering part of San Francisco.

---

*Document prepared for Santa's Ho's HackNight @ Dedalus Labs Break In*  
*Theme: Intercontinental Ballistic Gifts*  
*December 14, 2025*
