import { Vector2, clamp, normalizeAngle } from '../utils/math';
import { CONFIG } from '../config';


export interface CarState {
  position: Vector2;
  angle: number;       // radians, 0 = facing right
  velocity: Vector2;
  speed: number;

  // Inputs (-1 to 1)
  throttle: number;
  brake: number;
  steer: number;

  // Race state
  waypointIndex: number;
  lapCount: number;
  finished: boolean;
  finishTime: number;
}

export function createCarState(x: number, y: number, angle: number): CarState {
  return {
    position: new Vector2(x, y),
    angle,
    velocity: new Vector2(0, 0),
    speed: 0,
    throttle: 0,
    brake: 0,
    steer: 0,
    waypointIndex: 0,
    lapCount: 0,
    finished: false,
    finishTime: 0,
  };
}

export function updatePhysics(car: CarState, dt: number): void {
  const C = CONFIG.CAR;

  const forward = new Vector2(Math.cos(car.angle), Math.sin(car.angle));
  const lateral = new Vector2(-Math.sin(car.angle), Math.cos(car.angle));

  // Speed-sensitive steering (less turn at high speed)
  const speedFactor = clamp(car.speed / (C.MAX_SPEED * 0.5), 0.2, 1.0);
  car.angle = normalizeAngle(car.angle + car.steer * C.MAX_STEER_RATE * speedFactor * dt);

  // Decompose velocity along current car axes
  let fwdSpeed = car.velocity.dot(forward);
  let latSpeed = car.velocity.dot(lateral);

  // Throttle and brake act only on the forward component
  fwdSpeed += car.throttle * C.ACCELERATION * dt;
  if (car.brake > 0 && fwdSpeed > 0) {
    fwdSpeed = Math.max(0, fwdSpeed - car.brake * C.BRAKE_FORCE * dt);
  }

  // Rolling friction: normalized to 60fps so feel is frame-rate independent
  fwdSpeed *= Math.pow(C.ROLLING_FRICTION, dt * 60);

  // Lateral grip: removes most lateral slip per frame (grippy kart with slight slide)
  latSpeed *= Math.pow(C.LATERAL_GRIP, dt * 60);

  // Rebuild velocity from axes, clamp to max speed
  car.velocity = forward.scale(fwdSpeed).add(lateral.scale(latSpeed));
  car.speed = car.velocity.length();
  if (car.speed > C.MAX_SPEED) {
    car.velocity = car.velocity.scale(C.MAX_SPEED / car.speed);
    car.speed = C.MAX_SPEED;
  }

  car.position = car.position.add(car.velocity.scale(dt));
}
