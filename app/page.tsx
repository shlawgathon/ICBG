"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as turf from "@turf/turf";
import { GlobeMap } from "@/components/GlobeMap";
import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { generateBatchId, generateOrderId } from "@/lib/utils";
import type { Address, GiftPairing } from "@/lib/types";
import type { Polygon } from "geojson";

/**
 * Demo/test email configurations.
 * These emails are ALWAYS included in notification sends for demonstration purposes.
 * Set to empty array to disable the demo recipients.
 *
 * @example
 * // To enable demo notifications:
 * const DEMO_EMAIL_CONFIGS = [{ email: "test@example.com", name: "Test", address: "123 Test St" }];
 *
 * // To disable demo notifications:
 * const DEMO_EMAIL_CONFIGS = [];
 */
const DEMO_EMAIL_CONFIGS = [
  {
    /** Email address to receive demo notifications */
    email: "aritrasray@gmail.com",
    /** Display name for the demo recipient */
    name: "Aritra Saharay",
    /** Demo address shown in the notification email */
    address: "123 North Pole Lane, Santa's Workshop, Arctic Circle"
  },
  {
    /** Email address to receive demo notifications */
    email: "jerry.x093@gmail.com",
    /** Display name for the demo recipient */
    name: "Jerry Xiao",
    /** Demo address shown in the notification email */
    address: "456 Candy Cane Boulevard, Elf Village, North Pole"
  }
] as const;

/**
 * Main application page for ICBG Mission Control.
 * Provides the globe interface for selecting delivery areas,
 * identifying addresses, pairing gifts, and creating orders.
 *
 * State Management:
 * - Polygon selection state
 * - Address identification state
 * - Gift pairing state
 * - Order creation state
 *
 * @returns Main mission control interface
 */
