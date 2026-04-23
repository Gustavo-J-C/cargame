import { CarState } from '../car/CarPhysics';
import { Vector2 } from '../utils/math';

export interface RemoteCar {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  lapCount: number;
  waypointIndex: number;
}

type ServerMsg =
  | { type: 'created'; code: string; playerId: number }
  | { type: 'joined'; playerId: number; names: string[] }
  | { type: 'error'; message: string }
  | { type: 'playerJoined'; name: string; id: number }
  | { type: 'start' }
  | { type: 'state'; id: number; x: number; y: number; angle: number; speed: number; lapCount: number; waypointIndex: number }
  | { type: 'playerLeft'; id: number }
  | { type: 'playerFinished'; id: number; time: number };

export class NetworkManager {
  private ws!: WebSocket;
  private sendTimer: ReturnType<typeof setInterval> | null = null;

  roomCode = '';
  playerId = -1;
  playerNames: string[] = [];
  remoteCars = new Map<number, RemoteCar>();

  onRoomCreated?: (code: string) => void;
  onJoined?: (id: number, names: string[]) => void;
  onPlayerJoined?: (name: string, id: number) => void;
  onStart?: () => void;
  onPlayerLeft?: (id: number) => void;
  onPlayerFinished?: (id: number, time: number) => void;
  onError?: (msg: string) => void;

  connect(): Promise<void> {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${proto}//${location.host}/ws`);
        this.ws.onopen = () => resolve();
        this.ws.onerror = () => reject(new Error('Falha ao conectar ao servidor'));
        this.ws.onmessage = (e) => {
          try { this.handle(JSON.parse(e.data as string) as ServerMsg); } catch { /* ignore */ }
        };
        this.ws.onclose = () => {
          if (this.sendTimer) { clearInterval(this.sendTimer); this.sendTimer = null; }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handle(msg: ServerMsg): void {
    switch (msg.type) {
      case 'created':
        this.roomCode = msg.code;
        this.playerId = msg.playerId;
        this.playerNames = ['Você'];
        this.onRoomCreated?.(msg.code);
        break;
      case 'joined':
        this.playerId = msg.playerId;
        this.playerNames = msg.names;
        this.onJoined?.(msg.playerId, msg.names);
        break;
      case 'error':
        this.onError?.(msg.message);
        break;
      case 'playerJoined':
        this.playerNames.push(msg.name);
        this.onPlayerJoined?.(msg.name, msg.id);
        break;
      case 'start':
        this.onStart?.();
        break;
      case 'state':
        this.remoteCars.set(msg.id, {
          id: msg.id, x: msg.x, y: msg.y,
          angle: msg.angle, speed: msg.speed,
          lapCount: msg.lapCount, waypointIndex: msg.waypointIndex,
        });
        break;
      case 'playerLeft':
        this.remoteCars.delete(msg.id);
        this.onPlayerLeft?.(msg.id);
        break;
      case 'playerFinished':
        this.onPlayerFinished?.(msg.id, msg.time);
        break;
    }
  }

  createRoom(name: string): void { this.send({ type: 'create', name }); }
  joinRoom(name: string, code: string): void { this.send({ type: 'join', name, code: code.toUpperCase().trim() }); }
  startRace(): void { this.send({ type: 'start' }); }

  beginSendingState(getState: () => CarState, intervalMs = 50): void {
    if (this.sendTimer) clearInterval(this.sendTimer);
    this.sendTimer = setInterval(() => {
      const s = getState();
      this.send({
        type: 'state',
        x: Math.round(s.position.x),
        y: Math.round(s.position.y),
        angle: +s.angle.toFixed(4),
        speed: Math.round(s.speed),
        lapCount: s.lapCount,
        waypointIndex: s.waypointIndex,
      });
    }, intervalMs);
  }

  stopSendingState(): void {
    if (this.sendTimer) { clearInterval(this.sendTimer); this.sendTimer = null; }
  }

  sendFinished(time: number): void { this.send({ type: 'finished', time }); }

  remoteCarToState(remote: RemoteCar): CarState {
    return {
      position: new Vector2(remote.x, remote.y),
      angle: remote.angle,
      velocity: new Vector2(0, 0),
      speed: remote.speed,
      throttle: 0, brake: 0, steer: 0,
      waypointIndex: remote.waypointIndex,
      lapCount: remote.lapCount,
      finished: false,
      finishTime: 0,
    };
  }

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.stopSendingState();
    this.ws?.close();
    this.remoteCars.clear();
  }
}
