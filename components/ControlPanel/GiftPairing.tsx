"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Gift, Sparkles, Shuffle, Package, Check } from "lucide-react";

/**
 * Props for the GiftPairing component.
 */
type GiftPairingProps = {
  /** Current pairing strategy */
  strategy: string;
  /** Callback to change strategy */
  onStrategyChange: (strategy: string) => void;
  /** Callback to trigger gift pairing */
  onPairGifts: () => void;
  /** Whether pairing is in progress */
  isPairing: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of completed pairings */
  pairingsCount: number;
  /** Whether the pair button is disabled */
  disabled?: boolean;
};

/**
 * GiftPairing provides controls for AI-powered gift assignment.
 * Supports multiple strategies with progress tracking.
 *
 * Strategies:
 * - AI Recommended: Uses household metadata for personalized selections
 * - Round Robin: Cycles through all products evenly
 * - Single Product: Assigns the same gift to everyone
 *
 * @returns Gift pairing card component
 */
export function GiftPairing({
  strategy,
  onStrategyChange,
  onPairGifts,
  isPairing,
  progress,
  pairingsCount,
  disabled = false
}: GiftPairingProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-4 h-4 text-accent" />
          Gift Pairing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Strategy</label>
          <Select value={strategy} onValueChange={onStrategyChange} disabled={isPairing}>
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai-recommended">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  AI Recommended
                </span>
              </SelectItem>
              <SelectItem value="round-robin">
                <span className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  Round Robin
                </span>
              </SelectItem>
              <SelectItem value="single-product">
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Single Product
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pair gifts button */}
        <Button
          onClick={onPairGifts}
          disabled={disabled || isPairing}
          className="w-full"
          variant={pairingsCount > 0 ? "secondary" : "default"}
        >
          {isPairing ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Pairing...
            </>
          ) : pairingsCount > 0 ? (
            <>
              <Gift className="w-4 h-4 mr-2" />
              Re-pair Gifts
            </>
          ) : (
            <>
              <Gift className="w-4 h-4 mr-2" />
              🎁 Pair Gifts
            </>
          )}
        </Button>

        {/* Progress indicator */}
        {isPairing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">Analyzing households with AI...</p>
          </div>
        )}

        {/* Success message */}
        {pairingsCount > 0 && !isPairing && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-500">
            <Check className="w-4 h-4" />
            {pairingsCount} gifts paired successfully
          </div>
        )}
      </CardContent>
    </Card>
  );
}
