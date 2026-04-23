import { TrackDefinition } from '../track/TrackData';
import { buildTrack } from '../track/TrackBuilder';
import { renderTrack } from '../track/TrackRenderer';
import { circuit02 } from '../track/circuits/circuit02';
import { PlayerCar } from '../car/PlayerCar';
import { AICar } from '../car/AICar';
import { CarState } from '../car/CarPhysics';
import { drawCar } from '../car/CarRenderer';
import { pushCarsOntoTrack, resolveCarCollisions } from '../race/Collision';
import { buildStartGrid } from '../race/StartGrid';
import { RaceManager } from '../race/RaceManager';
import { renderHUD, RankingEntry } from '../hud/HUD';
import { InputManager } from '../core/InputManager';
import { KART_PALETTES } from '../utils/colors';
import { CONFIG, Difficulty } from '../config';
import { NetworkManager } from '../network/NetworkManager';

export interface GameConfig {
  playerName: string;
  mode: 'offline' | 'online';
  difficulty: Difficulty;
  network?: NetworkManager;
}

export class RaceScene {
  private readonly def: TrackDefinition = circuit02;

  private geo!: ReturnType<typeof buildTrack>;
  private player!: PlayerCar;
  private aiCars!: AICar[];
  private race!: RaceManager;
  private allCarStates!: CarState[];
  private waypointSpeeds!: number[];

  private rankingData: RankingEntry[] | null = null;
  private rankingFetched = false;

  // Tracks whether the network state sender was started
  private netSendingActive = false;

  constructor(
    private readonly input: InputManager,
    private readonly config: GameConfig,
  ) {
    this.init();
  }

  private init(): void {
    this.geo = buildTrack(this.def);
    this.waypointSpeeds = this.buildWaypointSpeedArray();
    this.rankingData = null;
    this.rankingFetched = false;
    this.netSendingActive = false;

    const totalCars = this.config.mode === 'offline' ? 1 + CONFIG.AI_COUNT : 1;
    const gridStates = buildStartGrid(this.geo, totalCars);

    this.player = new PlayerCar(gridStates[0], this.input);

    if (this.config.mode === 'offline') {
      const diff = CONFIG.DIFFICULTIES[this.config.difficulty];
      // Spread AIs across 3 lanes so they don't all stack on the centreline
      this.aiCars = [
        new AICar(gridStates[1], diff.steeringLookahead, diff.brakingLookahead, -38),
        new AICar(gridStates[2], diff.steeringLookahead, diff.brakingLookahead,   0),
        new AICar(gridStates[3], diff.steeringLookahead, diff.brakingLookahead,  38),
      ];
    } else {
      this.aiCars = [];
    }

    this.allCarStates = [this.player.state, ...this.aiCars.map(a => a.state)];
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

      // Start broadcasting our position in online mode
      if (this.config.mode === 'online' && this.config.network && !this.netSendingActive) {
        this.netSendingActive = true;
        this.config.network.beginSendingState(() => this.player.state);
      }
    }

    // Fetch and submit ranking once when player finishes
    if (!this.rankingFetched && this.player.state.finished) {
      this.rankingFetched = true;
      this.onPlayerFinished();
    }

    if (this.input.isDown('KeyR')) this.restart();
  }

  private onPlayerFinished(): void {
    const time = this.player.state.finishTime;

    if (this.config.mode === 'online' && this.config.network) {
      this.config.network.stopSendingState();
      this.config.network.sendFinished(time);
    }

    // Submit to leaderboard then fetch top 10
    const body = JSON.stringify({ name: this.config.playerName, time });
    fetch('/api/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => { /* ignore — server may not be running */ });

    fetch('/api/ranking?limit=10')
      .then(r => r.json())
      .then((data: { rankings: RankingEntry[] }) => { this.rankingData = data.rankings; })
      .catch(() => { /* ignore */ });
  }

  /** Rank relative to online remote cars (online mode only) */
  private get onlineRank(): number {
    const local = this.player.state;
    let rank = 1;
    for (const remote of (this.config.network?.remoteCars.values() ?? [])) {
      if (
        remote.lapCount > local.lapCount ||
        (remote.lapCount === local.lapCount && remote.waypointIndex > local.waypointIndex)
      ) rank++;
    }
    return rank;
  }

  private get currentRank(): number {
    return this.config.mode === 'online' ? this.onlineRank : this.race.playerRank;
  }

  /** All car states for HUD minimap (local + remote in online mode) */
  private get hudCars(): CarState[] {
    if (this.config.mode === 'offline') return this.allCarStates;
    const remotes = [...(this.config.network?.remoteCars.values() ?? [])]
      .map(r => this.config.network!.remoteCarToState(r));
    return [this.player.state, ...remotes];
  }

  render(ctx: CanvasRenderingContext2D, hudCtx: CanvasRenderingContext2D): void {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;
    const px = this.player.state.position.x;
    const py = this.player.state.position.y;

    // Apply camera transform so the world scrolls around the player
    ctx.save();
    ctx.translate(Math.round(W / 2 - px), Math.round(H / 2 - py));

    renderTrack(ctx, this.def, this.geo, px, py, W, H);

    // Draw AI / offline cars (back-to-front so player renders last = on top)
    for (let i = this.allCarStates.length - 1; i >= 0; i--) {
      drawCar(ctx, this.allCarStates[i], KART_PALETTES[i % KART_PALETTES.length], i === 0);
    }

    // Draw remote players in online mode
    if (this.config.mode === 'online' && this.config.network) {
      let idx = 1;
      for (const remote of this.config.network.remoteCars.values()) {
        const remState = this.config.network.remoteCarToState(remote);
        drawCar(ctx, remState, KART_PALETTES[idx % KART_PALETTES.length], false);
        idx++;
      }
    }

    ctx.restore();

    renderHUD(
      hudCtx,
      this.player.state,
      this.race,
      this.geo,
      this.hudCars,
      this.currentRank,
      W, H,
      this.rankingData ?? undefined,
    );
  }

  get isFinished(): boolean {
    return this.race.phase === 'finished' && this.player.state.finished;
  }

  get gameMode(): 'offline' | 'online' {
    return this.config.mode;
  }

  disconnect(): void {
    this.config.network?.disconnect();
  }

  restart(): void {
    this.disconnect();
    this.init();
  }
}
