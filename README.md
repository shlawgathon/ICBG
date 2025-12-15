# 🎅 ICBG - Intercontinental Ballistic Gifts

> Santa's logistics operations platform for global gift delivery

## Overview

ICBG is a full-stack application that combines an interactive 3D globe interface with AI-powered gift recommendations to help Santa efficiently dispatch gifts to households worldwide. The platform identifies addresses within user-selected areas, intelligently pairs appropriate gifts using AI, and manages the entire order lifecycle.

## Features

- 🌍 **Interactive Globe Interface** - Draw polygons on a 3D globe to select delivery areas
- 🏠 **Real-time Address Identification** - Fetch building addresses from OpenStreetMap Overpass API
- 🤖 **AI-Powered Gift Pairing** - Intelligent gift recommendations based on household metadata
- 📧 **Email Notifications** - Festive delivery notifications via AgentMail MCP
- 📦 **Order Management** - Create, track, and export delivery batches
- 🎨 **Festive Dark Theme** - Holiday-themed UI with shadcn/ui components

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.0.10 |
| Language | TypeScript | 5.7.x |
| Runtime | Node.js | 22.x LTS |
| Database | Convex | 1.17.x |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 4.x |
| Mapping | Mapbox GL JS | 3.17.0 |
| Geospatial | @turf/turf | 7.3.1 |
| AI/MCP | dedalus-labs | 0.1.0-alpha.4 |

## Getting Started

### Prerequisites

- Node.js 22.x LTS
- npm or pnpm
- Mapbox account (for access token)
- Convex account (for database)
- Dedalus Labs API key (for AI features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ICBG.git
cd ICBG
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
DEDALUS_API_KEY=sk-xxx
```

4. Initialize Convex:

```bash
npx convex dev
```

This will:
- Create a new Convex project
- Deploy the schema and functions
- Populate `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

5. Start the development servers:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
icbg/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── addresses/     # Address identification
│   │   ├── catalog/       # Product catalog
│   │   ├── gifts/         # Gift pairing
│   │   ├── notifications/ # Email notifications
│   │   └── orders/        # Order export
│   ├── orders/            # Order history page
│   └── page.tsx           # Main mission control
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── GlobeMap/         # Map and drawing components
│   ├── ControlPanel/     # Sidebar controls
│   └── OrderHistory/     # Order management
├── convex/               # Convex database
│   ├── schema.ts         # Database schema
│   ├── orderBatches.ts   # Batch operations
│   ├── orders.ts         # Order operations
│   └── addressSelections.ts
├── lib/                  # Utility libraries
│   ├── types.ts          # TypeScript types
│   ├── overpass.ts       # OSM Overpass client
│   ├── dedalus.ts        # AI gift pairing
│   ├── agentmail.ts      # Email notifications
│   ├── mapbox.ts         # Map configuration
│   └── utils.ts          # Utilities
└── data/
    └── catalog.json      # Mock product catalog
```

## Usage

### Mission Control Flow

1. **Select Area** - Click "Select Area" and draw a polygon on the globe
2. **Review Addresses** - View identified addresses with household metadata
3. **Pair Gifts** - Use AI or manual strategy to assign gifts
4. **Send Notifications** - (Optional) Send delivery emails
5. **Confirm Orders** - Create batch in database
6. **Export** - Download CSV/JSON manifest

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/addresses/identify` | POST | Identify addresses in polygon |
| `/api/gifts/pair` | POST | Pair gifts with addresses |
| `/api/notifications/send` | POST | Send delivery emails |
| `/api/orders/export` | GET | Export orders as CSV/JSON |
| `/api/catalog` | GET | Browse product catalog |

## Development

```bash
# Run development servers
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- OpenStreetMap contributors for address data
- Mapbox for the globe visualization
- Dedalus Labs for AI/MCP integration
- shadcn for the beautiful UI components

---

🎄 Built with ❤️ for the Holiday Season 2025
