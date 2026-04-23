import { CarState, updatePhysics } from './CarPhysics';
import { Vector2, clamp, normalizeAngle } from '../utils/math';
import { CONFIG } from '../config';

export class AICar {
  constructor(
    public state: CarState,
    // How many waypoints ahead the car aims its steering target.
    // Lower = turns later = wider, slower corners.
    private steeringLookahead = 4,
    // How many waypoints ahead the car checks for upcoming corner speeds.
    // Lower = notices corners later = enters too fast.
    private brakingLookahead = 10,
    private laneOffset = 0,
  ) {}

  update(
    dt: number,
    waypoints: Vector2[],
    waypointSpeeds: number[],
  ): void {
    if (this.state.finished) return;
    const n = waypoints.length;

    // ── Steering: aim at a lookahead waypoint, offset to preferred lane ──
    const targetIdx = (this.state.waypointIndex + this.steeringLookahead) % n;
    const base = waypoints[targetIdx];
    const dx = base.x - this.state.position.x;
    const dy = base.y - this.state.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const target = new Vector2(
      base.x + (-dy / dist) * this.laneOffset,
      base.y + (dx / dist) * this.laneOffset,
    );

    const angleToTarget = Math.atan2(
      target.y - this.state.position.y,
      target.x - this.state.position.x,
    );
    const angleDiff = normalizeAngle(angleToTarget - this.state.angle);
    const rawSteer = clamp(angleDiff / (Math.PI / 3), -1, 1);
    this.state.steer += (rawSteer - this.state.steer) * Math.min(1, dt * 10);

    // ── Throttle / brake: physics-based look-ahead ──
    // For each upcoming waypoint j, compute the minimum speed achievable there
    // if the car brakes at full force from now: vMax = sqrt(u² - 2·B·d).
    // If the corner target speed is lower than vMax → brake now.
    const B = CONFIG.CAR.BRAKE_FORCE;
    const spacing = 15; // approx px per waypoint sample
    const u = this.state.speed;
    let needBrake = false;
    let brakeTarget = CONFIG.CAR.MAX_SPEED;

    for (let j = 1; j <= this.brakingLookahead; j++) {
      const idx = (this.state.waypointIndex + j) % n;
      const cornerTarget = waypointSpeeds[idx] * CONFIG.CAR.MAX_SPEED;
      const d = j * spacing;
      const disc = u * u - 2 * B * d;
      const vMax = disc > 0 ? Math.sqrt(disc) : 0;
      if (cornerTarget < vMax) {
        needBrake = true;
        if (cornerTarget < brakeTarget) brakeTarget = cornerTarget;
      }
    }

    if (needBrake) {
      this.state.throttle = 0;
      this.state.brake = clamp((u - brakeTarget) / 100, 0.3, 1.0);
    } else {
      // Always floor it — no coasting, no artificial speed cap
      this.state.throttle = 1.0;
      this.state.brake = 0;
    }

    updatePhysics(this.state, dt);
  }
}
