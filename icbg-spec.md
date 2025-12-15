# Intercontinental Ballistic Gifts (ICBG)

## Technical Specification Document

**Version:** 1.0.0  
**Date:** December 14, 2025  
**Hackathon:** Santa's Ho's HackNight @ Dedalus Labs Break In  
**Theme:** Sleighs, Logistics, and Routing  
**Duration:** 6 hours (4:45 PM – 9:00 PM)

---

## Executive Summary

**ICBG** is a web-based logistics platform that enables Santa's operations team to select any neighborhood on a globe, automatically identify households within that region, intelligently assign gifts to each address, and generate a ready-to-fulfill delivery batch—all in a single action. The platform demonstrates scalable logistics infrastructure with AI-powered product pairing capabilities, leveraging the Dedalus Labs SDK with MCP (Model Context Protocol) server integration for intelligent gift recommendations.

**One-Sentence Pitch:**  
"Click any neighborhood on a globe, auto-select every household, assign gifts at scale with AI, and generate a ready-to-fulfill delivery batch in one action."

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
│  │ (Turf.js +      │  │  (Dedalus Labs SDK +    │  │   (Mock Amazon)     │  │
│  │  Mock GeoJSON)  │  │   MCP Server)           │  │                     │  │
│  └─────────────────┘  └─────────────────────────┘  └─────────────────────┘  │
│                                    │                                        │
│                           Dedalus Runner                                    │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ MCP Protocol
                          ┌──────────┴──────────┐
                          │  Dedalus MCP Server │
                          │  (DeepWiki/Custom)  │
                          └─────────────────────┘
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

For the hackathon MVP, the system limits selection to a single city context (San Francisco) with a maximum of 50 addresses per selection to ensure responsive performance within the demo timeframe.

### 2. Address Identification Service

**Endpoint:** `POST /api/addresses/identify`

**Functionality:**

Given a GeoJSON polygon representing a selected area, this service identifies all "households" within that region. For the hackathon demo, this uses a pre-loaded mock dataset of San Francisco addresses rather than live API calls.

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
  /** Unique identifier for the address */
  id: string;
  /** Human-readable street address */
  streetAddress: string;
  /** City name */
  city: string;
  /** State/province code */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Household metadata for gift pairing */
  metadata?: {
    householdType?: 'family' | 'single' | 'elderly';
    hasChildren?: boolean;
    estimatedAge?: 'young' | 'middle' | 'senior';
  };
};

type AddressIdentifyResponse = {
  /** Array of identified addresses */
  addresses: Address[];
  /** Total count of addresses found */
  count: number;
  /** Bounding box of the selection [minLng, minLat, maxLng, maxLat] */
  boundingBox: [number, number, number, number];
};
```

**Implementation Strategy:**

The service uses Turf.js to perform point-in-polygon tests against a pre-loaded GeoJSON dataset. The mock dataset contains approximately 200 sample San Francisco addresses with realistic coordinates and metadata that enables intelligent gift pairing.

```typescript
import * as turf from '@turf/turf';

/**
 * Identifies addresses within a given polygon boundary.
 * Uses Turf.js point-in-polygon testing against the mock address dataset.
 * 
 * @param polygon - GeoJSON polygon defining the selection area
 * @param limit - Maximum number of addresses to return
 * @returns Array of addresses within the polygon boundary
 */
function identifyAddressesInPolygon(
  polygon: GeoJSON.Polygon,
  limit: number = 50
): Address[] {
  const turfPolygon = turf.polygon(polygon.coordinates);
  
  return mockAddresses
    .filter(address => {
      const point = turf.point([address.lng, address.lat]);
      return turf.booleanPointInPolygon(point, turfPolygon);
    })
    .slice(0, limit);
}
```

### 3. AI-Powered Gift Pairing Service (Dedalus Labs MCP Integration)

**Endpoint:** `POST /api/gifts/pair`

**Functionality:**

This service represents the core MCP integration requirement for the hackathon. It uses the Dedalus Labs SDK to connect to an MCP server that provides intelligent gift recommendations based on household metadata. The AI agent analyzes each address's characteristics and selects appropriate gifts from the mock product catalog.

**MCP Server Configuration:**

The system connects to the DeepWiki MCP server for knowledge retrieval and uses a custom prompt to guide gift selection logic. This satisfies the hackathon requirement of using at least one MCP server.

**Dedalus Integration Pattern:**

```typescript
import Dedalus from 'dedalus-labs';
import { DedalusRunner } from 'dedalus-labs';

