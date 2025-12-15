import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { APIError } from "@/lib/types";

/**
 * CSV column headers for order export
 */
const CSV_HEADERS = [
  "Order ID",
  "Batch ID",
  "Status",
  "Street Address",
  "City",
  "State",
  "Postal Code",
  "Product ASIN",
  "Product Name",
  "Product Price",
  "Shipping Cost",
  "Total Cost",
  "Pairing Reason",
  "Recipient Email",
  "Email Sent",
  "Est. Delivery Start",
  "Est. Delivery End",
  "Created At"
];

/**
 * Escapes a value for CSV format.
 * Wraps in quotes if contains comma, quote, or newline.
 *
 * @param value - Value to escape
 * @returns CSV-safe string
 */
function escapeCSV(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV content from orders array.
 *
 * @param orders - Array of order documents
 * @returns CSV-formatted string
 */
function generateOrdersCSV(
  orders: Array<{
    orderId: string;
    batchId: string;
    status: string;
    shippingAddress: string;
    productAsin: string;
    productName: string;
    productPrice: number;
    shippingCost: number;
    totalCost: number;
    pairingReason?: string;
    recipientEmail?: string;
    emailSent?: boolean;
    estimatedDeliveryStart: string;
    estimatedDeliveryEnd: string;
    _creationTime: number;
  }>
): string {
  const rows = [CSV_HEADERS.join(",")];

  for (const order of orders) {
    // Parse the shipping address JSON
    let address = {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: ""
    };
    try {
      address = JSON.parse(order.shippingAddress);
    } catch {
      // If parsing fails, use the raw string
      address.streetAddress = order.shippingAddress;
    }

    const row = [
      escapeCSV(order.orderId),
      escapeCSV(order.batchId),
      escapeCSV(order.status),
      escapeCSV(address.streetAddress),
      escapeCSV(address.city),
      escapeCSV(address.state),
      escapeCSV(address.postalCode),
      escapeCSV(order.productAsin),
      escapeCSV(order.productName),
      escapeCSV(order.productPrice),
      escapeCSV(order.shippingCost),
      escapeCSV(order.totalCost),
      escapeCSV(order.pairingReason),
      escapeCSV(order.recipientEmail),
      escapeCSV(order.emailSent),
      escapeCSV(order.estimatedDeliveryStart),
      escapeCSV(order.estimatedDeliveryEnd),
      escapeCSV(new Date(order._creationTime).toISOString())
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * GET /api/orders/export
 *
 * Exports orders as CSV or JSON format.
 * Can filter by batch ID or export all orders.
 *
 * Query Parameters:
 * - batchId: Optional batch ID to filter orders
 * - format: "csv" (default) or "json"
 *
 * @param request - Request with optional query parameters
 * @returns CSV file download or JSON response
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const format = searchParams.get("format") ?? "csv";

    let orders;

    if (batchId) {
      // Fetch orders for specific batch
      orders = await fetchQuery(api.orders.getOrdersByBatchId, { batchId });
    } else {
      // Fetch all orders
      orders = await fetchQuery(api.orders.listOrders, {});
    }

    if (!orders || orders.length === 0) {
      const error: APIError = {
        code: "NO_ORDERS",
        message: batchId ? `No orders found for batch: ${batchId}` : "No orders found"
      };
      return NextResponse.json(error, { status: 404 });
    }

    if (format === "json") {
      return NextResponse.json({
        orders,
        count: orders.length,
        exportedAt: new Date().toISOString()
      });
    }

    // Default to CSV export
    const csv = generateOrdersCSV(orders);
    const filename = batchId ? `orders-${batchId}-${Date.now()}.csv` : `all-orders-${Date.now()}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Export error:", error);

    const apiError: APIError = {
      code: "INTERNAL_ERROR",
      message: "Failed to export orders",
      details: process.env.NODE_ENV === "development" ? { error: String(error) } : undefined
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}
