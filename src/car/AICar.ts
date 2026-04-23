import { CarState, updatePhysics } from './CarPhysics';
import { Vector2, clamp, normalizeAngle } from '../utils/math';
import { CONFIG } from '../config';

export class AICar {
  constructor(
    public state: CarState,
    private speedFactor = 0.88,
    private lookaheadCount = 4,
    // Lateral offset from centerline in pixels; spreads AI across 3 lanes
    private laneOffset = 0,
  ) {}

  update(
    dt: number,
    waypoints: Vector2[],
    waypointSpeeds: number[],
    playerProgress = 0, // lapCount * n + waypointIndex, for rubber-band
  ): void {
    if (this.state.finished) return;

    const n = waypoints.length;

    // ── Steering: aim at lookahead waypoint, offset to preferred lane ──
    const targetIdx = (this.state.waypointIndex + this.lookaheadCount) % n;
    const base = waypoints[targetIdx];

    // Compute lateral offset perpendicular to line from car to target
    const dx = base.x - this.state.position.x;
    const dy = base.y - this.state.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const target = new Vector2(
      base.x + (-dy / dist) * this.laneOffset,
      base.y + ( dx / dist) * this.laneOffset,
    );

    const angleToTarget = Math.atan2(
      target.y - this.state.position.y,
      target.x - this.state.position.x,
    );
    const angleDiff = normalizeAngle(angleToTarget - this.state.angle);
    const rawSteer = clamp(angleDiff / (Math.PI / 3), -1, 1);

    // Smooth steering to reduce oscillation (damped toward raw value)
    this.state.steer += (rawSteer - this.state.steer) * Math.min(1, dt * 9);

    // ── Speed: look ahead N waypoints for the minimum upcoming speed ──
    const lookAhead = 8;
    let minUpcoming = 1.0;
    for (let j = 1; j <= lookAhead; j++) {
      const idx = (this.state.waypointIndex + j) % n;
      if (waypointSpeeds[idx] < minUpcoming) minUpcoming = waypointSpeeds[idx];
    }

    // ── Rubber-band: close the gap to player by boosting/trimming speed ──
    const myProgress = this.state.lapCount * n + this.state.waypointIndex;
    const gap = playerProgress - myProgress;
    let rubberBand = 1.0;
    if (gap > n * 0.25)      rubberBand = 1.06; // far behind — catch up
    else if (gap < -n * 0.1) rubberBand = 0.96; // far ahead  — ease off

    const desiredSpeed = minUpcoming * CONFIG.CAR.MAX_SPEED * this.speedFactor * rubberBand;
    const speedErr = desiredSpeed - this.state.speed;

    // Proportional throttle/brake (smoother than bang-bang)
    if (speedErr > 10) {
      this.state.throttle = clamp(speedErr / 80, 0.15, 1);
      this.state.brake = 0;
    } else if (speedErr < -15) {
      this.state.throttle = 0;
      this.state.brake = clamp(-speedErr / 100, 0, 1);
    } else {
      // Cruise — tiny throttle to overcome rolling friction
      this.state.throttle = 0.12;
      this.state.brake = 0;
    }

    updatePhysics(this.state, dt);
  }
}