/**
 * Initializes the Dedalus client and runner for MCP-powered gift pairing.
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
 * Pairs gifts with addresses using AI-powered recommendations.
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
    mcpServers: ['https://mcp.deepwiki.com/mcp']
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

### 4. Order Generation Service

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

### 5. Delivery Manifest Export

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
| `DEDALUS_ERROR` | 502 | MCP server communication failure |
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
│       │   └── <PairingProgress />
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

### Hour 2–3: Address Service (6:45 PM – 7:45 PM)

**Objectives:**

Create the mock address dataset and implement the point-in-polygon identification service. By end of hour, selecting an area returns a list of addresses within that region.

**Tasks:**

1. Create mock San Francisco address dataset (GeoJSON)
2. Implement `/api/addresses/identify` endpoint
3. Integrate Turf.js for geospatial queries
4. Connect frontend to address service
5. Display address list in control panel
6. Add address markers to map

**Verification Checklist:**

- [ ] Mock dataset contains 200+ addresses
- [ ] API returns addresses within polygon
- [ ] Address list renders in sidebar
- [ ] Markers appear on map for identified addresses

### Hour 3–4: AI Gift Pairing with Dedalus MCP (7:45 PM – 8:45 PM)

**Objectives:**

Implement the core MCP integration using Dedalus Labs SDK. By end of hour, the system uses AI to recommend appropriate gifts for each identified address based on household metadata.

**Tasks:**

1. Create mock product catalog (20 products)
2. Implement Dedalus runner with MCP server connection
3. Create custom tool for catalog queries
4. Build gift pairing prompt engineering
5. Implement `/api/gifts/pair` endpoint
6. Display pairings in UI with AI reasoning

**Verification Checklist:**

- [ ] MCP server connection established
- [ ] AI returns valid product recommendations
- [ ] Pairing reasons display in UI
- [ ] Different households get different recommendations

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

The project uses the DeepWiki MCP server (`https://mcp.deepwiki.com/mcp`) as the primary MCP integration. This server provides general knowledge capabilities that enhance the AI's ability to make contextual gift recommendations. The Dedalus Labs documentation MCP server (`https://docs.dedaluslabs.ai/mcp`) serves as a fallback for SDK-specific queries.

### Integration Architecture

```typescript
/**
 * Configuration for Dedalus Labs SDK integration.
 * This setup enables AI-powered gift pairing using MCP servers.
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
 * Generates gift recommendations for a list of addresses using AI.
 * Combines local product search tools with MCP server capabilities
 * for contextual knowledge retrieval.
 * 
 * @param addresses - Array of addresses with household metadata
 * @returns Promise resolving to AI-generated gift pairings
 */
