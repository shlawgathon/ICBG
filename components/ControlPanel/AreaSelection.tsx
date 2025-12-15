"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Trash2, Pencil, Globe } from "lucide-react";

/**
 * Props for the AreaSelection component.
 */
type AreaSelectionProps = {
  /** Whether draw mode is currently active */
  isDrawing: boolean;
  /** Callback to start drawing mode */
  onStartDraw: () => void;
  /** Callback to clear the current selection */
  onClearSelection: () => void;
  /** Information about the selected polygon */
  polygonInfo?: {
    /** Area in square kilometers */
    area: number;
    /** Number of vertices in the polygon */
    vertexCount: number;
  };
};

/**
 * AreaSelection provides controls for drawing delivery area polygons.
 * Displays current selection statistics when a polygon is active.
 *
 * @param isDrawing - Whether drawing mode is active
 * @param onStartDraw - Start polygon drawing
 * @param onClearSelection - Clear current polygon
 * @param polygonInfo - Current polygon statistics
 * @returns Area selection card component
 */
export function AreaSelection({ isDrawing, onStartDraw, onClearSelection, polygonInfo }: AreaSelectionProps) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Area Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Draw/Clear buttons */}
        <div className="flex gap-2">
          <Button onClick={onStartDraw} variant={isDrawing ? "secondary" : "default"} className="flex-1">
            {isDrawing ? (
              <>
                <Pencil className="w-4 h-4 mr-2 animate-pulse" />
                Drawing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Select Area
              </>
            )}
          </Button>
          <Button
            onClick={onClearSelection}
            variant="outline"
            size="icon"
            disabled={!polygonInfo}
            title="Clear selection"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Selection statistics */}
        {polygonInfo ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Area</span>
              <span className="font-medium">{polygonInfo.area.toFixed(3)} km²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vertices</span>
              <span className="font-medium">{polygonInfo.vertexCount}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Click &quot;Select Area&quot; then draw a polygon on the map
          </p>
        )}
      </CardContent>
    </Card>
  );
}
