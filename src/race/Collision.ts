import { CarState } from '../car/CarPhysics';
import { TrackGeometry } from '../track/TrackData';
import { Vector2, nearestPointOnSegment } from '../utils/math';
import { CONFIG } from '../config';

// Uses centerline distance instead of pointInPolygon — avoids seam artifacts at start/finish
export function pushCarsOntoTrack(cars: CarState[], geo: TrackGeometry): void {
  for (const car of cars) {
    const { point, index } = nearestOnCenterline(car.position, geo.centerline);
    const halfWidth = geo.widths[index] / 2 - CONFIG.CAR.RADIUS - 2;
    const distToCenter = car.position.distTo(point);

    if (distToCenter > halfWidth) {
      const toCenter = point.sub(car.position).normalize();
      const penetration = distToCenter - halfWidth;

      // Push car back inside the track
      car.position = car.position.add(toCenter.scale(penetration + 1));

      // Cancel the velocity component driving the car into the wall
      const outward = car.velocity.dot(toCenter.scale(-1));
      if (outward > 0) {
        car.velocity = car.velocity.add(toCenter.scale(outward));
        car.velocity = car.velocity.scale(0.55);
      }
    }
  }
}

function nearestOnCenterline(p: Vector2, centerline: Vector2[]): { point: Vector2; index: number } {
  let bestPoint = centerline[0];
  let bestIndex = 0;
  let bestDist = Infinity;
  const step = 3;
  for (let i = 0; i < centerline.length; i += step) {
    const j = (i + step) % centerline.length;
    const { point } = nearestPointOnSegment(p, centerline[i], centerline[j]);
    const d = p.distTo(point);
    if (d < bestDist) {
      bestDist = d;
      bestPoint = point;
      bestIndex = i;
    }
  }
  return { point: bestPoint, index: bestIndex };
}

export function resolveCarCollisions(cars: CarState[]): void {
  const r = CONFIG.CAR.RADIUS;
  const minDist = r * 2;

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      const diff = b.position.sub(a.position);
      const dist = diff.length();
      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) / 2;
        const normal = diff.scale(1 / dist);
        a.position = a.position.add(normal.scale(-overlap));
        b.position = b.position.add(normal.scale(overlap));

        // Exchange some velocity along collision normal
        const relVel = a.velocity.sub(b.velocity).dot(normal);
        if (relVel > 0) {
          const impulse = normal.scale(relVel * 0.5);
          a.velocity = a.velocity.sub(impulse);
          b.velocity = b.velocity.add(impulse);
        }
      }
    }
  }
}
