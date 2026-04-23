import { CarState, updatePhysics } from './CarPhysics';
import { InputManager } from '../core/InputManager';

export class PlayerCar {
  constructor(public state: CarState, private input: InputManager) {}

  update(dt: number): void {
    this.state.throttle = this.input.throttle;
    this.state.brake = this.input.brake;
    this.state.steer = this.input.steer;
    updatePhysics(this.state, dt);
  }
}
