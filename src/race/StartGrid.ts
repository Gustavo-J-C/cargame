import { Vector2 } from '../utils/math';
import { TrackGeometry } from '../track/TrackData';
import { createCarState, CarState } from '../car/CarPhysics';

export function buildStartGrid(geo: TrackGeometry, count: number): CarState[] {
  const cars: CarState[] = [];
  const { centerline, startAngle } = geo;
  const n = centerline.length;

  // Start line is at index 0; step backward along centerline for grid positions
  const lateralOffset = 28;

  for (let i = 0; i < count; i++) {
    // Walk back from start
    const backIdx = (n - Math.floor((i / 2 + 1) * (n / 30))) % n;
    const center = centerline[backIdx];

    const lateralDir = new Vector2(-Math.sin(startAngle), Math.cos(startAngle));
    const side = i % 2 === 0 ? -1 : 1;
    const pos = center.add(lateralDir.scale(side * lateralOffset));

    cars.push(createCarState(pos.x, pos.y, startAngle));
  }

  return cars;
}
