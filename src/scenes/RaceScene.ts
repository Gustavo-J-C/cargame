import { TrackGeometry, TrackDefinition } from '../track/TrackData';
import { buildTrack } from '../track/TrackBuilder';
import { renderTrack } from '../track/TrackRenderer';
import { circuit01 } from '../track/circuits/circuit01';
import { PlayerCar } from '../car/PlayerCar';
import { AICar } from '../car/AICar';
import { drawCar } from '../car/CarRenderer';
import { pushCarsOntoTrack, resolveCarCollisions } from '../race/Collision';
import { buildStartGrid } from '../race/StartGrid';
import { RaceManager } from '../race/RaceManager';
import { renderHUD } from '../hud/HUD';
import { InputManager } from '../core/InputManager';
import { KART_PALETTES } from '../utils/colors';
import { CONFIG } from '../config';

export class RaceScene {
  private def: TrackDefinition;
  private geo: TrackGeometry;
  private player: PlayerCar;
  private aiCars: AICar[];
  private race: RaceManager;
  private allCarStates;
  private waypointSpeeds: number[];

  constructor(private input: InputManager) {
    this.def = circuit01;
    this.geo = buildTrack(this.def);

    // Waypoint speed hints from track definition (sampled to match centerline)
    this.waypointSpeeds = this.buildWaypointSpeedArray();

    // Build start grid (player = index 0, AI = 1..N)
    const gridStates = buildStartGrid(this.geo, 1 + CONFIG.AI_COUNT);

    this.player = new PlayerCar(gridStates[0], input);
    this.aiCars = [
      new AICar(gridStates[1], 0.82),
      new AICar(gridStates[2], 0.86),
      new AICar(gridStates[3], 0.78),
    ];

    this.allCarStates = [
      this.player.state,
      ...this.aiCars.map(a => a.state),
    ];

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
      const s = this.def.controlPoints[cpIdx].targetSpeed * (1 - alpha) +
                this.def.controlPoints[cpNext].targetSpeed * alpha;
      speeds.push(s);
    }
    return speeds;
  }

  update(dt: number): void {
    this.race.update(dt);

    if (this.race.phase === 'racing') {
      this.player.update(dt);
      const wp = this.geo.centerline;
      for (const ai of this.aiCars) {
        ai.update(dt, wp, this.waypointSpeeds);
      }
      pushCarsOntoTrack(this.allCarStates, this.geo);
      resolveCarCollisions(this.allCarStates);
    } else if (this.race.phase === 'countdown') {
      // During countdown let players hold throttle but car doesn't move
    }

    // Restart
    if (this.input.isDown('KeyR')) {
      this.restart();
    }
  }

  render(ctx: CanvasRenderingContext2D, hudCtx: CanvasRenderingContext2D): void {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    // Game world
    renderTrack(ctx, this.def, this.geo, W, H);

    // Cars (sorted by Y for a basic depth illusion isn't needed top-down, but shadows look good)
    for (let i = this.allCarStates.length - 1; i >= 0; i--) {
      const car = this.allCarStates[i];
      const palette = KART_PALETTES[i % KART_PALETTES.length];
      const isPlayer = i === 0;
      drawCar(ctx, car, palette, isPlayer);
    }

    // HUD overlay
    renderHUD(hudCtx, this.player.state, this.race, W, H);
  }

  get isFinished(): boolean {
    return this.race.phase === 'finished' && this.player.state.finished;
  }

  restart(): void {
    const fresh = new RaceScene(this.input);
    Object.assign(this, fresh);
  }
}
