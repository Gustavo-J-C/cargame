import { TrackDefinition, TrackGeometry, Waypoint } from './TrackData';
import { Vector2, catmullRom, lerp } from '../utils/math';
import { CONFIG } from '../config';

function sampleSpline(points: Waypoint[], totalSamples: number): { positions: Vector2[]; widths: number[] } {
  const n = points.length;
  const positions: Vector2[] = [];
  const widths: number[] = [];
  const samplesPerSegment = Math.ceil(totalSamples / n);

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      positions.push(catmullRom(p0.position, p1.position, p2.position, p3.position, t));
      widths.push(lerp(p1.width, p2.width, t));
    }
  }
  return { positions, widths };
}

function tangentAt(positions: Vector2[], i: number): Vector2 {
  const n = positions.length;
  const prev = positions[(i - 1 + n) % n];
  const next = positions[(i + 1) % n];
  return next.sub(prev).normalize();
}

export function buildTrack(def: TrackDefinition): TrackGeometry {
  const { positions, widths } = sampleSpline(def.controlPoints, CONFIG.TRACK_SAMPLE_COUNT);
  const n = positions.length;

  const leftEdge: Vector2[] = [];
  const rightEdge: Vector2[] = [];

  for (let i = 0; i < n; i++) {
    const tangent = tangentAt(positions, i);
    const normal = tangent.perp(); // points left
    const halfW = widths[i] / 2;
    leftEdge.push(positions[i].add(normal.scale(halfW)));
    rightEdge.push(positions[i].add(normal.scale(-halfW)));
  }

  const boundaryPolygon = [...leftEdge, ...[...rightEdge].reverse()];

  const sfSampleIndex = Math.floor(
    (def.startFinishIndex / def.controlPoints.length) * n
  );
  const startLine = {
    left: leftEdge[sfSampleIndex],
    right: rightEdge[sfSampleIndex],
  };

  const tangentAtStart = tangentAt(positions, sfSampleIndex);
  const startAngle = Math.atan2(tangentAtStart.y, tangentAtStart.x);

  // Compute bounding box for minimap
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    centerline: positions,
    leftEdge,
    rightEdge,
    widths,
    boundaryPolygon,
    startLine,
    startAngle,
    bounds: { minX, minY, maxX, maxY },
  };
}
