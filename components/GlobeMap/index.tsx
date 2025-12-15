"use client";

import { useCallback, useRef, useState } from "react";
import Map, { MapRef, NavigationControl, ViewState } from "react-map-gl";
import {
  MAPBOX_TOKEN,
  mapConfig,
  initialViewState,
} from "@/lib/mapbox";
import { DrawControl } from "./DrawControl";
import { AddressMarkers } from "./AddressMarkers";
import { DeliveryLines } from "./DeliveryLines";
import type { Address } from "@/lib/types";
import type { Polygon } from "geojson";

import "mapbox-gl/dist/mapbox-gl.css";

/**
 * Props for the GlobeMap component.
 */
type GlobeMapProps = {
  /** Array of identified addresses to display as markers */
  addresses: Address[];
  /** Callback when user completes drawing a polygon */
  onPolygonComplete: (polygon: Polygon) => void;
  /** Callback when user clears the selection */
  onSelectionClear: () => void;
  /** Whether to show delivery animation lines */
  showDeliveryLines?: boolean;
  /** Whether draw mode is active */
  isDrawing: boolean;
  /** Callback to toggle drawing mode */
  onDrawingToggle: () => void;
};

/**
 * GlobeMap component displays an interactive 3D globe using Mapbox GL JS.
 * Supports polygon drawing for area selection and displays address markers.
 *
 * Features:
 * - Globe projection with dark theme
 * - Polygon drawing with festive styling
 * - Address markers with tooltips
 * - Animated delivery lines from North Pole
 *
 * @param addresses - Addresses to display as markers
 * @param onPolygonComplete - Called when polygon is completed
 * @param onSelectionClear - Called when selection is cleared
 * @param showDeliveryLines - Whether to animate delivery routes
 * @param isDrawing - Whether draw mode is active
 * @param onDrawingToggle - Toggle drawing mode
 * @returns Interactive globe map component
 */
export function GlobeMap({
  addresses,
  onPolygonComplete,
  onSelectionClear,
  showDeliveryLines = false,
  isDrawing,
  onDrawingToggle,
}: GlobeMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<ViewState>(initialViewState);

  /**
   * Handles polygon creation from draw control.
   */
  const handleDrawCreate = useCallback(
    (polygon: Polygon) => {
      onPolygonComplete(polygon);
    },
    [onPolygonComplete]
  );

  /**
   * Handles polygon deletion from draw control.
   */
  const handleDrawDelete = useCallback(() => {
    onSelectionClear();
  }, [onSelectionClear]);

  /**
   * Flies to a specific location on the globe.
   */
  const flyTo = useCallback((lng: number, lat: number, zoom: number = 14) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom,
      duration: 2000,
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef as React.RefObject<MapRef>}
        {...viewState}
        onMove={(evt: { viewState: ViewState }) => setViewState(evt.viewState)}
        mapStyle={mapConfig.style}
        mapboxAccessToken={MAPBOX_TOKEN}
        projection={mapConfig.projection}
        fog={mapConfig.fog}
        reuseMaps
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Draw control for polygon selection */}
        <DrawControl
          onCreate={handleDrawCreate}
          onDelete={handleDrawDelete}
          isDrawing={isDrawing}
          onDrawingToggle={onDrawingToggle}
        />

        {/* Address markers */}
        <AddressMarkers
          addresses={addresses}
          onMarkerClick={(address) => flyTo(address.lng, address.lat)}
        />

        {/* Animated delivery lines */}
        {showDeliveryLines && <DeliveryLines addresses={addresses} />}
      </Map>

      {/* Map attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}

