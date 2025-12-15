"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AreaSelection } from "./AreaSelection";
import { AddressList } from "./AddressList";
import { GiftPairing } from "./GiftPairing";
import { NotificationStatus } from "./NotificationStatus";
import { OrderSummary } from "./OrderSummary";
import type { Address, GiftPairing as GiftPairingType } from "@/lib/types";
import type { Polygon } from "geojson";

/**
 * Props for the ControlPanel component.
 */
type ControlPanelProps = {
  /** Whether draw mode is active */
  isDrawing: boolean;
  /** Toggle drawing mode */
  onStartDraw: () => void;
  /** Clear current selection */
  onClearSelection: () => void;
  /** Current polygon selection info */
  polygonInfo?: { area: number; vertexCount: number };
  /** Identified addresses in selection */
  addresses: Address[];
  /** Loading state for address identification */
  isLoadingAddresses: boolean;
  /** Gift pairings for addresses */
  pairings: GiftPairingType[];
  /** Current gift pairing strategy */
  strategy: string;
  /** Update pairing strategy */
  onStrategyChange: (strategy: string) => void;
  /** Trigger gift pairing */
  onPairGifts: () => void;
  /** Whether gift pairing is in progress */
  isPairing: boolean;
  /** Progress percentage for pairing */
  pairingProgress: number;
  /** Notification send results */
  notificationResults?: {
    sent: number;
    failed: number;
  };
  /** Whether notifications are being sent */
  isSendingNotifications: boolean;
  /** Send notifications */
  onSendNotifications: () => void;
  /** Confirm and create orders */
  onConfirmOrders: () => Promise<void>;
  /** Whether order creation is in progress */
  isCreatingOrders: boolean;
  /** Confirmed batch ID (after order creation) */
  confirmedBatchId?: string;
  /** Estimated delivery date string */
  estimatedDelivery: string;
};

/**
 * ControlPanel provides the main sidebar interface for ICBG.
 * Contains all operational controls organized in logical sections.
 *
 * Sections:
 * 1. Area Selection - Draw/clear polygon tools
 * 2. Address List - Identified delivery addresses
 * 3. Gift Pairing - AI/manual gift assignment
 * 4. Notification Status - Email delivery tracking
 * 5. Order Summary - Batch creation and export
 *
 * @returns Sidebar control panel component
 */
export function ControlPanel({
  isDrawing,
  onStartDraw,
  onClearSelection,
  polygonInfo,
  addresses,
  isLoadingAddresses,
  pairings,
  strategy,
  onStrategyChange,
  onPairGifts,
  isPairing,
  pairingProgress,
  notificationResults,
  isSendingNotifications,
  onSendNotifications,
  onConfirmOrders,
  isCreatingOrders,
  confirmedBatchId,
  estimatedDelivery,
}: ControlPanelProps) {
  // Calculate order summary data
  const orderCount = pairings.length;
  const totalCost = pairings.reduce((sum, p) => sum + p.product.price, 0);

  return (
    <aside className="w-[400px] h-screen border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>🎅</span>
          <span className="text-primary">ICBG</span>
          <span className="text-muted-foreground font-normal text-sm">
            Control
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Santa's Logistics Operations Dashboard
        </p>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Step 1: Area Selection */}
          <AreaSelection
            isDrawing={isDrawing}
            onStartDraw={onStartDraw}
            onClearSelection={onClearSelection}
            polygonInfo={polygonInfo}
          />

          <Separator />

          {/* Step 2: Address List */}
          <AddressList
            addresses={addresses}
            isLoading={isLoadingAddresses}
          />

          <Separator />

          {/* Step 3: Gift Pairing */}
          <GiftPairing
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            onPairGifts={onPairGifts}
            isPairing={isPairing}
            progress={pairingProgress}
            pairingsCount={pairings.length}
            disabled={addresses.length === 0}
          />

          <Separator />

          {/* Step 4: Notification Status */}
          <NotificationStatus
            results={notificationResults}
            isSending={isSendingNotifications}
            onSend={onSendNotifications}
            disabled={pairings.length === 0}
          />

          <Separator />

          {/* Step 5: Order Summary */}
          <OrderSummary
            orderCount={orderCount}
            totalCost={totalCost}
            estimatedDelivery={estimatedDelivery}
            onConfirmOrders={onConfirmOrders}
            isOrdering={isCreatingOrders}
            confirmedBatchId={confirmedBatchId}
          />
        </div>
      </ScrollArea>
    </aside>
  );
}

