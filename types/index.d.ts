/**
 * Type declarations for modules without TypeScript support.
 */

// react-map-gl types
declare module "react-map-gl" {
  import { ReactNode, RefObject } from "react";

  export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  }

  export interface MapProps {
    ref?: RefObject<MapRef>;
    longitude?: number;
    latitude?: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
    onMove?: (evt: { viewState: ViewState }) => void;
    mapStyle?: string;
    mapboxAccessToken?: string;
    projection?: string;
    fog?: Record<string, unknown>;
    reuseMaps?: boolean;
    attributionControl?: boolean;
    children?: ReactNode;
  }

  export interface MapRef {
    flyTo: (options: {
      center: [number, number];
      zoom?: number;
      duration?: number;
    }) => void;
    getMap: () => unknown;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: "bottom" | "top" | "left" | "right" | "center";
    children?: ReactNode;
  }

  export interface SourceProps {
    id: string;
    type: "geojson";
    data: GeoJSON.FeatureCollection | GeoJSON.Feature;
    children?: ReactNode;
  }

  export interface LayerProps {
    id: string;
    type: "line" | "fill" | "circle" | "symbol";
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    filter?: unknown[];
  }

  export interface NavigationControlProps {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  }

  export function useControl<T>(
    onCreate: () => T,
    onAdd?: (context: { map: unknown }) => void,
    onRemove?: (context: { map: unknown }) => void,
    options?: { position?: string }
  ): T;

  export default function Map(props: MapProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Source(props: SourceProps): JSX.Element;
  export function Layer(props: LayerProps): JSX.Element;
  export function NavigationControl(props: NavigationControlProps): JSX.Element;
}

// dedalus-labs SDK types
declare module "dedalus-labs" {
  export interface DedalusOptions {
    apiKey: string;
  }

  export interface RunOptions {
    input: string;
    model?: string;
    tools?: Function[];
    mcpServers?: string[];
  }

  export interface RunResult {
    finalOutput: string;
    toolCalls?: unknown[];
  }

  export default class Dedalus {
    constructor(options: DedalusOptions);
  }

  export class DedalusRunner {
    constructor(client: Dedalus);
    run(options: RunOptions): Promise<RunResult>;
  }
}