export default function HomePage() {
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygon, setPolygon] = useState<Polygon | undefined>();
  const [polygonInfo, setPolygonInfo] = useState<{ area: number; vertexCount: number } | undefined>();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Gift pairing state
  const [pairings, setPairings] = useState<GiftPairing[]>([]);
  const [strategy, setStrategy] = useState("ai-recommended");
  const [isPairing, setIsPairing] = useState(false);
  const [pairingProgress, setPairingProgress] = useState(0);

  // Notification state
  const [notificationResults, setNotificationResults] = useState<{ sent: number; failed: number } | undefined>();
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);

  // Order state
  const [isCreatingOrders, setIsCreatingOrders] = useState(false);
  const [confirmedBatchId, setConfirmedBatchId] = useState<string | undefined>();
  const [showDeliveryLines, setShowDeliveryLines] = useState(false);

  // Convex mutations
  const createBatch = useMutation(api.orderBatches.createBatch);
  const createOrders = useMutation(api.orders.createOrdersBatch);

  // Calculate estimated delivery date
  const getEstimatedDelivery = () => {
    const start = new Date();
    start.setDate(start.getDate() + 7); // 1 week from now
    const end = new Date();
    end.setDate(end.getDate() + 10); // 10 days from now
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })}`;
  };

  /**
   * Toggles drawing mode for polygon selection.
   */
  const handleDrawingToggle = useCallback(() => {
    setIsDrawing((prev) => !prev);
  }, []);

  /**
   * Keyboard hotkeys for draw mode control.
   *
   * Supported hotkeys:
   * - 'D' key: Toggle drawing mode on/off
   * - 'Escape' key: Exit drawing mode (if active)
   *
   * Hotkeys are disabled when focus is on input elements to prevent
   * accidental triggering while typing.
   */
  useEffect(() => {
    /**
     * Handles keydown events for draw mode hotkeys.
     * @param event - The keyboard event
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore hotkeys when typing in input fields, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // 'D' key toggles drawing mode
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setIsDrawing((prev) => !prev);
      }

      // 'Escape' key exits drawing mode
      if (event.key === "Escape" && isDrawing) {
        event.preventDefault();
        setIsDrawing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawing]);

  /**
   * Handles completed polygon selection.
   * Calculates area and triggers address identification.
   */
  const handlePolygonComplete = useCallback(async (newPolygon: Polygon) => {
    setPolygon(newPolygon);
    setIsDrawing(false);

    // Calculate polygon info
    const area = turf.area(newPolygon) / 1_000_000; // Convert to km²
    const vertexCount = newPolygon.coordinates[0].length - 1; // Exclude closing point
    setPolygonInfo({ area, vertexCount });

    // Identify addresses in polygon
    setIsLoadingAddresses(true);
    setAddresses([]);
    setPairings([]);
    setConfirmedBatchId(undefined);

    try {
      const response = await fetch("/api/addresses/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polygon: newPolygon, limit: 50 })
      });

      if (!response.ok) {
        throw new Error("Failed to identify addresses");
      }

      const data = await response.json();
      setAddresses(data.addresses);
    } catch (error) {
      console.error("Address identification error:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  /**
   * Clears the current selection and resets state.
   */
  const handleClearSelection = useCallback(() => {
    setPolygon(undefined);
    setPolygonInfo(undefined);
    setAddresses([]);
    setPairings([]);
    setNotificationResults(undefined);
    setConfirmedBatchId(undefined);
    setShowDeliveryLines(false);
  }, []);

  /**
   * Triggers gift pairing for identified addresses.
   */
  const handlePairGifts = useCallback(async () => {
    if (addresses.length === 0) return;

    setIsPairing(true);
    setPairingProgress(0);
    setPairings([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setPairingProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/gifts/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses, strategy })
      });

      clearInterval(progressInterval);
      setPairingProgress(100);

      if (!response.ok) {
        throw new Error("Failed to pair gifts");
      }

      const data = await response.json();
      setPairings(data.pairings);
    } catch (error) {
      console.error("Gift pairing error:", error);
    } finally {
      setIsPairing(false);
    }
  }, [addresses, strategy]);

  /**
   * Sends delivery notification emails.
   * Always includes the demo email recipient (if configured) for demonstration purposes.
   */
  const handleSendNotifications = useCallback(async () => {
    if (pairings.length === 0) return;

    setIsSendingNotifications(true);

    try {
      // Build recipients from pairings (synthetic emails for identified addresses)
      const syntheticRecipients = pairings.map((pairing) => {
        const address = addresses.find((a) => a.id === pairing.addressId);
        return {
          email: `resident@${address?.postalCode || "unknown"}.example.com`,
          name: "Valued Resident",
          address: address?.streetAddress || "Unknown Address"
        };
      });

      // Always include demo email recipients if configured
      const demoRecipients = DEMO_EMAIL_CONFIGS.map((config) => ({
        email: config.email,
        name: config.name,
        address: config.address
      }));
      const recipients = [...demoRecipients, ...syntheticRecipients];

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, estimatedDelivery: getEstimatedDelivery() })
      });

      if (!response.ok) {
        throw new Error("Failed to send notifications");
      }

      const data = await response.json();
      setNotificationResults({ sent: data.sent, failed: data.failed });
    } catch (error) {
      console.error("Notification send error:", error);
      setNotificationResults({
        sent: 0,
        failed: pairings.length + DEMO_EMAIL_CONFIGS.length
      });
    } finally {
      setIsSendingNotifications(false);
    }
  }, [addresses, pairings]);

  /**
   * Creates orders in Convex database.
   */
  const handleConfirmOrders = useCallback(async () => {
    if (pairings.length === 0) return;

    setIsCreatingOrders(true);

    try {
      const batchId = generateBatchId();

      // Calculate delivery dates
      const deliveryStart = new Date();
      deliveryStart.setDate(deliveryStart.getDate() + 7);
      const deliveryEnd = new Date();
      deliveryEnd.setDate(deliveryEnd.getDate() + 10);

      // Create batch
      await createBatch({
        batchId,
        totalCost: pairings.reduce((sum, p) => sum + p.product.price, 0),
        orderCount: pairings.length,
        selectionPolygon: polygon ? JSON.stringify(polygon) : undefined,
        estimatedDeliveryStart: deliveryStart.toISOString(),
        estimatedDeliveryEnd: deliveryEnd.toISOString()
      });

      // Create orders
      const ordersData = pairings.map((pairing) => {
        const address = addresses.find((a) => a.id === pairing.addressId);
        return {
          orderId: generateOrderId(),
          batchId,
          shippingAddress: JSON.stringify(address || {}),
          productAsin: pairing.product.asin,
          productName: pairing.product.name,
          productPrice: pairing.product.price,
          shippingCost: 0, // Santa's free delivery!
          pairingReason: pairing.pairingReason,
          estimatedDeliveryStart: deliveryStart.toISOString(),
          estimatedDeliveryEnd: deliveryEnd.toISOString()
        };
      });

      await createOrders({ orders: ordersData });

      setConfirmedBatchId(batchId);
      setShowDeliveryLines(true);
    } catch (error) {
      console.error("Order creation error:", error);
    } finally {
      setIsCreatingOrders(false);
    }
  }, [addresses, pairings, polygon, createBatch, createOrders]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* Globe Map */}
        <div className="flex-1 relative">
          <GlobeMap
            addresses={addresses}
            onPolygonComplete={handlePolygonComplete}
            onSelectionClear={handleClearSelection}
            showDeliveryLines={showDeliveryLines}
            isDrawing={isDrawing}
            onDrawingToggle={handleDrawingToggle}
          />
        </div>

        {/* Control Panel */}
        <ControlPanel
          isDrawing={isDrawing}
          onStartDraw={handleDrawingToggle}
          onClearSelection={handleClearSelection}
          polygonInfo={polygonInfo}
          addresses={addresses}
          isLoadingAddresses={isLoadingAddresses}
          pairings={pairings}
          strategy={strategy}
          onStrategyChange={setStrategy}
          onPairGifts={handlePairGifts}
          isPairing={isPairing}
          pairingProgress={pairingProgress}
          notificationResults={notificationResults}
          isSendingNotifications={isSendingNotifications}
          onSendNotifications={handleSendNotifications}
          onConfirmOrders={handleConfirmOrders}
          isCreatingOrders={isCreatingOrders}
          confirmedBatchId={confirmedBatchId}
          estimatedDelivery={getEstimatedDelivery()}
        />
      </main>

      <Footer />
    </div>
  );
}
