"use client";

import { useEffect, useRef, useLayoutEffect } from "react";
import { useControl } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
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
export function DrawControl({ onCreate, onDelete, isDrawing, onDrawingToggle }: DrawControlProps) {
  /**
   * Refs to store the latest callback functions.
   * This pattern avoids the "accessed before declared" issue by using mutable refs
   * that are updated in useLayoutEffect, allowing the useControl callbacks to always
   * access the current versions of the handlers.
   */
  const onCreateRef = useRef(onCreate);
  const onDeleteRef = useRef(onDelete);
  const isDrawingRef = useRef(isDrawing);
  const onDrawingToggleRef = useRef(onDrawingToggle);

  // Keep refs up to date with latest props using useLayoutEffect
  // This runs synchronously after render but before paint, ensuring refs are updated
  // before any event handlers fire
  useLayoutEffect(() => {
    onCreateRef.current = onCreate;
    onDeleteRef.current = onDelete;
    isDrawingRef.current = isDrawing;
    onDrawingToggleRef.current = onDrawingToggle;
  });

  // Initialize Mapbox Draw control
  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: "simple_select",
        styles: drawStyles
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ map }: { map: any }) => {
      /**
       * Handles polygon creation.
       * Deletes any previous polygons to enforce single-polygon mode.
       */
      const handleCreate = (e: { features: Array<{ id: string; geometry: Polygon }> }) => {
        const features = e.features;
        if (features.length > 0) {
          const polygon = features[0].geometry;

          // Delete all other features (single polygon mode)
          const drawControl = map._controls?.find((c: unknown) => c instanceof MapboxDraw) as MapboxDraw | undefined;
          if (drawControl) {
            const allFeatures = drawControl.getAll();
            const featureIds = allFeatures.features
              .filter((f: GeoJSON.Feature) => f.id !== features[0].id)
              .map((f: GeoJSON.Feature) => f.id as string);
            if (featureIds.length > 0) {
              drawControl.delete(featureIds);
            }
          }

          onCreateRef.current(polygon);
        }
      };

      /**
       * Handles polygon deletion.
       */
      const handleDelete = () => {
        onDeleteRef.current();
      };

      /**
       * Handles polygon updates (vertex edits).
       */
      const handleUpdate = (e: { features: Array<{ geometry: Polygon }> }) => {
        const features = e.features;
        if (features.length > 0) {
          const polygon = features[0].geometry;
          onCreateRef.current(polygon);
        }
      };

      /**
       * Handles draw mode changes.
       */
      const handleModeChange = (e: { mode: string }) => {
        const drawMode = e.mode;
        if (drawMode === "draw_polygon" && !isDrawingRef.current) {
          onDrawingToggleRef.current();
        } else if (drawMode === "simple_select" && isDrawingRef.current) {
          onDrawingToggleRef.current();
        }
      };

      // Register event handlers
      map.on("draw.create", handleCreate);
      map.on("draw.delete", handleDelete);
      map.on("draw.update", handleUpdate);
      map.on("draw.modechange", handleModeChange);

      // Store handlers on map for cleanup
      map._drawHandlers = {
        handleCreate,
        handleDelete,
        handleUpdate,
        handleModeChange
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ map }: { map: any }) => {
      // Cleanup event handlers using stored references
      const handlers = map._drawHandlers;
      if (handlers) {
        map.off("draw.create", handlers.handleCreate);
        map.off("draw.delete", handlers.handleDelete);
        map.off("draw.update", handlers.handleUpdate);
        map.off("draw.modechange", handlers.handleModeChange);
        delete map._drawHandlers;
      }
    },
    {
      position: "top-left"
    }
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
