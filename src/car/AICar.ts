import { CarState, updatePhysics } from './CarPhysics';
import { Vector2, clamp, normalizeAngle } from '../utils/math';
import { CONFIG } from '../config';

export class AICar {
  private difficulty: number; // 0-1, affects speed multiplier

  constructor(public state: CarState, difficulty = 0.88) {
    this.difficulty = difficulty;
  }

  update(dt: number, waypoints: Vector2[], waypointSpeeds: number[]): void {
    if (this.state.finished) return;

    const n = waypoints.length;
    const lookahead = CONFIG.AI_LOOKAHEAD;
    const targetIdx = (this.state.waypointIndex + lookahead) % n;
    const target = waypoints[targetIdx];
    const pos = this.state.position;

    // Steering: compute angle to lookahead waypoint
    const angleToTarget = Math.atan2(target.y - pos.y, target.x - pos.x);
    const angleDiff = normalizeAngle(angleToTarget - this.state.angle);
    this.state.steer = clamp(angleDiff / (Math.PI / 3), -1, 1);

    // Speed control based on waypoint hint
    const desiredSpeed = waypointSpeeds[this.state.waypointIndex] * CONFIG.CAR.MAX_SPEED * this.difficulty;
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
