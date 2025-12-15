"use client";

import { useEffect, useCallback } from "react";
import { useControl } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import { drawStyles } from "@/lib/mapbox";
import type { Polygon } from "geojson";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

/**
 * Props for the DrawControl component.
 */
type DrawControlProps = {
  /** Callback when a polygon is created */
  onCreate: (polygon: Polygon) => void;
  /** Callback when a polygon is deleted */
  onDelete: () => void;
  /** Whether draw mode is currently active */
  isDrawing: boolean;
  /** Callback to toggle drawing mode */
  onDrawingToggle: () => void;
};

/**
 * DrawControl integrates Mapbox GL Draw for polygon selection.
 * Provides festive-styled drawing tools for selecting delivery areas.
 *
 * Features:
 * - Single polygon mode (auto-deletes previous polygons)
 * - Festive red/green/gold color scheme
 * - Touch-friendly vertex handles
 *
 * @param onCreate - Called when polygon is completed
 * @param onDelete - Called when polygon is deleted
 * @param isDrawing - Current drawing state
 * @param onDrawingToggle - Toggle drawing mode
 * @returns Mapbox Draw control integrated with react-map-gl
 */
export function DrawControl({
  onCreate,
  onDelete,
  isDrawing,
  onDrawingToggle,
}: DrawControlProps) {
  // Initialize Mapbox Draw control
  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
        styles: drawStyles,
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ map }: { map: any }) => {
      // Event handlers for draw events
      map.on("draw.create", handleCreate);
      map.on("draw.delete", handleDelete);
      map.on("draw.update", handleUpdate);
      map.on("draw.modechange", handleModeChange);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ map }: { map: any }) => {
      // Cleanup event handlers
      map.off("draw.create", handleCreate);
      map.off("draw.delete", handleDelete);
      map.off("draw.update", handleUpdate);
      map.off("draw.modechange", handleModeChange);
    },
    {
      position: "top-left",
    }
  );

  /**
   * Handles polygon creation.
   * Deletes any previous polygons to enforce single-polygon mode.
   */
  const handleCreate = useCallback(
    (e: { features: Array<{ id: string; geometry: Polygon }> }) => {
      const features = e.features;
      if (features.length > 0) {
        const polygon = features[0].geometry;

        // Delete all other features (single polygon mode)
        const allFeatures = draw.getAll();
        const featureIds = allFeatures.features
          .filter((f: GeoJSON.Feature) => f.id !== features[0].id)
          .map((f: GeoJSON.Feature) => f.id as string);
        if (featureIds.length > 0) {
          draw.delete(featureIds);
        }

        onCreate(polygon);
      }
    },
    [draw, onCreate]
  );

  /**
   * Handles polygon deletion.
   */
  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  /**
   * Handles polygon updates (vertex edits).
   */
  const handleUpdate = useCallback(
    (e: { features: Array<{ geometry: Polygon }> }) => {
      const features = e.features;
      if (features.length > 0) {
        const polygon = features[0].geometry;
        onCreate(polygon);
      }
    },
    [onCreate]
  );

  /**
   * Handles draw mode changes.
   */
  const handleModeChange = useCallback(
    (e: { mode: string }) => {
      const drawMode = e.mode;
      if (drawMode === "draw_polygon" && !isDrawing) {
        onDrawingToggle();
      } else if (drawMode === "simple_select" && isDrawing) {
        onDrawingToggle();
      }
    },
    [isDrawing, onDrawingToggle]
  );

  // Sync drawing mode with external state
  useEffect(() => {
    if (draw) {
      if (isDrawing) {
        draw.changeMode("draw_polygon");
      } else {
        draw.changeMode("simple_select");
      }
    }
  }, [draw, isDrawing]);

  return null;
}

