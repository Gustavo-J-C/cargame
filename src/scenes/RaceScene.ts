import { TrackDefinition } from '../track/TrackData';
import { buildTrack } from '../track/TrackBuilder';
import { renderTrack } from '../track/TrackRenderer';
import { circuit01 } from '../track/circuits/circuit01';
import { PlayerCar } from '../car/PlayerCar';
import { AICar } from '../car/AICar';
import { CarState } from '../car/CarPhysics';
import { drawCar } from '../car/CarRenderer';
import { pushCarsOntoTrack, resolveCarCollisions } from '../race/Collision';
import { buildStartGrid } from '../race/StartGrid';
import { RaceManager } from '../race/RaceManager';
import { renderHUD } from '../hud/HUD';
import { InputManager } from '../core/InputManager';
import { KART_PALETTES } from '../utils/colors';
import { CONFIG } from '../config';

export class RaceScene {
  private readonly def: TrackDefinition = circuit01;

  // Assigned by init() — called from constructor and restart()
  private geo!: ReturnType<typeof buildTrack>;
  private player!: PlayerCar;
  private aiCars!: AICar[];
  private race!: RaceManager;
  private allCarStates!: CarState[];
  private waypointSpeeds!: number[];

  constructor(private readonly input: InputManager) {
    this.init();
  }

  // Full state reset — safe to call multiple times
  private init(): void {
    this.geo = buildTrack(this.def);
    this.waypointSpeeds = this.buildWaypointSpeedArray();

    const gridStates = buildStartGrid(this.geo, 1 + CONFIG.AI_COUNT);

    this.player = new PlayerCar(gridStates[0], this.input);
    this.aiCars = [
      new AICar(gridStates[1], 0.82),
      new AICar(gridStates[2], 0.86),
      new AICar(gridStates[3], 0.78),
    ];

    // allCarStates must be built after player/ai so references are consistent
    this.allCarStates = [
      this.player.state,
      ...this.aiCars.map(a => a.state),
    ];

    // RaceManager receives the same array that player/AI will mutate
    this.race = new RaceManager(this.allCarStates, this.geo);
  }

  private buildWaypointSpeedArray(): number[] {
    const cpCount = this.def.controlPoints.length;
    const n = CONFIG.TRACK_SAMPLE_COUNT;
    const speeds: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const cpIdx = Math.floor(t * cpCount);
      const cpNext = (cpIdx + 1) % cpCount;
      const alpha = (t * cpCount) - cpIdx;
      speeds.push(
        this.def.controlPoints[cpIdx].targetSpeed * (1 - alpha) +
        this.def.controlPoints[cpNext].targetSpeed * alpha,
      );
    }
    return speeds;
  }

  update(dt: number): void {
    this.race.update(dt);

    if (this.race.phase === 'racing') {
      this.player.update(dt);
      for (const ai of this.aiCars) {
        ai.update(dt, this.geo.centerline, this.waypointSpeeds);
      }
      pushCarsOntoTrack(this.allCarStates, this.geo);
      resolveCarCollisions(this.allCarStates);
    }

    if (this.input.isDown('KeyR')) {
      this.restart();
    }
  }

  render(ctx: CanvasRenderingContext2D, hudCtx: CanvasRenderingContext2D): void {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;
    renderTrack(ctx, this.def, this.geo, W, H);
    for (let i = this.allCarStates.length - 1; i >= 0; i--) {
      drawCar(ctx, this.allCarStates[i], KART_PALETTES[i % KART_PALETTES.length], i === 0);
    }
    renderHUD(hudCtx, this.player.state, this.race, W, H);
  }

  get isFinished(): boolean {
    return this.race.phase === 'finished' && this.player.state.finished;
  }

  restart(): void {
    this.init();
  }
}