async function generateGiftRecommendations(
  addresses: Address[]
): Promise<GiftPairing[]> {
  const prompt = `
You are Santa's AI gift coordinator. For each household below, recommend 
an appropriate gift from the available catalog. Consider the household type,
whether children are present, and the estimated age demographics.

Households to process:
${addresses.map(a => `
- Address ID: ${a.id}
- Household Type: ${a.metadata?.householdType ?? 'unknown'}
- Has Children: ${a.metadata?.hasChildren ?? 'unknown'}
- Estimated Age: ${a.metadata?.estimatedAge ?? 'unknown'}
`).join('\n')}

Use the searchProducts tool to find appropriate gifts. For each household,
provide your recommendation in the following JSON format:
{
  "addressId": "...",
  "asin": "...",
  "reason": "Brief explanation of why this gift fits this household"
}
`.trim();

  const result = await runner.run({
    input: prompt,
    model: 'openai/gpt-4o-mini',
    tools: [searchProducts],
    mcpServers: ['https://mcp.deepwiki.com/mcp']
  });

  return parseRecommendations(result.finalOutput);
}
```

### MCP Server Capabilities

The DeepWiki MCP server provides several tools that enhance the gift recommendation system:

1. **Knowledge Retrieval:** Access to general knowledge for understanding product categories, age-appropriate gifts, and cultural context for gift-giving
2. **Repository Analysis:** Can analyze open-source projects for technical context (useful for understanding the product catalog structure)
3. **Documentation Search:** Searches indexed documentation for implementation patterns

### Fallback Strategy

If the MCP server is unavailable, the system falls back to rule-based gift assignment:

```typescript
/**
 * Fallback gift pairing strategy when MCP server is unavailable.
 * Uses simple rule-based logic based on household metadata.
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

1. **Globe Interaction (30 sec):** "Here's our interactive globe. I'll zoom into San Francisco and draw a selection around the Castro neighborhood." *[Draw polygon on map]*

2. **Address Identification (20 sec):** "Instantly, ICBG identifies 47 households within our selection. Each address includes metadata about the household type." *[Show address list]*

3. **AI Gift Pairing (40 sec):** "Now the magic happens. Using Dedalus Labs' MCP integration, our AI analyzes each household and recommends appropriate gifts. Watch as it pairs families with children with toys, while selecting books and home goods for other households." *[Trigger pairing, show progress]*

4. **Order Generation (30 sec):** "With one click, I generate 47 orders totaling $1,847. Each order has a unique ID, shipping address, and estimated delivery window. I can export this as a delivery manifest for our fulfillment team." *[Click confirm, show summary, download CSV]*

### Closing (30 seconds)

"What you've seen is fully functional. The area selection scales globally, address ingestion is automated through geospatial queries, and product pairing is powered by real AI through the Dedalus MCP server. The Amazon integration is mocked for demo speed, but the interface mirrors the actual fulfillment flow. ICBG—making Santa's operations as smooth as a sleigh on fresh snow."

---

## Judge Evaluation Points

**What judges should believe after the demo:**

1. **Scalability:** Area selection works at any zoom level, any location on the globe
2. **Automation:** Address ingestion happens automatically through geospatial analysis
3. **AI-Ready:** Product pairing demonstrates real MCP integration with intelligent recommendations
4. **Production-Path:** Amazon ordering is pluggable—the mock system mirrors real API patterns

**Explicit disclaimer to include:**

"The Amazon integration is mocked for hackathon speed; the interface mirrors the real fulfillment flow and could be connected to actual APIs."

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
│   ├── mapbox.ts               # Mapbox configuration
│   ├── types.ts                # TypeScript type definitions
│   └── utils.ts                # Utility functions
│
├── data/
│   ├── addresses.json          # Mock address dataset
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
| Mapbox rate limiting | Low | Medium | Use cached tiles, limit zoom interactions |
| Dedalus API unavailable | Low | High | Implement fallback rule-based pairing |
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
2. ✓ Selecting area returns list of addresses (mock data)
3. ✓ Gift pairing uses Dedalus MCP integration (hackathon requirement)
4. ✓ Orders generate with unique IDs and summary
5. ✓ Export functionality produces valid CSV

### Enhanced Features (Nice to Have)

1. ○ Animated delivery route lines
2. ○ Real-time order counter animation
3. ○ Festive UI theme with snow effects
4. ○ Multiple area selection support
5. ○ Order status state machine

### Demo Quality (Must Have)

1. ✓ Complete flow in under 3 minutes
2. ✓ No console errors during demo
3. ✓ Clear explanation of MCP integration
4. ✓ Professional presentation delivery

---

## Appendix A: Mock Data Samples

### Sample Address Data

```json
{
  "id": "addr_001",
  "streetAddress": "123 Castro Street",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94114",
  "lat": 37.7609,
  "lng": -122.4350,
  "metadata": {
    "householdType": "family",
    "hasChildren": true,
    "estimatedAge": "middle"
  }
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

// Execute with MCP servers and local tools
const result = await runner.run({
  input: 'Your prompt here',
  model: 'openai/gpt-4o-mini',
  tools: [localFunction1, localFunction2],
  mcpServers: ['https://mcp.deepwiki.com/mcp']
});

console.log(result.finalOutput);
```

### Supported Models

The Dedalus platform supports multiple AI providers through a unified interface:

- OpenAI: `openai/gpt-4o-mini`, `openai/gpt-4.1`, `openai/gpt-5`
- Anthropic: `anthropic/claude-opus-4.1`, `anthropic/claude-sonnet-4.5`
- Google: `google/gemini-2.5-flash`
- Others: See [docs.dedaluslabs.ai/sdk/guides/providers](https://docs.dedaluslabs.ai/sdk/guides/providers)

For this hackathon, `openai/gpt-4o-mini` provides the best balance of speed and capability for gift pairing recommendations.

---

*Document prepared for Santa's Ho's HackNight @ Dedalus Labs Break In*  
*Theme: Intercontinental Ballistic Gifts*  
*December 14, 2025*
