import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderHistoryClient } from "./OrderHistoryClient";

/**
 * Orders page with server-side data preloading.
 * Uses Convex's preloadQuery for SSR data fetching.
 *
 * @returns Server-rendered orders page
 */
export default async function OrdersPage() {
  // Preload batch data on the server
  const preloadedBatches = await preloadQuery(api.orderBatches.listBatches);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <span className="text-4xl">📦</span>
              Order History
            </h1>
            <p className="text-muted-foreground">
              View and manage all gift dispatch batches from Santa&apos;s operations
            </p>
          </div>

          <OrderHistoryClient preloadedBatches={preloadedBatches} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
