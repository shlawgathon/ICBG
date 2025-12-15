"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Source, Layer } from "react-map-gl";
import * as turf from "@turf/turf";
import { NORTH_POLE, deliveryLineConfig } from "@/lib/mapbox";
import type { Address } from "@/lib/types";

/**
 * Props for the DeliveryLines component.
 */
type DeliveryLinesProps = {
  /** Addresses to draw delivery lines to */
  addresses: Address[];
};

/**
 * DeliveryLines renders animated arc lines from the North Pole
 * to each delivery address, creating a festive visual effect.
 *
 * Features:
 * - Great circle arcs for realistic globe paths
 * - Staggered animation with sequential reveal
 * - Festive red color scheme
 *
 * @param addresses - Delivery destination addresses
 * @returns Source and Layer components for delivery routes
 */
export function DeliveryLines({ addresses }: DeliveryLinesProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const prevAddressLengthRef = useRef(addresses.length);

  /**
   * Compute GeoJSON data from addresses.
   * Uses useMemo instead of useEffect + setState to avoid cascading renders.
   */
  const geojsonData = useMemo<GeoJSON.FeatureCollection>(() => {
    if (addresses.length === 0) {
      return { type: "FeatureCollection", features: [] };
    }

    const features: GeoJSON.Feature[] = addresses.map((address, index) => {
      // Create great circle line from North Pole to address
      const start = turf.point([NORTH_POLE.longitude, NORTH_POLE.latitude]);
      const end = turf.point([address.lng, address.lat]);
      const line = turf.greatCircle(start, end, {
        npoints: 100
      });

      return {
        ...line,
        properties: {
          addressId: address.id,
          index
        }
      };
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [addresses]);

  // Animate the line drawing using requestAnimationFrame callback pattern
  useEffect(() => {
    // Reset animation progress synchronously when addresses change to empty
    if (addresses.length === 0) {
      // Only update if we had addresses before (prevents unnecessary updates)
      if (prevAddressLengthRef.current > 0) {
        prevAddressLengthRef.current = 0;
      }
      return;
    }

    // Track that we now have addresses
    prevAddressLengthRef.current = addresses.length;

    let animationFrame: number;
    let startTime: number | undefined;
    const duration = 2000; // 2 seconds for full animation
    let isFirstFrame = true;

    const animate = (timestamp: number) => {
      // Reset progress on first frame of new animation (inside RAF callback)
      if (isFirstFrame) {
        isFirstFrame = false;
        setAnimationProgress(0);
        startTime = timestamp;
      }

      if (startTime === undefined) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [addresses]);

  if (addresses.length === 0 || geojsonData.features.length === 0) {
    return null;
  }

  return (
    <Source id="delivery-lines" type="geojson" data={geojsonData}>
      {/* Main delivery line */}
      <Layer
        id="delivery-line-layer"
        type="line"
        paint={{
          "line-color": deliveryLineConfig.color,
          "line-width": deliveryLineConfig.width,
          "line-opacity": 0.8,
          "line-dasharray": [2, 1]
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
      />

      {/* Animated glow effect */}
      <Layer
        id="delivery-line-glow"
        type="line"
        paint={{
          "line-color": "#ffd700",
          "line-width": 4,
          "line-opacity": 0.3 * animationProgress,
          "line-blur": 3
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
      />

      {/* Animated highlight traveling along the line */}
      <Layer
        id="delivery-line-highlight"
        type="line"
        paint={{
          "line-color": "#ffffff",
          "line-width": 2,
          "line-opacity": 0.6,
          "line-gradient": [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            "transparent",
            animationProgress * 0.8,
            "transparent",
            animationProgress * 0.9,
            "#ffd700",
            animationProgress,
            "#ffffff"
          ]
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
      />
    </Source>
  );
}
