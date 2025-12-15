/**
 * Mapbox GL JS configuration for the ICBG globe interface.
 * Defines map styling, projection, and initial view state.
 */

/**
 * Mapbox access token from environment variable.
 * Required for Mapbox GL JS to function.
 */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

/**
 * Map configuration for globe projection with festive dark theme.
 */
export const mapConfig = {
  /** Globe projection for impressive 3D earth view */
  projection: "globe" as const,
  /** Dark theme style URL */
  style: "mapbox://styles/mapbox/dark-v11",
  /** Atmospheric fog configuration for globe view */
  fog: {
    /** Fog color at horizon */
    color: "rgb(186, 210, 235)",
    /** Sky color at high altitude */
    "high-color": "rgb(36, 92, 223)",
    /** How much the fog blends at the horizon */
    "horizon-blend": 0.02,
    /** Background space color */
    "space-color": "rgb(11, 11, 25)",
    /** Star intensity in space background */
    "star-intensity": 0.6
  }
};

/**
 * Initial view state centered on San Francisco.
 * Can be overridden to focus on different regions.
 */
export const initialViewState = {
  /** Default longitude (San Francisco) */
  longitude: -122.4,
  /** Default latitude (San Francisco) */
  latitude: 37.8,
  /** Default zoom level */
  zoom: 11,
  /** Camera pitch (0 = looking straight down) */
  pitch: 0,
  /** Camera bearing (0 = north up) */
  bearing: 0
};

/**
 * Draw control styles for polygon selection.
 * Uses festive red/green color scheme.
 */
export const drawStyles = [
  // Polygon fill
  {
    id: "gl-draw-polygon-fill",
    type: "fill" as const,
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "fill-color": "#c41e3a",
      "fill-outline-color": "#c41e3a",
      "fill-opacity": 0.2
    }
  },
  // Polygon outline
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line" as const,
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round" as const,
      "line-join": "round" as const
    },
    paint: {
      "line-color": "#228b22",
      "line-dasharray": [0.2, 2],
      "line-width": 3
    }
  },
  // Polygon midpoints
  {
    id: "gl-draw-polygon-midpoint",
    type: "circle" as const,
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#ffd700"
    }
  },
  // Vertices
  {
    id: "gl-draw-point-point-stroke-active",
    type: "circle" as const,
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"], ["!=", "mode", "static"]],
    paint: {
      "circle-radius": 6,
      "circle-color": "#ffffff"
    }
  },
  {
    id: "gl-draw-point-active",
    type: "circle" as const,
    filter: ["all", ["==", "$type", "Point"], ["!=", "meta", "midpoint"], ["!=", "mode", "static"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#c41e3a"
    }
  }
];

/**
 * Line layer configuration for delivery route animation.
 */
export const deliveryLineConfig = {
  /** Line color (festive red) */
  color: "#c41e3a",
  /** Line width */
  width: 2,
  /** Animation speed (ms per unit) */
  animationSpeed: 100
};

/**
 * Marker configuration for address markers.
 */
export const markerConfig = {
  /** Default marker color (festive red) */
  color: "#c41e3a",
  /** Marker size in pixels */
  size: 24,
  /** Anchor position */
  anchor: "bottom" as const
};

/**
 * North Pole coordinates for delivery line origin.
 * Used as the "Santa's Workshop" depot location.
 */
export const NORTH_POLE = {
  latitude: 90,
  longitude: 0
};

/**
 * Creates a great circle line between two points.
 * Used for animated delivery routes.
 *
 * @param start - Starting coordinates [lng, lat]
 * @param end - Ending coordinates [lng, lat]
 * @param steps - Number of interpolation steps
 * @returns GeoJSON LineString coordinates
 */
export function createGreatCircleLine(
  start: [number, number],
  end: [number, number],
  steps: number = 100
): [number, number][] {
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Simple linear interpolation (for demo purposes)
    // A real implementation would use spherical interpolation
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    coordinates.push([lng, lat]);
  }

  return coordinates;
}
