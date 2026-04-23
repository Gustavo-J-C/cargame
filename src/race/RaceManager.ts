import { CarState } from '../car/CarPhysics';
import { TrackGeometry } from '../track/TrackData';
import { CONFIG } from '../config';

export type RacePhase = 'countdown' | 'racing' | 'finished';

export interface RaceState {
  phase: RacePhase;
  countdown: number;       // seconds remaining
  rankings: number[];      // car indices sorted by race position (best first)
  playerRank: number;      // 1-based
  raceTime: number;
}

export class RaceManager {
  public phase: RacePhase = 'countdown';
  public countdown = 3.0;
  public goDisplayTime = 0; // how long to keep showing VÁ! after countdown ends
  public raceTime = 0;
  public rankings: number[] = [];
  public playerRank = 1;

  constructor(private cars: CarState[], private geo: TrackGeometry) {}

  update(dt: number): void {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.phase = 'racing';
        this.goDisplayTime = 0.7; // show VÁ! for 0.7s after starting
      }
      return;
    }

    if (this.phase === 'racing') {
      this.raceTime += dt;
      if (this.goDisplayTime > 0) this.goDisplayTime -= dt;
      this.updateWaypoints();
      this.updateRankings();

      if (this.cars[0].finished) {
        this.phase = 'finished';
      }
    }
  }

  private updateWaypoints(): void {
    const n = this.geo.centerline.length;
    const reachDist = CONFIG.WAYPOINT_REACH_DIST;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.finished) continue;

      const nextIdx = (car.waypointIndex + 1) % n;
      const next = this.geo.centerline[nextIdx];

      if (car.position.distTo(next) < reachDist) {
        const prev = car.waypointIndex;
        car.waypointIndex = nextIdx;

        // Lap completed: wrapped from near-end back to near-start
        if (nextIdx < prev && nextIdx < n * 0.1 && prev > n * 0.9) {
          car.lapCount++;
          if (car.lapCount >= CONFIG.TOTAL_LAPS) {
            car.finished = true;
            car.finishTime = this.raceTime;
          }
        }
      }
    }
  }

  private updateRankings(): void {
    const indices = this.cars.map((_, i) => i);
    indices.sort((a, b) => {
      const ca = this.cars[a];
      const cb = this.cars[b];
      if (ca.lapCount !== cb.lapCount) return cb.lapCount - ca.lapCount;
      return cb.waypointIndex - ca.waypointIndex;
    });
    this.rankings = indices;
    this.playerRank = this.rankings.indexOf(0) + 1;
  }

  get countdownDisplay(): string {
    if (this.countdown > 2) return '3';
    if (this.countdown > 1) return '2';
    if (this.countdown > 0) return '1';
    return 'VÁ!';
  }
}
