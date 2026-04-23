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
    const normal = tangent.perp();
    const halfW = widths[i] / 2;
    leftEdge.push(positions[i].add(normal.scale(halfW)));
    rightEdge.push(positions[i].add(normal.scale(-halfW)));
  }

  // Lane dividers: 1/3 of the way from centre to each edge
  const laneDividerL: Vector2[] = [];
  const laneDividerR: Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const c = positions[i];
    laneDividerL.push(c.add(leftEdge[i].sub(c).scale(1 / 3)));
    laneDividerR.push(c.add(rightEdge[i].sub(c).scale(1 / 3)));
  }

  // Tree positions: grid over world with deterministic jitter, filtered by track clearance
  const treePositions: Vector2[] = [];
  {
    const gridStep = 170;
    const clearance = 38; // extra px beyond track half-width
    const pad = 200;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of positions) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }
    for (let gx = minX - pad; gx < maxX + pad; gx += gridStep) {
      for (let gy = minY - pad; gy < maxY + pad; gy += gridStep) {
        const h1 = Math.sin(gx * 0.017 + gy * 0.013) * 43758.5453;
        const h2 = Math.sin(gy * 0.023 + gx * 0.011) * 12345.678;
        const jx = (h1 - Math.floor(h1) - 0.5) * gridStep * 0.7;
        const jy = (h2 - Math.floor(h2) - 0.5) * gridStep * 0.7;
        const tx = gx + jx;
        const ty = gy + jy;
        let tooClose = false;
        for (let i = 0; i < n; i++) {
          const dx = positions[i].x - tx;
          const dy = positions[i].y - ty;
          const minDist = widths[i] / 2 + clearance;
          if (dx * dx + dy * dy < minDist * minDist) { tooClose = true; break; }
        }
        if (!tooClose) treePositions.push(new Vector2(tx, ty));
      }
    }
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
    laneDividerL,
    laneDividerR,
    treePositions,
  };
}
