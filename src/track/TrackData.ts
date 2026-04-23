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
  widths: number[];            // track width at each centerline point
  boundaryPolygon: Vector2[];  // left edge + reversed right edge (for collision)
  startLine: { left: Vector2; right: Vector2 };
  startAngle: number;
}
