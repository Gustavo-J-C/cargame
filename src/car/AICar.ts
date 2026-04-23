import { CarState, updatePhysics } from './CarPhysics';
import { Vector2, clamp, normalizeAngle } from '../utils/math';
import { CONFIG } from '../config';

export class AICar {
  constructor(
    public state: CarState,
    private speedFactor = 0.88,
    private lookaheadCount = 4,
  ) {}

  update(dt: number, waypoints: Vector2[], waypointSpeeds: number[]): void {
    if (this.state.finished) return;

    const n = waypoints.length;
    const targetIdx = (this.state.waypointIndex + this.lookaheadCount) % n;
    const target = waypoints[targetIdx];
    const pos = this.state.position;

    const angleToTarget = Math.atan2(target.y - pos.y, target.x - pos.x);
    const angleDiff = normalizeAngle(angleToTarget - this.state.angle);
    this.state.steer = clamp(angleDiff / (Math.PI / 3), -1, 1);

    const desiredSpeed = waypointSpeeds[this.state.waypointIndex] * CONFIG.CAR.MAX_SPEED * this.speedFactor;
    if (this.state.speed < desiredSpeed) {
      this.state.throttle = 1;
      this.state.brake = 0;
    } else {
      this.state.throttle = 0;
      this.state.brake = this.state.speed > desiredSpeed * 1.1 ? 0.6 : 0;
    }

    updatePhysics(this.state, dt);
  }
}
