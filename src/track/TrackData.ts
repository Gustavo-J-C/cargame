import { Vector2 } from '../utils/math';

export interface Waypoint {
  position: Vector2;
  targetSpeed: number; // 0-1, AI speed hint (1=full throttle, 0.4=tight corner)
  width: number;       // track width in pixels at this point
}

export interface TrackDefinition {
  name: string;
  controlPoints: Waypoint[];
  startFinishIndex: number;
  backgroundColor: string;
  roadColor: string;
}

export interface TrackGeometry {
  centerline: Vector2[];
  leftEdge: Vector2[];
  rightEdge: Vector2[];
  widths: number[];
  boundaryPolygon: Vector2[];
  startLine: { left: Vector2; right: Vector2 };
  startAngle: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  // Lane dividers for 3-lane road markings (at ±1/3 of half-width)
  laneDividerL: Vector2[];
  laneDividerR: Vector2[];
}
